"use client";

import * as React from "react";
import {
    X,
    Upload,
    FileText,
    Plus,
    Trash2,
    Download,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    ChevronRight,
    Package,
    ClipboardList,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductRow {
    name: string;
    description: string;
    category: string;
    price: string;
    currency: string;
    quantity: string;
    sku: string;
    tags: string;
    productType: string;
}

interface UploadResult {
    index: number;
    name: string;
    success: boolean;
    productId?: string;
    error?: string;
}

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categories: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BLANK_ROW = (): ProductRow => ({
    name: "",
    description: "",
    category: "",
    price: "",
    currency: "INR",
    quantity: "1",
    sku: "",
    tags: "",
    productType: "physical",
});

const CSV_HEADERS = ["name", "description", "category", "price", "currency", "quantity", "sku", "tags", "productType"];

const SAMPLE_CSV = `name,description,category,price,currency,quantity,sku,tags,productType
Sunset Resin Clock,Beautiful handmade wall clock,Wall Art,2500,INR,5,RES-001,"art,clock,resin",physical
Abstract Canvas Print,Modern abstract canvas,Paintings,1800,INR,10,CANV-001,"abstract,canvas",physical
Digital Illustration Pack,10 high-res illustrations,Digital Art,999,INR,999,DIG-001,"digital,illustration",digital`;

function parseCSV(text: string): ProductRow[] {
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    // Parse header respecting quoted commas
    const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line) => {
        const values = parseCSVLine(line);
        const row = BLANK_ROW();
        headers.forEach((h, i) => {
            const val = values[i]?.trim() ?? "";
            if (h in row) (row as any)[h] = val;
        });
        return row;
    });
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

function downloadSampleCSV() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_upload_sample.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ValidationBadge({ rows }: { rows: ProductRow[] }) {
    const errors = rows.filter((r) => !r.name.trim() || !r.category.trim() || !r.price.trim() || isNaN(Number(r.price)));
    if (errors.length === 0) return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
            <CheckCircle2 className="w-3 h-3" /> {rows.length} valid
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
            <AlertTriangle className="w-3 h-3" /> {errors.length} error(s)
        </span>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function BulkUploadModal({ isOpen, onClose, onSuccess, categories }: BulkUploadModalProps) {
    const [tab, setTab] = React.useState<"csv" | "json" | "manual">("csv");

    // CSV state
    const [csvRows, setCsvRows] = React.useState<ProductRow[]>([]);
    const [csvError, setCsvError] = React.useState("");
    const [csvDragOver, setCsvDragOver] = React.useState(false);
    const csvInputRef = React.useRef<HTMLInputElement>(null);

    // JSON state
    const [jsonText, setJsonText] = React.useState("");
    const [jsonRows, setJsonRows] = React.useState<ProductRow[]>([]);
    const [jsonError, setJsonError] = React.useState("");

    // Manual state
    const [manualRows, setManualRows] = React.useState<ProductRow[]>([BLANK_ROW()]);

    // Upload state
    const [uploading, setUploading] = React.useState(false);
    const [results, setResults] = React.useState<UploadResult[] | null>(null);
    const [summary, setSummary] = React.useState<{ created: number; failed: number; total: number } | null>(null);

    const activeRows = tab === "csv" ? csvRows : tab === "json" ? jsonRows : manualRows;

    if (!isOpen) return null;

    // ── CSV Upload ──────────────────────────────────────────────────────────

    const handleCSVFile = (file: File) => {
        setCsvError("");
        if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
            setCsvError("Please upload a valid .csv file");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const rows = parseCSV(text);
                if (rows.length === 0) {
                    setCsvError("CSV file appears empty or has no data rows (check headers).");
                    return;
                }
                setCsvRows(rows);
            } catch {
                setCsvError("Failed to parse CSV. Make sure it uses comma-separated values.");
            }
        };
        reader.readAsText(file);
    };

    // ── JSON Parse ──────────────────────────────────────────────────────────

    const parseJSON = () => {
        setJsonError("");
        try {
            const parsed = JSON.parse(jsonText);
            const arr: any[] = Array.isArray(parsed) ? parsed : [parsed];
            const rows: ProductRow[] = arr.map((item) => ({
                name: String(item.name || ""),
                description: String(item.description || ""),
                category: String(item.category || ""),
                price: String(item.price || ""),
                currency: String(item.currency || "INR"),
                quantity: String(item.quantity ?? "1"),
                sku: String(item.sku || ""),
                tags: Array.isArray(item.tags) ? item.tags.join(", ") : String(item.tags || ""),
                productType: String(item.productType || "physical"),
            }));
            setJsonRows(rows);
        } catch {
            setJsonError("Invalid JSON. Make sure it's a valid array of objects.");
        }
    };

    // ── Manual Rows ─────────────────────────────────────────────────────────

    const updateManualRow = (i: number, field: keyof ProductRow, value: string) => {
        setManualRows((prev) => {
            const updated = [...prev];
            updated[i] = { ...updated[i], [field]: value };
            return updated;
        });
    };

    const addManualRow = () => setManualRows((prev) => [...prev, BLANK_ROW()]);

    const removeManualRow = (i: number) => {
        setManualRows((prev) => prev.filter((_, idx) => idx !== i));
    };

    // ── Submit ──────────────────────────────────────────────────────────────

    const handleUpload = async () => {
        if (activeRows.length === 0) return;
        setUploading(true);
        setResults(null);
        setSummary(null);

        try {
            const products = activeRows.map((row) => ({
                name: row.name.trim(),
                description: row.description.trim() || undefined,
                category: row.category.trim(),
                price: parseFloat(row.price) || 0,
                currency: row.currency || "INR",
                quantity: parseInt(row.quantity) || 0,
                sku: row.sku.trim() || undefined,
                tags: row.tags,
                productType: row.productType || "physical",
            }));

            const res = await fetch("/api/admin/products/bulk-upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ products }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setResults(data.results);
            setSummary({ created: data.created, failed: data.failed, total: data.total });

            if (data.created > 0) {
                onSuccess();
            }
        } catch (err: any) {
            setResults([{ index: 0, name: "Upload", success: false, error: err.message }]);
            setSummary({ created: 0, failed: 1, total: 1 });
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setCsvRows([]);
        setCsvError("");
        setJsonText("");
        setJsonRows([]);
        setJsonError("");
        setManualRows([BLANK_ROW()]);
        setResults(null);
        setSummary(null);
        setTab("csv");
        onClose();
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                            <Upload className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Bulk Upload Products</h2>
                            <p className="text-sm text-gray-500">Upload up to 500 artworks/products at once</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Results view (shown after upload) */}
                {results && summary ? (
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Summary Banner */}
                        <div className={`flex items-center gap-4 p-5 rounded-2xl mb-6 ${summary.failed === 0 ? "bg-green-50 border border-green-200" : summary.created === 0 ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"}`}>
                            {summary.failed === 0 ? (
                                <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                            ) : summary.created === 0 ? (
                                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                            ) : (
                                <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                            )}
                            <div>
                                <p className="text-lg font-bold text-gray-900">
                                    {summary.created} of {summary.total} products created
                                </p>
                                <p className="text-sm text-gray-600">
                                    {summary.created > 0 && <span className="text-green-700 font-medium">{summary.created} succeeded</span>}
                                    {summary.created > 0 && summary.failed > 0 && " · "}
                                    {summary.failed > 0 && <span className="text-red-700 font-medium">{summary.failed} failed</span>}
                                </p>
                            </div>
                        </div>

                        {/* Per-row results */}
                        <div className="space-y-2">
                            {results.map((r) => (
                                <div key={r.index} className={`flex items-center gap-3 p-3 rounded-xl border ${r.success ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                                    {r.success
                                        ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                    }
                                    <span className="text-sm font-medium text-gray-900 flex-1 truncate">{r.name}</span>
                                    {r.success
                                        ? <span className="text-xs text-green-600 font-mono">{r.productId?.slice(-8)}</span>
                                        : <span className="text-xs text-red-600">{r.error}</span>
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Tab Bar */}
                        <div className="flex border-b border-gray-100 px-6 bg-gray-50">
                            {[
                                { id: "csv", label: "CSV Upload", icon: FileText },
                                { id: "json", label: "JSON Upload", icon: ClipboardList },
                                { id: "manual", label: "Manual Entry", icon: Package },
                            ].map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setTab(id as any)}
                                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === id
                                        ? "border-purple-600 text-purple-700 bg-white"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">

                            {/* ── CSV TAB ───────────────────────────────── */}
                            {tab === "csv" && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Upload a CSV File</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">Required columns: name, category, price. Others are optional.</p>
                                        </div>
                                        <button
                                            onClick={downloadSampleCSV}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Sample CSV
                                        </button>
                                    </div>

                                    {/* Drop Zone */}
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setCsvDragOver(true); }}
                                        onDragLeave={() => setCsvDragOver(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setCsvDragOver(false);
                                            const file = e.dataTransfer.files[0];
                                            if (file) handleCSVFile(file);
                                        }}
                                        onClick={() => csvInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${csvDragOver ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"}`}
                                    >
                                        <input
                                            ref={csvInputRef}
                                            type="file"
                                            accept=".csv,text/csv"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleCSVFile(file);
                                            }}
                                        />
                                        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="font-medium text-gray-700">Drop your CSV file here or click to browse</p>
                                        <p className="text-sm text-gray-400 mt-1">Max 500 rows · Comma-separated · UTF-8 encoding</p>
                                    </div>

                                    {csvError && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                            <XCircle className="w-4 h-4 flex-shrink-0" />
                                            {csvError}
                                        </div>
                                    )}

                                    {/* Preview table */}
                                    {csvRows.length > 0 && (
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                                    Preview
                                                    <ValidationBadge rows={csvRows} />
                                                </h4>
                                                <button onClick={() => { setCsvRows([]); if (csvInputRef.current) csvInputRef.current.value = ""; }} className="text-sm text-red-500 hover:text-red-700">Clear</button>
                                            </div>
                                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">#</th>
                                                            <th className="px-3 py-2 text-left">Name</th>
                                                            <th className="px-3 py-2 text-left">Category</th>
                                                            <th className="px-3 py-2 text-right">Price</th>
                                                            <th className="px-3 py-2 text-right">Qty</th>
                                                            <th className="px-3 py-2 text-left">Type</th>
                                                            <th className="px-3 py-2 text-left">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {csvRows.slice(0, 20).map((row, i) => {
                                                            const hasError = !row.name.trim() || !row.category.trim() || !row.price.trim() || isNaN(Number(row.price));
                                                            return (
                                                                <tr key={i} className={hasError ? "bg-red-50" : ""}>
                                                                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                                                    <td className="px-3 py-2 font-medium text-gray-900 max-w-[160px] truncate">{row.name || <span className="text-red-400 italic">Missing</span>}</td>
                                                                    <td className="px-3 py-2 text-gray-600">{row.category || <span className="text-red-400 italic">Missing</span>}</td>
                                                                    <td className="px-3 py-2 text-right">{row.currency} {row.price || <span className="text-red-400 italic">!</span>}</td>
                                                                    <td className="px-3 py-2 text-right">{row.quantity || 0}</td>
                                                                    <td className="px-3 py-2 text-gray-500 capitalize">{row.productType}</td>
                                                                    <td className="px-3 py-2">
                                                                        {hasError
                                                                            ? <span className="text-xs text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" /> Error</span>
                                                                            : <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> OK</span>
                                                                        }
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                                {csvRows.length > 20 && (
                                                    <p className="text-xs text-gray-400 text-center py-2">… and {csvRows.length - 20} more rows</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── JSON TAB ──────────────────────────────── */}
                            {tab === "json" && (
                                <div className="space-y-5">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Paste JSON Array</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">Paste an array of product objects. Required keys: name, category, price.</p>
                                    </div>
                                    <textarea
                                        className="w-full h-52 p-4 font-mono text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 resize-none"
                                        placeholder={`[\n  {\n    "name": "Artwork Name",\n    "category": "Paintings",\n    "price": 2500,\n    "description": "...",\n    "currency": "INR",\n    "quantity": 5\n  }\n]`}
                                        value={jsonText}
                                        onChange={(e) => { setJsonText(e.target.value); setJsonRows([]); setJsonError(""); }}
                                    />

                                    <button
                                        onClick={parseJSON}
                                        disabled={!jsonText.trim()}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                    >
                                        Parse & Preview
                                    </button>

                                    {jsonError && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                            <XCircle className="w-4 h-4 flex-shrink-0" />
                                            {jsonError}
                                        </div>
                                    )}

                                    {jsonRows.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <h4 className="font-medium text-gray-900">Preview</h4>
                                                <ValidationBadge rows={jsonRows} />
                                            </div>
                                            <div className="overflow-x-auto rounded-xl border border-gray-100">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">#</th>
                                                            <th className="px-3 py-2 text-left">Name</th>
                                                            <th className="px-3 py-2 text-left">Category</th>
                                                            <th className="px-3 py-2 text-right">Price</th>
                                                            <th className="px-3 py-2 text-right">Qty</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {jsonRows.slice(0, 20).map((row, i) => (
                                                            <tr key={i}>
                                                                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                                                <td className="px-3 py-2 font-medium text-gray-900">{row.name}</td>
                                                                <td className="px-3 py-2 text-gray-600">{row.category}</td>
                                                                <td className="px-3 py-2 text-right">{row.currency} {row.price}</td>
                                                                <td className="px-3 py-2 text-right">{row.quantity}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {jsonRows.length > 20 && (
                                                    <p className="text-xs text-gray-400 text-center py-2">… and {jsonRows.length - 20} more rows</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── MANUAL TAB ────────────────────────────── */}
                            {tab === "manual" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Manual Batch Entry</h3>
                                            <p className="text-sm text-gray-500 mt-0.5">Add products row by row and upload them all at once.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ValidationBadge rows={manualRows} />
                                        </div>
                                    </div>

                                    {/* Rows */}
                                    <div className="space-y-3">
                                        {manualRows.map((row, i) => {
                                            const hasError = !row.name.trim() || !row.category.trim() || !row.price.trim() || isNaN(Number(row.price));
                                            return (
                                                <div key={i} className={`border rounded-xl p-4 space-y-3 transition-colors ${hasError && (row.name || row.category || row.price) ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"}`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Product #{i + 1}</span>
                                                        {manualRows.length > 1 && (
                                                            <button onClick={() => removeManualRow(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Name <span className="text-red-400">*</span></label>
                                                            <input
                                                                type="text"
                                                                value={row.name}
                                                                onChange={(e) => updateManualRow(i, "name", e.target.value)}
                                                                placeholder="Product name"
                                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Category <span className="text-red-400">*</span></label>
                                                            <input
                                                                type="text"
                                                                list={`categories-${i}`}
                                                                value={row.category}
                                                                onChange={(e) => updateManualRow(i, "category", e.target.value)}
                                                                placeholder="e.g. Paintings"
                                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                                            />
                                                            <datalist id={`categories-${i}`}>
                                                                {categories.map((c) => <option key={c} value={c} />)}
                                                            </datalist>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Price <span className="text-red-400">*</span></label>
                                                            <div className="flex gap-1.5">
                                                                <select
                                                                    value={row.currency}
                                                                    onChange={(e) => updateManualRow(i, "currency", e.target.value)}
                                                                    className="px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-gray-50"
                                                                >
                                                                    <option value="INR">₹</option>
                                                                    <option value="USD">$</option>
                                                                    <option value="EUR">€</option>
                                                                    <option value="GBP">£</option>
                                                                </select>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={row.price}
                                                                    onChange={(e) => updateManualRow(i, "price", e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={row.quantity}
                                                                onChange={(e) => updateManualRow(i, "quantity", e.target.value)}
                                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                                                            <input
                                                                type="text"
                                                                value={row.sku}
                                                                onChange={(e) => updateManualRow(i, "sku", e.target.value)}
                                                                placeholder="Optional"
                                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                                                            <select
                                                                value={row.productType}
                                                                onChange={(e) => updateManualRow(i, "productType", e.target.value)}
                                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                                                            >
                                                                <option value="physical">Physical</option>
                                                                <option value="digital">Digital</option>
                                                                <option value="service">Service</option>
                                                            </select>
                                                        </div>
                                                        <div className="sm:col-span-2 lg:col-span-3">
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma-separated)</label>
                                                            <input
                                                                type="text"
                                                                value={row.tags}
                                                                onChange={(e) => updateManualRow(i, "tags", e.target.value)}
                                                                placeholder="art, painting, abstract"
                                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2 lg:col-span-3">
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                                            <textarea
                                                                value={row.description}
                                                                onChange={(e) => updateManualRow(i, "description", e.target.value)}
                                                                placeholder="Short product description..."
                                                                rows={2}
                                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={addManualRow}
                                        className="flex items-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/50 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Another Product
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50">
                    {results ? (
                        <>
                            <p className="text-sm text-gray-500">
                                Upload complete · {new Date().toLocaleTimeString()}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setResults(null); setSummary(null); }}
                                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Upload More
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                {activeRows.length > 0 && (
                                    <>
                                        <Package className="w-4 h-4" />
                                        <span className="font-medium">{activeRows.length} product{activeRows.length !== 1 ? "s" : ""} ready</span>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={activeRows.length === 0 || uploading}
                                    className="flex items-center gap-2 px-5 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {uploading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                                    ) : (
                                        <><Upload className="w-4 h-4" /> Upload {activeRows.length > 0 ? activeRows.length : ""} Product{activeRows.length !== 1 ? "s" : ""}</>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
