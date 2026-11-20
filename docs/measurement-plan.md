# Local Lift measurement plan

## Current integration: 9 November 2026

The website uses GTM container `GTM-PG38VX8P` after consent. The owner has confirmed `form_start` in DebugView and configured the funnel. Live `generate_lead` in standard reports remains unverified. The direct GA4 fallback is selected only when GTM is explicitly disabled. [GTM configuration and verification](gtm-setup.md)

## Objective and boundaries

Help a suitable Perth residential cleaning business owner understand the review, inspect a sample, assess fit and enquire. The independent checklist journey is also useful; a visitor who solves a simple update without enquiring is not automatically a failed visit.

The analytics layer is implemented but **gated by visitor opt-in; the configured GTM container must contain published GA4 tags for collection**. No GA4 property was created or connected during this draft. Local mocked event checks are not collection evidence.

## Event specification

| Event | Exact trigger | Safe parameters | Intended decision |
| --- | --- | --- | --- |
| `page_view` | Once per full page load, after analytics opt-in or a previously saved allow choice | Known canonical `page_location`, fixed `page_title`, empty `page_referrer` | Which entry/content pages are used? Compare the guide and offer journeys without assuming search demand. |
| `enquiry_cta_click` | Click a marked enquiry link | Fixed `placement`: `header`, `footer`, `home-hero`, `home-close`, `about-enquiry`, `audit-intro`, `audit-contents`, `audit-close`, `guide-close` | Are suitable next steps visible at useful points? Compare clicks with starts to see where visitors continue. |
| `sample_select` | Click a marked link to the sample | Fixed `placement`: `home-hero`, `about-sample`, `audit-intro`, `enquire-aside` | Are visitors choosing to inspect the deliverable before deciding? |
| `guide_select` | Click a marked guide link | Fixed `placement`: `header`, `footer`, `home-guide`, `audit-contents`, `enquire-success` | Is the independent guide being selected? Direct guide landings appear in page views. |
| `coverage_check_start` | First answer in the guided check on a page load while opted in | Safe page context only | Are checklist visitors starting the guided check? |
| `coverage_check_complete` | First valid result shown on a page load while opted in | Safe page context only | Are visitors who start reaching the tailored result? |
| `form_start` | First focus inside the enquiry form on that page load | None | Is the form being started after fit information is available? Not every start should become an enquiry. |
| `form_error` | A failed submit attempt | One fixed `error_category`: `validation`, `unavailable`, `network`, `service`, `unconfirmed`, `timeout` | Is friction a field issue, deliberate unavailability or a service/connection problem? Fix technical errors before drawing marketing conclusions. |
| `generate_lead` | Exactly once when Formspree responds with HTTP success **and JSON `ok: true`** | None | Count service-confirmed enquiries as the primary site action. Does not establish inbox delivery, suitability, sales or business results. |

Links to the guide and the sample are tagged, including the guide's header/footer navigation and the audit's on-page Sample link. Repeated selections are events, not unique readers; an anchor selection does not establish that the content was read.

Use `generate_lead` as the **main key event**. Configure once-per-event counting; the form blocks pending duplicates and emits once per acceptance. A new page load and genuinely new submission can still count again. Consider CTA, sample, guide and form-start events diagnostic, not equal-value key events.

If useful, register `placement` and `error_category` as **event-scoped custom dimensions** in GA4. Do not create dimensions from form inputs, URLs supplied by visitors, names or message text. Avoid interpreting tiny counts or opted-in traffic as representative of every visitor.

## Privacy and duplication controls

- If both GTM and direct GA4 are disabled or invalid, the site omits the analytics script and preference interface.
- “Allow analytics” and “Continue without analytics” have the same prominence. The preference is stored under `local-lift-analytics`. Visitors can reopen and close the choices from the footer without losing their place.
- Storage failures do not crash the site. Without storage, the current page can respect a choice; it may need to ask again on the next page.
- `send_page_view: false` prevents the initial configuration call from adding a second page view. A manual `page_view` is sent once. Static HTML page changes produce a new page load; hash navigation does not produce another page view.
- Page context is a known canonical URL. The current query, fragment, inbound referrer and submitted URLs are not used. The GA script uses `referrerPolicy: no-referrer`. No outbound-link URL is sent by custom events.
- `allow_google_signals` and ad personalisation signals are disabled. Consent allows analytics storage only after opting in; advertising storage, ad user data and ad personalisation are denied.
- Event names, placement labels and error categories come from fixed lists. No email, business URL, profile link, free text, form payload, provider error body or credentials enter analytics.
- Revocation stops application events, clears pending events, denies analytics storage and attempts to clear accessible first-party `_ga` cookies. A valid GA4 measurement ID also enables Google's disable flag. The browser sends the updated preference to other open tabs and applies it on subsequent loads. Unsent form answers stay in the open document. Tags that have already executed need the published container's consent controls for cookieless and background requests.
- Google Analytics still uses its normal browser/network and pseudonymous analytics identifiers after opt-in. Do not describe the service as collecting no data. Browser extensions or blocked network access can prevent collection.

## Check the property and container

1. Check that the published GTM container targets the intended Local Lift web data stream for `https://kapohari2k.github.io/BUSN9155_Codex/`. Check the property's reporting timezone and currency.
2. In the stream's **Enhanced measurement** settings, check for automatic **form interactions**, **outbound clicks**, **site search**, and **page changes based on browser history**. Turn off automatic measurement and Google tag user-provided data detection to keep only the intended app events and safe parameters.
3. Review the GTM tag consent requirements and page variables. Use one Google tag and one event tag per event. [GTM configuration and verification](gtm-setup.md)
4. Confirm whether `generate_lead` is marked as a key event with once-per-event counting. Use the exact event name when creating the key event.

## Published-site verification, still to do

Use non-sensitive controlled test details. Record timestamps with timezone, the published commit and actual observations. Do not paste measurement credentials, private enquiry text or identifiable data into assessment screenshots.

| Check | How to perform it | Evidence to retain | Current status |
| --- | --- | --- | --- |
| Published pages | Open and refresh all five URLs, then test mobile navigation and emitted assets | Public URL, deployed commit, desktop/mobile screenshots | Prior Pages version reviewed. Revised working tree pending deployment |
| Consent and withdrawal | In a clean browser, inspect Network before choice, after decline, and after withdrawal following an opt-in. Interact and visit another page after each choice | Zero analytics requests outside the allowed period and preference respected | Mocked locally. Revised published-origin check pending |
| Google tag | Connect Google Tag Assistant to the published URL and opt in | Correct measurement ID, one tag, safe page context, no duplicate page view | Pending real property/ID and publication |
| DebugView | Use Tag Assistant debug mode, then visit a page, select sample/guide and start the form | Expected events and fixed parameters in DebugView, with no answers or query data | Owner confirmed `form_start` earlier. Revised-origin sequence pending |
| Confirmed enquiry | Submit once in a normal opted-in session. Inspect the service acceptance, receipt view, provider dashboard and inbox | Accepted request and inbox delivery, with identifying details redacted | Provider acceptance mocked locally. Revised live delivery pending |
| Error path | Use a controlled invalid field and, in browser tools, block the form request | `form_error` category, no `generate_lead`, retained answers | Mocked locally; live-origin verification pending |
| Realtime | In a normal opted-in session without debug tooling, repeat a controlled visit and action | Events in Realtime for the correct property | Pending; allow for normal reporting delay |
| Key event | Confirm `generate_lead` appears and is marked as the main key event | GA4 configuration and observed key event | Pending |
| Standard reports and funnel | Look for the test `generate_lead` after normal processing and check funnel filters and the Enquire path | Dated standard report and funnel showing the event | Funnel configured by owner. Standard-report lead unverified |

Tag Assistant/DebugView and Realtime must be checked against the **published origin**. Do not use the local `G-TESTONLY123` fixture as a property ID. Never report these checks complete until there is real evidence. Discard or identify controlled test leads when interpreting later business activity.

## First useful interpretation

Inspect entry pages, sample/guide selections, enquiry CTA clicks, form starts, error categories and confirmed enquiries together. If many starts fail with service errors, fix delivery first. If a guide receives use without enquiries, consider that compatible with its independent-help objective. Low volume, analytics opt-in and a new site's limited data prevent strong conversion or demand claims. Lead suitability needs separate human assessment; this website does not measure revenue, savings or rankings.
