# Migrating Core Creator to a new Hostinger VPS

Moves **only** the `corecreator` app. The `omnichannel` stack (web, api,
Postgres 16, Redis 7) stays on the old VPS and is not touched at any point.

## Why this migration has no downtime

The app holds no durable state of its own:

| Thing | Where it lives | Moves? |
|---|---|---|
| Database | MongoDB **Atlas** | No - stays put |
| Images | Cloudinary | No |
| Video | Bunny Stream | No |
| Email | Brevo | No |
| Payments | Razorpay | No |
| Code | GitHub | Cloned fresh |

The server is a stateless frontend. Two of them can serve the same domain at
the same time, from the same database, with identical results. That removes the
usual migration hazards entirely: no dump/restore, no maintenance window, no
split brain, no orders stranded on the old box, and no rush once DNS is flipped
because a visitor on stale DNS still reaches a fully working site.

**Rollback is a DNS revert.** The old server stays running and correct
throughout, so undoing the cutover takes one record change and no redeploy.

## The one thing that will break it

**Atlas IP allowlist.** The new VPS has a new IP. If it is not allowlisted, the
site builds, starts and serves - and every page returns 503 with
`"database":"unreachable"`. Do this before Stage 3, not after.

Two other services can be IP-bound and fail silently rather than loudly:

- **Brevo** - API keys support an authorised-IP restriction. If one is set,
  email stops on the new box and reads like an application regression.
- **Bunny Stream** - the library can restrict allowed IPs/referrers.

Razorpay is URL-based and needs no change.

---

## Stage 0 - before you start

Set the target once. Every later block reuses it.

```bash
export NEW_IP=<new.vps.ip.here>
```

1. **Atlas -> Network Access** - add `$NEW_IP`. Keep the old IP until Stage 5.
2. **Brevo and Bunny** - check for IP restrictions; add `$NEW_IP` if present.
3. **DNS TTLs** - in hPanel, set `@`, `studio` and `admin` to **300**.
   `studio` and `admin` are currently **14400**, so without this they point at
   the old box for up to four hours after cutover. Do this at least one full
   TTL ahead - it is the only step with a lead time.

## Stage 1 - prepare the new VPS

```bash
# on the NEW box, as root
apt update && apt upgrade -y
apt install -y git nginx rsync curl certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sh
```

Swap, if the new box has less than 8 GB of RAM. The Next build wants 2-4 GB and
does not fail cleanly when it cannot get it - it thrashes, which is what a
ten-minute hanging deploy looks like:

```bash
free -m | head -2                       # check first; skip if >= 8 GB
fallocate -l 4G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Firewall - 3002 is deliberately absent; the app now binds to loopback:

```bash
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
```

## Stage 2 - carry across config and certificates

Certificates are bound to the **domain**, not the IP, so copying them means the
new server can present a valid certificate the instant traffic arrives. No
HTTPS gap, and no certbot run against a domain that does not point at you yet.

Set up a key from old to new:

```bash
# on the OLD box
export NEW_IP=<new.vps.ip.here>
[ -f ~/.ssh/migrate ] || ssh-keygen -t ed25519 -N "" -f ~/.ssh/migrate
ssh-copy-id -i ~/.ssh/migrate.pub root@$NEW_IP
```

Copy the three things GitHub cannot give you:

```bash
# on the OLD box
rsync -az -e "ssh -i ~/.ssh/migrate" /etc/letsencrypt/ root@$NEW_IP:/etc/letsencrypt/
rsync -az -e "ssh -i ~/.ssh/migrate" /etc/nginx/sites-available/corecreator \
      root@$NEW_IP:/etc/nginx/sites-available/corecreator
rsync -az -e "ssh -i ~/.ssh/migrate" /opt/corecreator/.env.production \
      root@$NEW_IP:/root/.env.production.staged
```

`-a` preserves the symlinks under `/etc/letsencrypt/live/`, which point into
`archive/`. Do not add `--copy-links`; it breaks renewal.

The nginx config is **copied rather than rewritten** on purpose. It already
carries whatever was tuned on the old box - `client_max_body_size` for uploads,
proxy timeouts, and certbot's managed TLS block. Re-authoring it risks losing a
setting nobody remembers adding. Confirm it forwards the host header, since the
three portals are routed entirely by it:

```bash
# on the NEW box
grep -E 'proxy_set_header|client_max_body_size|server_name' \
     /etc/nginx/sites-available/corecreator
```

`proxy_set_header Host $host;` must be present. Without it every hostname
resolves to the storefront and both portals disappear.

If the repo is cloned over SSH on the old box (`git remote -v` starts with
`git@`), also copy the deploy key:

```bash
# on the OLD box, only if the remote is git@github.com
rsync -az -e "ssh -i ~/.ssh/migrate" ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub \
      ~/.ssh/known_hosts root@$NEW_IP:/root/.ssh/
```

## Stage 3 - build on the new box

```bash
# on the NEW box
cd /opt
git clone <your-repo-url> corecreator
cd corecreator
git checkout main
mv /root/.env.production.staged .env.production
chmod 600 .env.production
grep -c '^AUTH_TRUST_HOST' .env.production      # must print 1
ln -sf /etc/nginx/sites-available/corecreator /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
chmod +x deploy.sh && ./deploy.sh
```

`AUTH_TRUST_HOST` is load-bearing. NextAuth derives its origin per request only
when it is set; without it every sign-in on `studio.` and `admin.` is issued
against the apex and fails.

Local check before anyone else can reach it:

```bash
curl -s http://127.0.0.1:3002/api/health          # {"status":"ok","database":"ok"}
curl -s -o /dev/null -w '%{http_code}\n' http://<NEW_IP>:3002/api/health   # want: no response
```

The second must **fail**. If it returns 200 the loopback binding did not take -
check that `docker-compose.prod.yml` reads `127.0.0.1:3002:3000`.

## Stage 4 - verify against the real domain, before DNS

`--resolve` sends the real hostname and SNI to the new IP without touching DNS
or `/etc/hosts`. Real domain, real certificate, real portal routing, while the
public site is still served by the old box:

```bash
for h in corecreator.online www.corecreator.online \
         studio.corecreator.online admin.corecreator.online; do
  printf '%-32s %s\n' "$h" \
    "$(curl -s -o /dev/null -w '%{http_code}' --resolve "$h:443:$NEW_IP" "https://$h/")"
done

curl -s --resolve "corecreator.online:443:$NEW_IP" https://corecreator.online/api/health
```

Expect 200 on the apex and www. The portals redirect to their login pages.
A certificate error here means the `/etc/letsencrypt` copy did not land.

Then, in a browser with a hosts-file override, walk the paths that have broken
before:

- `/` , `/marketplace`, a product page, `/cart`, `/checkout`
- `studio.` -> `/login`, then `/dashboard`, `/products`, `/workshops`, `/returns`
- `admin.` -> `/login`, then `/dashboard`, `/orders`, `/email-templates`,
  `/workshops`, `/returns`, `/shipping`
- an admin **Send test** email, to prove Brevo is not IP-restricted

## Stage 5 - cutover

In hPanel DNS, change three A records to `$NEW_IP`:

| Record | Type | Value |
|---|---|---|
| `@` | A | `$NEW_IP` |
| `studio` | A | `$NEW_IP` |
| `admin` | A | `$NEW_IP` |

`www` is a CNAME to the apex and follows automatically.

Watch it land:

```bash
watch -n 30 'dig +short corecreator.online studio.corecreator.online admin.corecreator.online'
```

Nothing needs stopping on the old box. It keeps serving correctly to anyone on
stale DNS, against the same Atlas database.

## Stage 6 - decommission, after 72 hours of clean logs

```bash
# on the OLD box
cd /opt/corecreator && docker compose -f docker-compose.prod.yml down
rm /etc/nginx/sites-enabled/corecreator && nginx -t && systemctl reload nginx
```

`omnichannel` is untouched by both commands. Then remove the old IP from the
Atlas allowlist, and from Brevo and Bunny if they were restricted.

Finally, restore the DNS TTLs to 3600 once you are confident.

## Rollback

At any point before Stage 6, point the three A records back at `72.60.96.113`.
The old container is still running and still correct. No redeploy, no restore.

## What this migration does not fix

Three writes go to the container filesystem, which has no volume. They are lost
on every `deploy.sh` today and will not carry to the new box:

- `src/app/api/upload/video/route.ts` - local video fallback, used only when
  Bunny Stream is unconfigured
- `src/app/api/admin/seo/config/route.ts` - the admin robots.txt editor
- `src/app/api/admin/seo/redirects/route.ts` - redirects.json

Tracked separately. They are pre-existing, not caused by the migration.
