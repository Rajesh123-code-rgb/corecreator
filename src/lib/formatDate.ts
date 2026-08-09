// Dates rendered during SSR and then again on the client must produce the same
// string, or React throws a hydration error (#418) and discards the server
// markup for that subtree.
//
// Bare `new Date(x).toLocaleDateString()` cannot do that: the server runs in
// UTC and the visitor's browser does not, so a timestamp near midnight renders
// as a different day, and the format itself follows whatever locale each side
// happens to have. Pinning both the locale and the time zone makes the output
// deterministic - and Asia/Kolkata is the right zone for an Indian storefront.
const LOCALE = "en-GB";
const TIME_ZONE = "Asia/Kolkata";

export function formatDate(
    value: string | number | Date | undefined | null,
    options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: TIME_ZONE }).format(date);
}
