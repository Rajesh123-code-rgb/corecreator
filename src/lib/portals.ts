/**
 * Hostnames for the three portals.
 *
 * Links that must leave a portal need an absolute URL. On
 * studio.corecreator.online a bare href="/" resolves to the creator dashboard,
 * not the shop, so "Back to Home" quietly became "back to the page you just
 * came from". Absolute URLs also stop Next prefetching them: a cross-origin
 * prefetch sends an RSC header, which triggers a CORS preflight that page
 * routes answer with 405.
 */
export const APEX_HOST = "corecreator.online";
export const APEX_URL = `https://${APEX_HOST}`;
export const STUDIO_URL = `https://studio.${APEX_HOST}`;
export const ADMIN_URL = `https://admin.${APEX_HOST}`;
