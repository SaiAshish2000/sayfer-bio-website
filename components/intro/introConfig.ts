/**
 * Shared constants for the intro. Kept in one place because the pre-paint
 * script in the root layout has to agree with the component about the session
 * key, and it runs long before any of this module is evaluated.
 */

/** Session key. Session-scoped by design: one intro per browser session. */
export const INTRO_FLAG = "sayfer-intro-seen";

/**
 * The header's logo image — the flight's landing target. The nav renders
 * exactly one image inside its home link, so this stays true without the intro
 * having to reach into the approved nav markup.
 */
export const HEADER_LOGO_SELECTOR = 'header a[aria-label] img';
