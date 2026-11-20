# Google Tag Manager integration, 9 November 2026

The site now loads the user-supplied public container **GTM-PG38VX8P** after analytics opt-in, on all six pages. The site's shared module uses the standard `gtm.start` / `gtm.js` startup event and asynchronous container script. The submitted snippet mixed the GTM script with a `gtag('js', ...)` command; GTM startup is used instead. No unconditional noscript iframe is included because it would bypass the site's consent choice.

`VITE_GTM_CONTAINER_ID` defaults to this container and is explicitly set in the Pages workflow. GTM takes precedence over `VITE_GA4_MEASUREMENT_ID`, so the app cannot load both the container and a separate direct GA4 script. To use the older direct GA4 implementation instead, explicitly set `VITE_GTM_CONTAINER_ID` to an empty string when building, and supply a real GA4 ID. Set both variables empty to disable both integrations.

## Published verification on 19 November 2026

The owner confirmed `form_start` in DebugView and configured a closed enquiry funnel. The GA4 Events report for 20 October to 19 November 2026 showed five `generate_lead` events across three users. The owner also verified that GA4 lists it as a key event and that a labelled test enquiry reached the Formspree inbox on 19 November. Figures 3 to 5 in the portfolio record the results. The sample includes test traffic.

## Setup and retest the published container

Use these checks when the published container or GA4 property changes.

1. The published Google tag automatically sends page views and Enhanced Measurement form interactions. The site also supports a direct GA4 fallback. Keep one source for each event if the container configuration changes.
2. The app sets safe global page context before the container loads and passes the canonical URL via data layer variables for custom events. Use the safe values instead of the browser's full Page URL and Referrer.
3. The published container forwards `generate_lead`, `coverage_check_start` and `coverage_check_complete` from exact custom events. If adding custom tags for automatic events such as `page_view` or `form_start`, disable the overlapping automatic event first. Use sample page views for reporting the sample journey unless a click tag has been published and verified.
4. Require analytics consent for the Google tag and event tags. Keep user-provided data detection disabled and keep advertising consent denied. Check that withdrawal suppresses collection on later interactions.
5. On the deployed site, use an ordinary clean browser with DevTools Network set to preserve the log. Check no requests to GTM or GA before choice, after declining and on the next page. Opt in, then withdraw via footer **Analytics choices**. After withdrawal inspect Network again while interacting with the form, changing its anchor and navigating. Check for both ordinary and cookieless collection (`collect`, `g/collect`) and in-flight requests separately. Repeat in Tag Assistant to inspect the tags and consent state before and after withdrawal. A tag already running in that document must respect the settings in step 4.
6. Use Tag Assistant and DebugView on the intended GA4 property to check one `page_view` on opted-in load, none on anchor-only navigation, and one `form_start` on first interaction. Before leaving Preview, check fixed parameters for withheld form details. Use a controlled synthetic enquiry with normal browser mode for actual provider/inbox acceptance and check exactly one `generate_lead` in Realtime. Confirm the event and configured funnel in standard GA4 reports after processing, and check whether internal/developer traffic filters excluded the test. Keep validation and request-failure checks separate and confirm they produce zero leads.

The [measurement plan](measurement-plan.md) defines triggers and decisions. Earlier test records and the Word draft describe the initial 2 November direct-GA4 version; they are historical evidence, not verification of this container.

## Guided coverage check events

The site emits `coverage_check_start` on the first edit or use of the example and `coverage_check_complete` on the first valid coverage update, at most once each per page load and only with analytics consent. The data layer contains the event name and safe page context. The check's answers stay in the browser.

The coverage tool uses an accessible group of controls. Enquire is the native form for Enhanced Measurement. The initial Google tag sets canonical page context before its automatic events. The Enquire form also has an explicit action URL so Enhanced Measurement can report its destination without query text.

The existing GTM container has a GA4 Event tag and a Custom Event trigger for each event. Both use the same GA4 stream as `generate_lead`, safe page parameters and an `analytics_storage` requirement. To retest, allow analytics in Preview, enter a service and its confirmed areas or use the Maylands example, then show the plan. Verify both tags and their hits in Tag Assistant. `generate_lead` is the main key event.

On 20 November 2026, one controlled visit on the published site appeared in GA4 Realtime as one `coverage_check_start`, one `coverage_check_complete` and one `file_download` for `sample-website-audit-report.pdf`. The existing automatic PDF event can be filtered by `file_name`. The closed coverage exploration uses `page_view` on the checklist URL, then the exact start and completion event names. Realtime test activity does not establish sustained use or a completion rate.

## Validation

Browser tests stub the GTM script, verify consent gating, one startup and page view, safe event objects, no submitted values/query data, and no separate direct GA4 request. The direct-GA4 form integration suite explicitly disables GTM to preserve its independent coverage. These are local application checks, not evidence of container publication or real GA4 collection.

The earlier run is recorded in `docs/evidence/gtm-test-summary.json`. Current mock coverage also exercises first-visit and footer focus, cross-tab withdrawal, and withdrawal while the tag script is still loading.
