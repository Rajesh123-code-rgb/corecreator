# Downloading the whole project — code and database

Two projects, two procedures, because their data lives in different places.
Getting this wrong is the classic backup failure: copying the application
directory, seeing a large tarball, and discovering months later that the
database was never in it.

    corecreator   database is MongoDB Atlas, off-server  -> dump over the network
    omnichannel   database is Postgres in a Docker volume -> dump inside the container

In neither case does copying /opt/<app> capture the data.

## Core Creator

One command on the server:

    cd /opt/corecreator && ./scripts/backup.sh

Then, from your own machine, pull it down and verify it:

    scp root@<server-ip>:/root/cc-backup.tar.gz ~/Documents/
    cd ~/Documents && tar xzf cc-backup.tar.gz && cd cc-backup
    shasum -a 256 -c SHA256SUMS

What you get:

    db/corecreator/*.bson          every collection, via mongodump
    corecreator-app.tar.gz         the code, INCLUDING .env.production
    config/                        nginx server block and the certificate lineage
    meta/deployed-commit.txt       which commit was live
    SHA256SUMS                     checksum of every file

The script refuses to finish if the dump produced no collections. That guard
exists because mongodump exits 0 when handed a URI that is still wrapped in
quotes - it writes an empty directory and reports success, which is
indistinguishable from a real backup until you count the files.

### Restoring

    mongorestore --uri="<MONGODB_URI>" --drop db/

Use --drop only when you intend to replace what is there. Without it the
restore merges, which is rarely what you want and never what you expect.

The code is on GitHub, so the tarball matters mainly for `.env.production` -
the one thing not in version control and not reproducible.

## Omnichannel

Postgres lives in a Docker volume, so it must come out through the container.
A copy of the volume directory alone is version-locked and will not load into a
different Postgres release.

    docker exec omnichannel-db pg_dump -U omnichannel -d omnichannel -Fc > omnichannel.dump
    docker exec omnichannel-db pg_dumpall -U omnichannel --globals-only > globals.sql
    tar czf omnichannel-app.tar.gz -C /opt omnichannel

Redis holds sessions and cache only, so it is optional:

    docker run --rm -v omnichannel_redis_data:/v:ro -v $PWD:/out alpine \
        tar czf /out/redis_data.tar.gz -C /v .

Restore:

    docker exec -i omnichannel-db psql -U omnichannel -d postgres < globals.sql
    docker exec -i omnichannel-db pg_restore -U omnichannel -d omnichannel --clean --if-exists < omnichannel.dump

## Verifying a backup is real

A backup you have not checked is a hope, not a backup. Two questions:

**Did the database actually come out?** Count what you got and compare it
against the live system - not just the file size.

    find db -name '*.bson' | wc -l                       # Core Creator
    grep -c '^COPY public' omnichannel.sql               # omnichannel

**Do the row counts match?** For Postgres, the plain-SQL dump can be counted
directly:

    awk '/^COPY public.messages /{f=1;next} f&&/^\\\./{exit} f{c++} END{print c}' omnichannel.sql

## Where backups should live

Not on the server they came from, and not in only one place. Both current
backups exist solely on one laptop, which is one spilled coffee from being no
backup at all. A copy in cloud storage costs nothing at these sizes.

Atlas free-tier (M0) clusters have no automated backups. If that is the tier in
use, this dump is the only copy of the production database that exists.
