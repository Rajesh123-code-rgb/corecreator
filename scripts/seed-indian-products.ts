/**
 * Seed Script: Indian Art & Craft 100 Products
 * 
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." npx ts-node -e "require('./scripts/seed-indian-products')"
 *   OR just: npx ts-node scripts/seed-indian-products.ts
 * 
 * The script reads MONGODB_URI from environment or .env.local
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set. Add it to .env.local or pass it as an environment variable.");
    process.exit(1);
}

// ── Inline Product Schema (matches the app's Product model) ──────────────────

const productSchema = new mongoose.Schema({
    name: String,
    slug: { type: String, unique: true },
    description: String,
    shortDescription: String,
    category: String,
    tags: [String],
    price: Number,
    compareAtPrice: Number,
    currency: { type: String, default: "INR" },
    quantity: { type: Number, default: 5 },
    sku: String,
    images: [{ url: String, isPrimary: Boolean, alt: String }],
    status: { type: String, default: "active" },
    productType: { type: String, default: "physical" },
    seller: mongoose.Schema.Types.ObjectId,
    sellerName: String,
    isFeatured: { type: Boolean, default: false },
    salesCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Auto-generate slug
productSchema.pre("save", function (next: any) {
    if (!this.slug) {
        this.slug = (this as any).name
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .substring(0, 80);
    }
    next();
});

// ── 100 Indian Art & Craft Products ─────────────────────────────────────────

const INDIAN_PRODUCTS = [
    { name: "Ocean Wave Resin Art | Blue Tidal Wall Décor", category: "Resin Art", price: 1299, tags: ["resin", "wall decor", "ocean", "blue"] },
    { name: "Resin Coaster Set | Gold-Flecked Agate Design", category: "Resin Art", price: 799, tags: ["resin", "coaster", "gold", "agate"] },
    { name: "Resin River Table Bookmark | Wooden Inlay", category: "Resin Art", price: 349, tags: ["resin", "bookmark", "river", "wooden"] },
    { name: "Resin Jewellery Tray | Peacock Feather Embed", category: "Resin Art", price: 599, tags: ["resin", "jewellery", "peacock", "tray"] },
    { name: "Resin Keychain | Galaxy Glitter Drop", category: "Resin Art", price: 199, tags: ["resin", "keychain", "galaxy", "glitter"] },
    { name: "Madhubani Painting | Fish Pair Bridal Motif", category: "Madhubani Art", price: 2499, tags: ["madhubani", "painting", "fish", "bridal", "folk art"] },
    { name: "Madhubani Wall Art | Lord Ganesha in Traditional Style", category: "Madhubani Art", price: 1799, tags: ["madhubani", "ganesha", "wall art", "traditional"] },
    { name: "Madhubani Canvas Print | Dancing Peacock", category: "Madhubani Art", price: 999, tags: ["madhubani", "peacock", "canvas", "print"] },
    { name: "Madhubani Greeting Card Set | Festive Collection", category: "Madhubani Art", price: 399, tags: ["madhubani", "greeting card", "festive"] },
    { name: "Madhubani Lampshade | Madhubani Motifs", category: "Madhubani Art", price: 1499, tags: ["madhubani", "lampshade", "motifs"] },
    { name: "Warli Art Canvas | Village Life Scene", category: "Warli Art", price: 1899, tags: ["warli", "canvas", "village", "tribal art"] },
    { name: "Warli Print Cushion Cover | Tribal Dance Pattern", category: "Warli Art", price: 499, tags: ["warli", "cushion", "tribal", "dance"] },
    { name: "Warli Bamboo Tray | Forest Theme", category: "Warli Art", price: 749, tags: ["warli", "bamboo", "forest", "tray"] },
    { name: "Warli Art Notebook | A5 Handmade Cover", category: "Warli Art", price: 299, tags: ["warli", "notebook", "handmade"] },
    { name: "Warli Art Wall Clock | Bamboo Frame", category: "Warli Art", price: 1199, tags: ["warli", "wall clock", "bamboo"] },
    { name: "Kalamkari Wall Tapestry | Mahabharata Battle Scene", category: "Kalamkari", price: 3999, tags: ["kalamkari", "tapestry", "mahabharata", "wall art"] },
    { name: "Kalamkari Saree | Black & White Mythological Print", category: "Kalamkari", price: 2799, tags: ["kalamkari", "saree", "mythological"] },
    { name: "Kalamkari Tote Bag | Hand-painted Lotus Design", category: "Kalamkari", price: 849, tags: ["kalamkari", "tote bag", "lotus", "handpainted"] },
    { name: "Kalamkari Dupatta | Peacock Border Motif", category: "Kalamkari", price: 1599, tags: ["kalamkari", "dupatta", "peacock"] },
    { name: "Kalamkari Table Runner | Star & Floral Pattern", category: "Kalamkari", price: 699, tags: ["kalamkari", "table runner", "floral"] },
    { name: "Dhokra Brass Elephant Figurine | Tribal Solid Cast", category: "Dhokra Craft", price: 1799, tags: ["dhokra", "brass", "elephant", "tribal"] },
    { name: "Dhokra Dokra Jewellery Set | Necklace & Earrings", category: "Dhokra Craft", price: 1299, tags: ["dhokra", "jewellery", "necklace", "earrings"] },
    { name: "Dhokra Wall Hanging | Tribal Mask Face", category: "Dhokra Craft", price: 2199, tags: ["dhokra", "wall hanging", "tribal mask"] },
    { name: "Dhokra Candle Stand | Tribal Horse Design", category: "Dhokra Craft", price: 999, tags: ["dhokra", "candle stand", "horse"] },
    { name: "Dhokra Key Hooks | 5-Hook Rustic Wall Panel", category: "Dhokra Craft", price: 649, tags: ["dhokra", "key hooks", "wall panel"] },
    { name: "Block Print Bedsheet Set | Rajasthani Floral", category: "Block Print Textiles", price: 1999, tags: ["block print", "bedsheet", "rajasthani", "floral"] },
    { name: "Block-Printed Cotton Kurta | Indigo Geometric", category: "Block Print Textiles", price: 1499, tags: ["block print", "kurta", "indigo", "geometric"] },
    { name: "Block Print Tote Bag | Yellow Sunflower Design", category: "Block Print Textiles", price: 599, tags: ["block print", "tote bag", "sunflower"] },
    { name: "Block-Printed Stole | Indigo & Red Geometric Pattern", category: "Block Print Textiles", price: 1299, tags: ["block print", "stole", "indigo", "red"] },
    { name: "Block-Printed Cotton Bedsheet | Sanganeri Floral", category: "Block Print Textiles", price: 1799, tags: ["block print", "bedsheet", "sanganeri"] },
    { name: "Pattachitra Canvas Painting | Jagannath Triad", category: "Pattachitra", price: 3499, tags: ["pattachitra", "jagannath", "canvas", "odisha"] },
    { name: "Pattachitra Silk Saree | Traditional Odisha Motif", category: "Pattachitra", price: 4999, tags: ["pattachitra", "silk saree", "odisha"] },
    { name: "Pattachitra Wall Panel | Fish & Lotus", category: "Pattachitra", price: 1999, tags: ["pattachitra", "wall panel", "fish", "lotus"] },
    { name: "Pattachitra Utility Box | Lacquered Wood", category: "Pattachitra", price: 1299, tags: ["pattachitra", "box", "lacquered", "wood"] },
    { name: "Pattachitra Lamp | Jackfruit Wood & Scroll Art", category: "Pattachitra", price: 2499, tags: ["pattachitra", "lamp", "jackfruit wood"] },
    { name: "Clay Pot Planter Set | Rustic Herb Pots", category: "Clay Moulding", price: 799, tags: ["clay", "planter", "herb pots", "rustic"] },
    { name: "Clay Ganesha Idol | Eco-friendly Festive Edition", category: "Clay Moulding", price: 499, tags: ["clay", "ganesha", "eco-friendly", "festive"] },
    { name: "Clay Wall Plate | Madhubani-Inspired Design", category: "Clay Moulding", price: 649, tags: ["clay", "wall plate", "madhubani"] },
    { name: "Clay Terracotta Jewellery | Necklace Set", category: "Clay Moulding", price: 549, tags: ["clay", "terracotta", "jewellery", "necklace"] },
    { name: "Clay Wind Chimes | Bird & Leaf Mobile", category: "Clay Moulding", price: 449, tags: ["clay", "wind chimes", "bird", "leaf"] },
    { name: "Brass Puja Thali Set | Engraved Floral Design", category: "Brass Work", price: 2199, tags: ["brass", "puja thali", "engraved", "floral"] },
    { name: "Brass Diyas | Set of 6 | Festive Lotus Design", category: "Brass Work", price: 899, tags: ["brass", "diyas", "lotus", "festive"] },
    { name: "Brass Door Knocker | Peacock Design", category: "Brass Work", price: 1599, tags: ["brass", "door knocker", "peacock"] },
    { name: "Brass Incense Holder | Dragon Design", category: "Brass Work", price: 749, tags: ["brass", "incense holder", "dragon"] },
    { name: "Brass Ganesh Idol | Antique Finish", category: "Brass Work", price: 2999, tags: ["brass", "ganesh", "antique", "idol"] },
    { name: "Pashmina Shawl | Kashmir Hand-Embroidered Sozni", category: "Kashmiri Crafts", price: 5999, tags: ["pashmina", "kashmiri", "shawl", "embroidery", "sozni"] },
    { name: "Kashmiri Walnut Wood Box | Carved Floral", category: "Kashmiri Crafts", price: 3499, tags: ["kashmir", "walnut wood", "carved", "box"] },
    { name: "Kashmir Papier Mâché Bowl | Multicolour Chinar", category: "Kashmiri Crafts", price: 1199, tags: ["kashmir", "papier mache", "chinar", "bowl"] },
    { name: "Kashmiri Crewel Cushion Cover | Floral Vines", category: "Kashmiri Crafts", price: 1499, tags: ["kashmir", "crewel", "cushion", "floral"] },
    { name: "Kashmir Sozni Embroidered Dupatta | Pure Silk", category: "Kashmiri Crafts", price: 4499, tags: ["kashmir", "sozni", "dupatta", "silk"] },
    { name: "Phulkari Dupatta | Punjab Hand-Embroidered Silk", category: "Phulkari", price: 3299, tags: ["phulkari", "punjab", "dupatta", "silk", "embroidery"] },
    { name: "Phulkari Tote Bag | Yellow Bagh Pattern", category: "Phulkari", price: 999, tags: ["phulkari", "tote bag", "bagh"] },
    { name: "Phulkari Table Cloth | Cotton 6-seater", category: "Phulkari", price: 1799, tags: ["phulkari", "tablecloth", "cotton"] },
    { name: "Phulkari Cushion Covers | Set of 2 | Geometric", category: "Phulkari", price: 899, tags: ["phulkari", "cushion", "geometric"] },
    { name: "Phulkari Wall Tapestry | Floral Abundance", category: "Phulkari", price: 2499, tags: ["phulkari", "wall tapestry", "floral"] },
    { name: "Gond Art Canvas | Tiger & Jungle", category: "Gond Art", price: 2799, tags: ["gond", "tiger", "jungle", "canvas"] },
    { name: "Gond Art Print | Birds on a Dot-Tree", category: "Gond Art", price: 999, tags: ["gond", "birds", "dot art", "print"] },
    { name: "Gond Art Tribal Mask | Wall Décor", category: "Gond Art", price: 1499, tags: ["gond", "tribal mask", "wall decor"] },
    { name: "Gond Art Notebook | Handmade Covers", category: "Gond Art", price: 449, tags: ["gond", "notebook", "handmade"] },
    { name: "Gond Art Silk Scarf | Fish & Floral Pattern", category: "Gond Art", price: 1299, tags: ["gond", "scarf", "fish", "silk"] },
    { name: "Macramé Wall Hanging | Boho Fringe Art 24 inch", category: "Macramé", price: 1199, tags: ["macrame", "wall hanging", "boho", "fringe"] },
    { name: "Macramé Plant Hanger | Set of 3 | Natural Cotton", category: "Macramé", price: 599, tags: ["macrame", "plant hanger", "cotton"] },
    { name: "Macramé Table Runner | Natural Ivory Knot Pattern", category: "Macramé", price: 849, tags: ["macrame", "table runner", "ivory"] },
    { name: "Macramé Mirror Frame | Boho Style 18 inch", category: "Macramé", price: 1499, tags: ["macrame", "mirror frame", "boho"] },
    { name: "Macramé Earrings | Ochre & White Tassel Drop", category: "Macramé", price: 299, tags: ["macrame", "earrings", "tassel"] },
    { name: "Bamboo Wind Chimes | 7-Tube Deep Resonance", category: "Bamboo & Cane Craft", price: 699, tags: ["bamboo", "wind chimes", "resonance"] },
    { name: "Bamboo Pen Stand | Eco Desk Organizer", category: "Bamboo & Cane Craft", price: 449, tags: ["bamboo", "pen stand", "eco", "organizer"] },
    { name: "Bamboo Photo Frame | Set of 3 Sizes", category: "Bamboo & Cane Craft", price: 799, tags: ["bamboo", "photo frame"] },
    { name: "Cane Fruit Basket | Large Woven Rattan", category: "Bamboo & Cane Craft", price: 999, tags: ["cane", "basket", "rattan", "woven"] },
    { name: "Bamboo Candle Holder | Set of 4 Cylindrical", category: "Bamboo & Cane Craft", price: 549, tags: ["bamboo", "candle holder"] },
    { name: "Jute Tote Bag | Hand-Painted Elephant Art", category: "Jute Craft", price: 499, tags: ["jute", "tote bag", "elephant", "handpainted"] },
    { name: "Jute Lampshade | Boho Fringe Pendant", category: "Jute Craft", price: 1299, tags: ["jute", "lampshade", "boho", "fringe"] },
    { name: "Jute Storage Basket Set | 3 sizes | Handles Included", category: "Jute Craft", price: 849, tags: ["jute", "basket", "storage"] },
    { name: "Jute Wall Art | Lotus in Bloom Panel", category: "Jute Craft", price: 699, tags: ["jute", "wall art", "lotus"] },
    { name: "Jute Table Mat Set | 6 pieces | Bordered Edge", category: "Jute Craft", price: 399, tags: ["jute", "table mat", "set"] },
    { name: "Embroidered Silk Purse | Zardosi Work Clutch", category: "Embroidery & Needlework", price: 1999, tags: ["embroidery", "silk", "zardosi", "purse", "clutch"] },
    { name: "Kantha Quilt | Double Size | Reversible Floral", category: "Embroidery & Needlework", price: 3499, tags: ["kantha", "quilt", "floral", "reversible"] },
    { name: "Chikankari Kurti | White Lucknow Embroidery", category: "Embroidery & Needlework", price: 1799, tags: ["chikankari", "kurti", "lucknow", "white"] },
    { name: "Embroidered Cushion Cover | Kashmiri Chain Stitch", category: "Embroidery & Needlework", price: 999, tags: ["embroidery", "cushion", "Kashmir", "chain stitch"] },
    { name: "Silk Thread Bookmark Set | Traditional Motifs", category: "Embroidery & Needlework", price: 349, tags: ["silk", "bookmark", "traditional", "thread"] },
    { name: "Handmade Leather Journal | Embossed Elephant Cover", category: "Leather Craft", price: 1499, tags: ["leather", "journal", "elephant", "embossed"] },
    { name: "Leather Wallet | Hand-Tooled Floral Pattern", category: "Leather Craft", price: 1199, tags: ["leather", "wallet", "floral", "handtooled"] },
    { name: "Leather Passport Holder | Rajasthani Block Print", category: "Leather Craft", price: 799, tags: ["leather", "passport holder", "rajasthani"] },
    { name: "Camel Leather Coin Pouch | Jaisalmer Craft", category: "Leather Craft", price: 499, tags: ["leather", "coin pouch", "jaisalmer", "camel"] },
    { name: "Leather Bookmarks | Set of 5 | Stamped Tribal", category: "Leather Craft", price: 299, tags: ["leather", "bookmark", "tribal", "stamped"] },
    { name: "Terracotta Horse | Bankura Style | Bishnupur", category: "Terracotta", price: 1599, tags: ["terracotta", "horse", "bankura", "bishnupur"] },
    { name: "Terracotta Wall Tile | Mandala Bas-Relief", category: "Terracotta", price: 899, tags: ["terracotta", "tile", "mandala"] },
    { name: "Terracotta Pot | Painted Garden Planter", category: "Terracotta", price: 649, tags: ["terracotta", "pot", "planter", "garden"] },
    { name: "Terracotta Jewellery Set | Painted Floral", category: "Terracotta", price: 549, tags: ["terracotta", "jewellery", "floral"] },
    { name: "Terracotta Hanging Bells | Wind Chime Set", category: "Terracotta", price: 399, tags: ["terracotta", "bells", "wind chime"] },
    { name: "Hand-Painted Ceramic Vase | Blue Pottery Style", category: "Ceramic & Pottery", price: 1799, tags: ["ceramic", "vase", "blue pottery", "handpainted"] },
    { name: "Ceramic Masala Dabba | 7-Spice Pottery Set", category: "Ceramic & Pottery", price: 1299, tags: ["ceramic", "masala dabba", "spice", "pottery"] },
    { name: "Blue Pottery Plate | Jaipur Traditional", category: "Ceramic & Pottery", price: 949, tags: ["blue pottery", "plate", "jaipur", "traditional"] },
    { name: "Ceramic Trinket Dish | Mandala Hand-Painted", category: "Ceramic & Pottery", price: 649, tags: ["ceramic", "trinket dish", "mandala"] },
    { name: "Ceramic Mug | Warli Art Print | 300ml", category: "Ceramic & Pottery", price: 449, tags: ["ceramic", "mug", "warli", "art"] },
    { name: "Pressed Flower Resin Tray | Botanical Art", category: "Mixed Media", price: 1799, tags: ["resin", "pressed flower", "botanical", "tray"] },
    { name: "Fabric Journal | Batik Wax Print Cover", category: "Mixed Media", price: 699, tags: ["journal", "batik", "fabric", "wax print"] },
    { name: "Driftwood & Shell Wall Art | Coastal Collection", category: "Mixed Media", price: 2299, tags: ["driftwood", "shell", "wall art", "coastal"] },
    { name: "Handmade Paper Gift Box Set | Block Print & Craft", category: "Mixed Media", price: 599, tags: ["handmade paper", "gift box", "block print"] },
    { name: "Indian Art & Craft Sampler | Mini Gift Set", category: "Mixed Media", price: 2999, tags: ["art", "craft", "sampler", "gift set", "indian"] },
];

async function seedProducts() {
    try {
        console.log("📡 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to:", MONGODB_URI.replace(/\/\/.*@/, "//***@"));

        // Get or create the admin user to assign as seller
        const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
            name: String, email: String, role: String
        }));

        let adminUser = await User.findOne({ role: "admin" }).lean() as any;
        if (!adminUser) {
            console.warn("⚠️  No admin user found. Products will be created without a seller.");
        }

        const Product = mongoose.models.IndianProduct || mongoose.model("IndianProduct", productSchema, "products");

        let created = 0;
        let skipped = 0;
        let failed = 0;

        console.log(`\n🚀 Seeding ${INDIAN_PRODUCTS.length} Indian Art & Craft products...\n`);

        for (const item of INDIAN_PRODUCTS) {
            try {
                // Generate slug
                const slug = item.name
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .substring(0, 80)
                    + "-" + Math.random().toString(36).substring(2, 6);

                const existingProduct = await Product.findOne({ name: item.name });
                if (existingProduct) {
                    console.log(`  ⏭  Skipped (already exists): ${item.name}`);
                    skipped++;
                    continue;
                }

                await Product.create({
                    name: item.name,
                    slug,
                    description: `Authentic handcrafted ${item.name.split("|")[0].trim()} from India's rich artistic heritage. Each piece is individually crafted by skilled artisans.`,
                    shortDescription: `Handcrafted ${item.category} — ${item.name.split("|")[0].trim()}`,
                    category: item.category,
                    tags: item.tags,
                    price: item.price,
                    currency: "INR",
                    quantity: Math.floor(Math.random() * 20) + 5,
                    status: "active",
                    productType: "physical",
                    seller: adminUser?._id || undefined,
                    sellerName: adminUser?.name || "Core Creator Admin",
                    isFeatured: Math.random() > 0.8, // 20% chance featured
                    images: [],
                });

                console.log(`  ✅ Created: ${item.name} — ₹${item.price}`);
                created++;
            } catch (err: any) {
                if (err.code === 11000) {
                    console.log(`  ⏭  Skipped (slug conflict): ${item.name}`);
                    skipped++;
                } else {
                    console.error(`  ❌ Failed: ${item.name} — ${err.message}`);
                    failed++;
                }
            }
        }

        console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Seeding Complete!
   Created : ${created}
   Skipped : ${skipped} (already existed)
   Failed  : ${failed}
   Total   : ${INDIAN_PRODUCTS.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err: any) {
        console.error("❌ Seeding failed:", err.message);
        process.exit(1);
    }
}

seedProducts();
