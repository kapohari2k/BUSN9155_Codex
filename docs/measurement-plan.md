# Local Lift measurement plan

## Objective and boundaries

Help a suitable Perth residential cleaning business owner understand the review, inspect a sample, assess fit and enquire. The independent checklist journey is also useful; a visitor who solves a simple update without enquiring is not automatically a failed visit.

The analytics layer is implemented but **disabled until a real GA4 web-stream measurement ID is supplied and the visitor opts in**. No GA4 property was created or connected during this draft. Local mocked event checks are not collection evidence.

## Event specification

| Event | Exact trigger | Safe parameters | Intended decision |
| --- | --- | --- | --- |
| `page_view` | Once per full page load, after analytics opt-in or a previously saved allow choice | Known canonical `page_location`, fixed `page_title`, empty `page_referrer` | Which entry/content pages are used? Compare the guide and offer journeys without assuming search demand. |
| `enquiry_cta_click` | Click a marked enquiry link | Fixed `placement`: `header`, `footer`, `home-close`, `audit-intro`, `audit-close` | Are suitable next steps visible at useful points? Compare clicks with starts rather than treating clicks as leads. |
| `sample_select` | Click a marked link to the ungated sample | Fixed `placement`: `home-hero`, `about-sample`, `audit-intro`, `audit-contents`, `guide-close`, `enquire-aside` | Are visitors choosing to inspect the deliverable before deciding? A click does not prove reading or persuasion. |
| `guide_select` | Click a marked guide link | Fixed `placement`: `header`, `footer`, `home-guide`, `about-guide`, `enquire-success` | Is the independent guide being selected? Direct guide landings appear in page views. |
| `form_start` | First focus inside the enquiry form on that page load | None | Is the form being started after fit information is available? Not every start should become an enquiry. |
| `form_error` | A failed submit attempt | One fixed `error_category`: `validation`, `unavailable`, `network`, `service`, `unconfirmed`, `timeout` | Is friction a field issue, deliberate unavailability or a service/connection problem? Fix technical errors before drawing marketing conclusions. |
| `generate_lead` | Exactly once when Formspree responds with HTTP success **and JSON `ok: true`** | None | Count service-confirmed enquiries as the primary site action. Does not establish inbox delivery, suitability, sales or business results. |

Links to the guide and the sample are tagged, including the guide's header/footer navigation and the audit's on-page Sample link. Repeated selections are events, not unique readers; an anchor selection does not establish that the content was read.

Use `generate_lead` as the **main key event**. Configure once-per-event counting; the form blocks pending duplicates and emits once per acceptance. A new page load and genuinely new submission can still count again. Consider CTA, sample, guide and form-start events diagnostic, not equal-value key events.

If useful, register `placement` and `error_category` as **event-scoped custom dimensions** in GA4. Do not create dimensions from form inputs, URLs supplied by visitors, names or message text. Avoid interpreting tiny counts or opted-in traffic as representative of every visitor.

## Privacy and duplication controls

- Empty or malformed measurement IDs load no Google script and create no analytics UI.
- With a valid ID, “Allow analytics” and “Continue without analytics” provide an explicit choice. The choice alone is stored under `local-lift-analytics`; form answers are not stored there. Footer “Analytics choices” permits changes.
- Storage failures do not crash the site. Without storage, the current page can respect a choice; it may need to ask again on the next page.
- `send_page_view: false` prevents the initial configuration call from adding a second page view. A manual `page_view` is sent once. Static HTML page changes produce a new page load; hash navigation does not produce another page view.
- Page context is a known canonical URL. The current query, fragment, inbound referrer and submitted URLs are not used. The GA script uses `referrerPolicy: no-referrer`. No outbound-link URL is sent by custom events.
- `allow_google_signals` and ad personalisation signals are disabled. Consent allows analytics storage only after opting in; advertising storage, ad user data and ad personalisation are denied.
- Event names, placement labels and error categories come from fixed lists. No email, business URL, profile link, free text, form payload, provider error body or credentials enter analytics.
- Revocation stops application events, sets Google's disable flag and denied storage consent, removes the script element and attempts to clear accessible first-party `_ga` cookies. It does not erase already-collected GA data or unload code already executed. Future pages do not load GA after a declined choice. Unsent form answers remain on the current page.
- Google Analytics still uses its normal browser/network and pseudonymous analytics identifiers after opt-in. Do not describe the service as collecting no data. Browser extensions or blocked network access can prevent collection.

## Configure the real property before enabling

1. In the intended Google Analytics account, create a GA4 property for Local Lift and a web data stream for `https://kapohari2k.github.io/BUSN9155_Codex/`. Choose the intended reporting timezone and currency; Australia/Perth and AUD are sensible defaults for this project. The assistant has not created these resources.
2. In the web stream's **Enhanced measurement** settings, turn enhanced measurement off for the first verification. In particular, automatic **form interactions**, **outbound clicks**, **site search**, and **page changes based on browser history** must not add events beside this implementation. Do not enable automatic form content capture, user-provided data or an extra tagging integration.
3. Use only this site's `gtag` implementation. Do not also install a GTM container, another GA plugin or a second manual config snippet. Review any automatic Google tag event detection in the current UI before enabling it.
4. Confirm the information-use copy and analytics choices are accurate. Add the real `VITE_GA4_MEASUREMENT_ID` to GitHub repository variables, then rebuild. An ID is public configuration, not a secret.
5. Mark `generate_lead` as a key event. If the event is not listed yet, create the key event by its exact name or wait until the controlled verification event appears. Do not mark the submit click or `form_start` as a lead.

## Published-site verification, still to do

Use non-sensitive controlled test details. Record timestamps with timezone, the published commit and actual observations. Do not paste measurement credentials, private enquiry text or identifiable data into assessment screenshots.

| Check | How to perform it | Evidence to retain | Current status |
| --- | --- | --- | --- |
| Published pages | Open all five URLs, refresh inner pages, test mobile navigation and emitted assets | Public URL, deployed commit, desktop/mobile screenshots | Not performed; no public deployment in this draft |
| Declined analytics | In a clean browser, decline analytics; inspect Network and visit another page | No GA script or collection requests; saved choice respected | Application behaviour tested locally; published check pending |
| Google tag | Connect Google Tag Assistant to the published URL and opt in | Correct measurement ID, one tag, safe page context, no duplicate page view | Pending real property/ID and publication |
| DebugView | Use Tag Assistant debug mode, then visit a page, select sample/guide, start and submit the configured form | Expected events and fixed parameters in DebugView; no answers or query data | Pending; mocks are not DebugView evidence |
| Confirmed enquiry | Submit once; inspect the service acceptance, receipt view, provider dashboard and inbox | Accepted request and inbox delivery, with identifying details redacted | Live provider unconfigured |
| Error path | Use a controlled invalid field and, in browser tools, block the form request | `form_error` category, no `generate_lead`, retained answers | Mocked locally; live-origin verification pending |
| Realtime | In a normal opted-in session without debug tooling, repeat a controlled visit and action | Events in Realtime for the correct property | Pending; allow for normal reporting delay |
| Key event | Confirm `generate_lead` appears and is marked as the main key event | GA4 configuration and observed key event | Pending |

Tag Assistant/DebugView and Realtime must be checked against the **published origin**. Do not use the local `G-TESTONLY123` fixture as a property ID. Never report these checks complete until there is real evidence. Discard or identify controlled test leads when interpreting later business activity.

## First useful interpretation

Inspect entry pages, sample/guide selections, enquiry CTA clicks, form starts, error categories and confirmed enquiries together. If many starts fail with service errors, fix delivery first. If a guide receives use without enquiries, consider that compatible with its independent-help objective. Low volume, analytics opt-in and a new site's limited data prevent strong conversion or demand claims. Lead suitability needs separate human assessment; this website does not measure revenue, savings or rankings.
