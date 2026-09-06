# Core Creator — working rules

Read this before doing anything in this repository.

## 1. Never deploy, and never write to the server

Putting code on the VPS and changing what is running are **the account owner's
alone**. No agent performs them, under any phrasing of the request - including
"deploy it", "push it live", or "just restart it".

**Never, on the server:**

    git pull, git checkout, or any write to /opt/corecreator
    ./deploy.sh
    docker compose up / down / restart / build / recreate
    editing .env.production, nginx config, certificates, crontab
    seed or migration scripts run against the production database
    installing packages, changing firewall or SSH configuration

**Allowed, because reading breaks nothing** - an SSH key is kept for exactly
this, and it is how the course-submit failure and the Brevo rejection were both
diagnosed:

    docker logs / docker inspect / docker ps
    curl http://127.0.0.1:3002/api/health
    reading /var/log/nginx/*.log and /var/log/cc-*.log
    git log / git status / reading files
    read-only database queries

The line between them is whether it changes state, not whether it feels risky.

If a change cannot be verified without crossing that line, **say so plainly and
stop**. Do not run it to "check first" - that is the exact move this rule exists
to prevent.

What to do instead: finish the change, commit, push, and hand over the commands.
Copy-pasteable, in order, with what each does and what success looks like. That
has always been the convention here; the difference now is that the commands
stop with you.

## 2. Plan before changing anything

Every change starts with a written plan, and waits for approval before a line is
edited. The plan says what will change, which files, why, what could break, and
how it will be verified.

This applies to bug fixes and one-line edits as much as to features. If the plan
turns out to be wrong once work starts, stop and re-plan rather than improvising
past it.

Investigation is not a change: reading code, searching, reading logs and
reproducing a bug locally need no plan. Editing a file does.

## Branching

Work on `office`. Never commit or push to `main` directly - the owner merges.

## Local verification

Run the site locally rather than testing on production:

    node scripts/local-mongo.mjs      # in-memory MongoDB on 27017
    npm run dev

Build with a dummy connection string, or the build stops at "Collecting page
data" and hides real errors:

    MONGODB_URI="mongodb://127.0.0.1:27017/x" NEXTAUTH_SECRET=x \
    NEXTAUTH_URL=https://corecreator.online RAZORPAY_KEY_ID=rzp_test_x \
    RAZORPAY_KEY_SECRET=x npm run build

`npx tsc --noEmit` must be clean before any commit.

## Changelog

When a phase completes, add an entry to `CHANGELOG.md` describing what changed
and why - the reasoning matters more than the file list.

## Architecture worth knowing

- One Next.js app serves three hostnames. `src/middleware.ts` routes on the
  `Host` header; the portals show clean URLs (`studio.corecreator.online/orders`
  serves `/studio/orders`). Sessions are deliberately not shared between them.
- The database is MongoDB **Atlas**, not on the VPS. The server holds no durable
  state, which is why it can be rebuilt or replaced freely.
- `Category.slug` is uniquely indexed across the whole collection, not per type.
  Non-product categories carry a type suffix (`kintsugi` / `kintsugi-course`).
- Images, video, email and payments are external services addressed by domain,
  so a server move does not affect them - but Atlas, Brevo and Bunny can all
  restrict by IP.
