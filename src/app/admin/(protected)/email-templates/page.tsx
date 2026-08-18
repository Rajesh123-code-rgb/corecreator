"use client";

import * as React from "react";
import { Button, Input } from "@/components/atoms";
import { useToast } from "@/components/molecules";
import { Loader2, Mail, RotateCcw, Send, Eye, AlertCircle, CheckCircle2 } from "lucide-react";

interface TemplateVariable { token: string; describes: string; sample: string }
interface Template {
    key: string; name: string; description: string; trigger: string;
    variables: TemplateVariable[]; subject: string; htmlContent: string;
    isCustomised: boolean; isActive: boolean; updatedAt: string | null;
}
interface Delivery { configured: boolean; senderEmail: string; senderName: string }

export default function EmailTemplatesPage() {
    const toast = useToast();
    const [templates, setTemplates] = React.useState<Template[]>([]);
    const [delivery, setDelivery] = React.useState<Delivery | null>(null);
    const [activeKey, setActiveKey] = React.useState<string>("");
    const [draft, setDraft] = React.useState<{ subject: string; htmlContent: string }>({ subject: "", htmlContent: "" });
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [sending, setSending] = React.useState(false);
    const [testTo, setTestTo] = React.useState("");
    const [showPreview, setShowPreview] = React.useState(false);

    const active = templates.find((t) => t.key === activeKey);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/email-templates");
            if (!res.ok) throw new Error("Could not load templates");
            const data = await res.json();
            setTemplates(data.templates);
            setDelivery(data.delivery);
            const first = data.templates[0];
            setActiveKey((k) => k || first?.key || "");
            if (first && !activeKey) setDraft({ subject: first.subject, htmlContent: first.htmlContent });
        } catch {
            toast.error("Could not load email templates", "Refresh the page to try again.");
        } finally {
            setLoading(false);
        }
    }, [activeKey, toast]);

    React.useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const selectTemplate = (t: Template) => {
        setActiveKey(t.key);
        setDraft({ subject: t.subject, htmlContent: t.htmlContent });
        setShowPreview(false);
    };

    const save = async () => {
        if (!active) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/email-templates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: active.key, ...draft }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");
            toast.success("Template saved", `${active.name} will use your version from now on.`);
            await load();
        } catch (e) {
            toast.error("Could not save", e instanceof Error ? e.message : "Please try again.");
        } finally { setSaving(false); }
    };

    const revert = async () => {
        if (!active) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/email-templates?key=${active.key}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Revert failed");
            toast.info("Reverted to the default", `${active.name} is back to the version we ship.`);
            await load();
            const fresh = (await (await fetch("/api/admin/email-templates")).json()).templates
                .find((t: Template) => t.key === active.key);
            if (fresh) setDraft({ subject: fresh.subject, htmlContent: fresh.htmlContent });
        } catch {
            toast.error("Could not revert", "Please try again.");
        } finally { setSaving(false); }
    };

    const sendTest = async () => {
        if (!active) return;
        setSending(true);
        try {
            const res = await fetch("/api/admin/email-templates/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: active.key, to: testTo, ...draft }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || "Send failed");
            toast.success("Test sent", data.message);
        } catch (e) {
            toast.error("Test email failed", e instanceof Error ? e.message : "Please try again.");
        } finally { setSending(false); }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Email templates</h1>
                <p className="text-[var(--muted-foreground)]">
                    Reword the emails Core Creator sends. Placeholders like <code className="text-xs bg-[var(--muted)] px-1 py-0.5 rounded">{"{{name}}"}</code> are filled in when the email is sent.
                </p>
            </div>

            {/* Delivery status - answers "is email actually working" without
                waiting for a customer to tell you it isn't. */}
            {delivery && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${delivery.configured
                    ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    {delivery.configured
                        ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                    <div className="text-sm">
                        <p className={`font-medium ${delivery.configured ? "text-green-800" : "text-red-800"}`}>
                            {delivery.configured ? "Email is configured" : "Email is not configured — nothing can send"}
                        </p>
                        <p className={delivery.configured ? "text-green-700" : "text-red-700"}>
                            Sending as {delivery.senderName} &lt;{delivery.senderEmail}&gt;.
                            {delivery.configured
                                ? " Send yourself a test below to confirm delivery."
                                : " Set BREVO_API_KEY in .env.production and recreate the container."}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                {/* Template list */}
                <div className="space-y-2">
                    {templates.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => selectTemplate(t)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${t.key === activeKey
                                ? "border-[var(--secondary-500)] bg-[var(--secondary-50)]"
                                : "border-[var(--border)] hover:bg-[var(--muted)]"}`}
                        >
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                                <span className="font-medium text-sm">{t.name}</span>
                                {t.isCustomised && (
                                    <span className="ml-auto text-[10px] uppercase tracking-wide bg-[var(--secondary-100)] text-[var(--secondary-700)] px-1.5 py-0.5 rounded">Edited</span>
                                )}
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">{t.trigger}</p>
                        </button>
                    ))}
                </div>

                {/* Editor */}
                {active && (
                    <div className="space-y-4 min-w-0">
                        <div className="p-4 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]">
                            <p className="text-sm">{active.description}</p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-2">
                                <strong>Sent when:</strong> {active.trigger}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Subject</label>
                            <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <label className="block text-sm font-medium">Email content (HTML)</label>
                                <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                                    <Eye className="w-4 h-4 mr-1" /> {showPreview ? "Edit" : "Preview"}
                                </Button>
                            </div>
                            {showPreview ? (
                                <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
                                    <iframe
                                        title="Email preview"
                                        srcDoc={active.variables.reduce(
                                            (html, v) => html.replaceAll(`{{${v.token}}}`, v.sample),
                                            draft.htmlContent
                                        )}
                                        sandbox=""
                                        className="w-full h-[420px]"
                                    />
                                </div>
                            ) : (
                                <textarea
                                    value={draft.htmlContent}
                                    onChange={(e) => setDraft({ ...draft, htmlContent: e.target.value })}
                                    spellCheck={false}
                                    className="w-full h-[420px] font-mono text-xs p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] resize-y"
                                />
                            )}
                        </div>

                        <div className="p-4 rounded-xl border border-[var(--border)]">
                            <p className="text-sm font-medium mb-2">Placeholders you can use</p>
                            <div className="grid gap-2">
                                {active.variables.map((v) => (
                                    <div key={v.token} className="flex flex-wrap items-baseline gap-2 text-sm">
                                        <code className="text-xs bg-[var(--muted)] px-1.5 py-0.5 rounded">{`{{${v.token}}}`}</code>
                                        <span className="text-[var(--muted-foreground)]">{v.describes}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button onClick={save} isLoading={saving} variant="secondary">Save template</Button>
                            {active.isCustomised && (
                                <Button onClick={revert} variant="outline" disabled={saving}>
                                    <RotateCcw className="w-4 h-4 mr-2" /> Revert to default
                                </Button>
                            )}
                        </div>

                        <div className="p-4 rounded-xl border border-[var(--border)] space-y-3">
                            <p className="text-sm font-medium">Send yourself a test</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                                Uses sample values. If it arrives, delivery is working end to end.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Input
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={testTo}
                                    onChange={(e) => setTestTo(e.target.value)}
                                    className="flex-1 min-w-[200px]"
                                />
                                <Button onClick={sendTest} isLoading={sending} disabled={!testTo || !delivery?.configured} variant="outline">
                                    <Send className="w-4 h-4 mr-2" /> Send test
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
