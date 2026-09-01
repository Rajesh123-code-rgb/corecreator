/**
 * Seeds the art-form categories from src/lib/artForms.json.
 *
 * Every art form becomes two rows: a `product` category on the bare slug and a
 * `course` category on the same slug with "-course" appended. That suffix is
 * not decoration - `slug` carries a unique index across the whole collection
 * rather than per type, which is how the categories already in the database
 * work around it.
 *
 * Safe to run repeatedly. Rows are matched on slug: an existing one has its
 * name, description and display order updated, and `isActive` is left alone so
 * a category the admin switched off does not come back on the next run.
 *
 * Nothing is deleted, and near-duplicates are reported rather than merged.
 * "Madhubani Art" already exists and this list adds "Madhubani Painting";
 * whether those are one category or two is a decision about the catalogue, not
 * one a seed script should make on its own.
 *
 *   node scripts/seed-categories.mjs            # apply
 *   node scripts/seed-categories.mjs --dry-run  # report only
 */
import mongoose from "mongoose";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry-run");

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("MONGODB_URI is not set. Run from the app directory with:");
    console.error("  set -a; . ./.env.production; set +a; node scripts/seed-categories.mjs");
    process.exit(1);
}

const groups = JSON.parse(readFileSync(join(HERE, "..", "src", "lib", "artForms.json"), "utf8"));
const forms = groups.flatMap((g) => g.forms);

await mongoose.connect(uri);
const col = mongoose.connection.db.collection("categories");

const existing = await col.find({}, { projection: { slug: 1, name: 1, type: 1 } }).toArray();
const bySlug = new Map(existing.map((c) => [c.slug, c]));

let inserted = 0, updated = 0;
const rows = [];
forms.forEach((form, i) => {
    rows.push({ ...form, type: "product", slug: form.slug, order: i + 1 });
    rows.push({ ...form, type: "course", slug: `${form.slug}-course`, order: i + 1 });
});

for (const row of rows) {
    const hit = bySlug.get(row.slug);
    if (hit) updated++; else inserted++;
    if (DRY) continue;
    await col.updateOne(
        { slug: row.slug },
        {
            $set: { name: row.name, description: row.description, type: row.type, order: row.order },
            // Only on insert, so an admin who deactivated or reordered a
            // category does not have that undone every time this runs.
            $setOnInsert: { isActive: true, productCount: 0, createdAt: new Date() },
            $currentDate: { updatedAt: true },
        },
        { upsert: true }
    );
}

// Anything already in the database whose name looks like one of ours but sits
// on a different slug. Flagged for a human, never touched.
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ourNames = forms.map((f) => ({ n: norm(f.name), name: f.name, slug: f.slug }));
const dupes = [];
for (const c of existing) {
    if (!c.name || rows.some((r) => r.slug === c.slug)) continue;
    const cn = norm(c.name);
    const near = ourNames.find((o) => o.n.startsWith(cn.slice(0, 6)) || cn.startsWith(o.n.slice(0, 6)));
    if (near) dupes.push(`${c.name} (${c.type}, ${c.slug})  ~  ${near.name} (${near.slug})`);
}

console.log(`${DRY ? "[dry run] " : ""}art forms: ${forms.length}   rows: ${rows.length}`);
console.log(`  inserted: ${inserted}   updated in place: ${updated}`);
if (dupes.length) {
    console.log("\n  Possible duplicates already in the database - not modified:");
    dupes.forEach((d) => console.log("    " + d));
    console.log("  Merge or deactivate these in admin if they are the same thing.");
}

await mongoose.disconnect();
