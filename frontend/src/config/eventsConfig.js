/**
 * Event Configuration & Feature Flags
 *
 * AUDIENCE_PASSES_ANNOUNCED:
 * Set to `false` while passes have not been officially announced yet.
 * When false:
 *  - Hides public navigation links to Audience Passes in Navbar and Footer.
 *  - Replaces the Pass reservation CTA on the Performer Registration page with "Audience Passes Opening Soon".
 *  - Direct visits to /moras-live/passes display an "Audience Passes Opening Soon" holding screen,
 *    inviting visitors to register as performers or follow for the official pass announcement.
 *    (Existing pass holders accessing via email/QR passId+token can still view their confirmed pass).
 *
 * Set to `true` once the event entry pass distribution is officially announced!
 */
export const AUDIENCE_PASSES_ANNOUNCED = false;
