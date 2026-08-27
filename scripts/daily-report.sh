#!/bin/bash
# Core Creator daily status report.
#
# Runs once a day from cron and emails what happened in the last 24 hours:
# server errors, application errors, traffic, resources and certificate expiry.
#
# It sends every day, including quiet ones. A monitor that only writes when
# something breaks is indistinguishable from a monitor that has stopped running.
#
# Email goes through Brevo, reusing the key the application already has.
set -uo pipefail

APP_DIR="${APP_DIR:-/opt/corecreator}"
HEALTH_URL=http://127.0.0.1:3002/api/health
CONTAINER=corecreator_app
ACCESS_LOG=/var/log/nginx/access.log

cd "$APP_DIR" || exit 1
set -a; . ./.env.production 2>/dev/null; set +a
TO="${ALERT_EMAIL:-raj070878@gmail.com}"
FROM="${BREVO_SENDER_EMAIL:-noreply@corecreator.online}"

REPORT=$(ACCESS_LOG="$ACCESS_LOG" CONTAINER="$CONTAINER" python3 - <<'PY'
import re, os, glob, subprocess, datetime, collections
cut = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)
pat = re.compile(r'^(\S+).*\[([^\]]+)\]\s+"(\S+)\s+(\S+)[^"]*"\s+(\d{3})')
codes, paths, fivexx, ips = collections.Counter(), collections.Counter(), [], set()
for f in [os.environ["ACCESS_LOG"]] + glob.glob(os.environ["ACCESS_LOG"] + ".1"):
    try: fh = open(f, errors="ignore")
    except OSError: continue
    for line in fh:
        m = pat.match(line)
        if not m: continue
        try: t = datetime.datetime.strptime(m.group(2), "%d/%b/%Y:%H:%M:%S %z")
        except ValueError: continue
        if t < cut: continue
        ips.add(m.group(1)); codes[m.group(5)] += 1
        paths[m.group(4).split("?")[0]] += 1
        if m.group(5).startswith("5"):
            fivexx.append(f'{m.group(5)}  {m.group(3)} {m.group(4)[:70]}')
        # A rejected Razorpay webhook means a buyer may have paid and received
        # nothing, so it is called out separately rather than lost among 4xx.
        if "webhooks/razorpay" in m.group(4) and m.group(5).startswith("4"):
            fivexx.append(f'{m.group(5)}  WEBHOOK REJECTED {m.group(4)[:60]}')

logs = subprocess.run(["docker", "logs", "--since", "24h", os.environ["CONTAINER"]],
                      capture_output=True, text=True)
app_err = [l for l in (logs.stderr + logs.stdout).splitlines()
           if re.search(r"error|exception|unhandled", l, re.I)]

total = sum(codes.values())
ok = "#15803d"; bad = "#b91c1c"
def row(k, v, c=""):
    return (f"<tr><td style='padding:3px 16px 3px 0;color:#555'>{k}</td>"
            f"<td style='{c}'><b>{v}</b></td></tr>")

h = [f"<div style='font:14px/1.5 system-ui,sans-serif;max-width:640px'>"]
h.append("<h2 style='margin:0 0 4px'>Core Creator &mdash; last 24 hours</h2>")
h.append("<table style='margin:12px 0'>")
h.append(row("Requests", f"{total:,}"))
h.append(row("Distinct visitors", f"{len(ips):,}"))
for c in sorted(codes):
    style = f"color:{bad}" if c.startswith("5") else ""
    h.append(row(f"&nbsp;&nbsp;{c}", f"{codes[c]:,}", style))
h.append(row("Application errors", len(app_err), f"color:{bad if app_err else ok}"))
h.append("</table>")

if fivexx:
    h.append(f"<h3 style='color:{bad};margin-bottom:4px'>Errors needing attention</h3>")
    h.append("<pre style='font-size:12px;background:#fef2f2;padding:10px;overflow-x:auto'>"
             + "\n".join(fivexx[:25]) + "</pre>")
else:
    h.append(f"<p style='color:{ok}'><b>No server errors and no rejected webhooks.</b></p>")

if app_err:
    h.append("<h3 style='margin-bottom:4px'>Application log</h3>")
    h.append("<pre style='font-size:12px;background:#f8f8f8;padding:10px;overflow-x:auto'>"
             + "\n".join(l[:150] for l in app_err[:15]) + "</pre>")

h.append("<h3 style='margin-bottom:4px'>Most requested</h3><table>")
for p, n in paths.most_common(8):
    h.append(row(p[:58], f"{n:,}"))
h.append("</table>")
print("".join(h))
PY
)

HEALTH=$(curl -s --max-time 15 "$HEALTH_URL" 2>/dev/null)
echo "$HEALTH" | grep -q '"database":"ok"' && STATUS="<p style='color:#15803d'><b>Site up, database reachable.</b></p>" \
                                           || STATUS="<p style='color:#b91c1c'><b>WARNING: health check failed &mdash; ${HEALTH:-no response}</b></p>"
UPH=$(echo "$HEALTH" | python3 -c 'import sys,json;print(json.load(sys.stdin)["uptimeSeconds"]//3600)' 2>/dev/null || echo "?")
DAYS=$(( ( $(date -d "$(openssl x509 -in /etc/letsencrypt/live/corecreator.online/fullchain.pem -noout -enddate | cut -d= -f2)" +%s) - $(date +%s) ) / 86400 ))
HL=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER 2>/dev/null)
RC=$(docker inspect --format='{{.RestartCount}}' $CONTAINER 2>/dev/null)

FOOTER="<h3 style='margin-bottom:4px'>Server</h3>
<pre style='font-size:12px;background:#f8f8f8;padding:10px'>container  $HL, $RC restarts, up ${UPH}h
disk       $(df -h / | awk 'NR==2{print $3" of "$2"  ("$5" used)"}')
memory     $(free -m | awk '/^Mem:/{print $3" of "$2" MB"}')    swap $(free -m | awk '/^Swap:/{print $3" of "$2" MB"}')
load       $(uptime | sed 's/.*average: //')
TLS        renews in $DAYS days
build      $(git -C "$APP_DIR" log --oneline -1 2>/dev/null)</pre>
<p style='color:#888;font-size:12px'>$(hostname) &middot; $(date -u '+%Y-%m-%d %H:%M UTC') &middot; scripts/daily-report.sh</p></div>"

SUBJ="Core Creator daily report - $(date -u '+%d %b')"
BODY="${STATUS}${REPORT}${FOOTER}"

[ -n "${BREVO_API_KEY:-}" ] || { echo "BREVO_API_KEY missing"; exit 1; }
SUBJ="$SUBJ" BODY="$BODY" FROM="$FROM" TO="$TO" python3 - <<'PY'
import json, os, urllib.request
p = {"sender": {"name": "Core Creator Monitor", "email": os.environ["FROM"]},
     "to": [{"email": os.environ["TO"]}],
     "subject": os.environ["SUBJ"], "htmlContent": os.environ["BODY"]}
r = urllib.request.Request("https://api.brevo.com/v3/smtp/email",
      data=json.dumps(p).encode(), method="POST",
      headers={"api-key": os.environ["BREVO_API_KEY"], "content-type": "application/json"})
try:
    urllib.request.urlopen(r, timeout=25)
    print("report sent to " + os.environ["TO"])
except Exception as e:
    print("send FAILED:", e)
PY
