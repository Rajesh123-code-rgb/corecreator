/**
 * Boots a throwaway MongoDB for local review and keeps it running.
 *
 * The alternative was pointing local development at the production database,
 * which risks writing to real orders while investigating a layout bug. This
 * runs in-process, needs no Docker, and vanishes when the process is killed.
 *
 *   node scripts/local-mongo.mjs     # then `npm run dev` in another shell
 */
import { MongoMemoryServer } from "mongodb-memory-server";

const mongo = await MongoMemoryServer.create({
    instance: { port: 27017, dbName: "corecreator-local" },
});

console.log(`LOCAL_MONGO_READY ${mongo.getUri()}`);

const shutdown = async () => { await mongo.stop(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
setInterval(() => {}, 1 << 30);
