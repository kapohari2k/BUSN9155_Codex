# Google Tag Manager integration, 9 November 2026

The site now loads the user-supplied public container **GTM-PG38VX8P** after analytics opt-in, on all five pages. The site's shared module uses the standard `gtm.start` / `gtm.js` startup event and asynchronous container script. The submitted snippet mixed the GTM script with a `gtag('js', ...)` command; GTM startup is used instead. No unconditional noscript iframe is included because it would bypass the site's consent choice.

`VITE_GTM_CONTAINER_ID` defaults to this container and is explicitly set in the Pages workflow. GTM takes precedence over `VITE_GA4_MEASUREMENT_ID`, so the app cannot load both the container and a separate direct GA4 script. To use the older direct GA4 implementation instead, explicitly set `VITE_GTM_CONTAINER_ID` to an empty string when building, and supply a real GA4 ID. Set both variables empty to disable both integrations.

## Published verification on 19 November 2026

The owner confirmed `form_start` in DebugView and configured a closed enquiry funnel. The GA4 Events report for 20 October to 19 November 2026 showed five `generate_lead` events across three users. The owner also verified that GA4 lists it as a key event and that a labelled test enquiry reached the Formspree inbox on 19 November. Figures 3 to 5 in the portfolio record the results. The sample includes test traffic.

## Setup and retest the published container

Use these checks when the published container or GA4 property changes.

1. Configure one Google tag with the intended **GA4 G- measurement ID**, which is different from the GTM container ID. Set `send_page_view` to `false`, `allow_google_signals` to `false`, and `allow_ad_personalization_signals` to `false`. Initialise this tag before the custom event tags.
2. Create data layer variables for `page_location`, `page_referrer`, `page_title`, `placement` and `error_category`. Use the safe page values in the initial tag configuration and event parameters. They are available from `gtm.js` onward. The known Enquire page path is `/BUSN9155_Codex/enquire.html` regardless of the form anchor or query string. Use these variables in place of built-in Page URL/Referrer values.
3. Configure GA4 event tags for the exact data layer event names: `page_view`, `enquiry_cta_click`, `sample_select`, `guide_select`, `form_start`, `form_error`, `generate_lead`. Trigger on these custom events, not generic form submissions or clicks. The app pushes plain event objects in GTM mode. Do not forward the internal `gtm.js` startup event as a GA4 marketing event.
4. Under **Additional Consent Checks**, make the Google tag and every analytics event tag require `analytics_storage` before firing. Built-in consent handling alone can allow cookieless pings. Turn off automatic form interactions, outbound clicks and history-based page views in the GA4 stream. Keep data collection from form fields and user-provided data detection disabled. The site keeps advertising consent denied. If the same public GA4 measurement ID is provided in `VITE_GA4_MEASUREMENT_ID`, the site also sets its `ga-disable-…` flag on withdrawal while retaining GTM as the only loader.
5. On the deployed site, use an ordinary clean browser with DevTools Network set to preserve the log. Check no requests to GTM or GA before choice, after declining and on the next page. Opt in, then withdraw via footer **Analytics choices**. After withdrawal inspect Network again while interacting with the form, changing its anchor and navigating. Check for both ordinary and cookieless collection (`collect`, `g/collect`) and in-flight requests separately. Repeat in Tag Assistant to inspect the tags and consent state before and after withdrawal. A tag already running in that document must respect the settings in step 4.
6. Use Tag Assistant and DebugView on the intended GA4 property to check one `page_view` on opted-in load, none on anchor-only navigation, and one `form_start` on first interaction. Before leaving Preview, check fixed parameters for withheld form details. Use a controlled synthetic enquiry with normal browser mode for actual provider/inbox acceptance and check exactly one `generate_lead` in Realtime. Confirm the event and configured funnel in standard GA4 reports after processing, and check whether internal/developer traffic filters excluded the test. Keep validation and request-failure checks separate and confirm they produce zero leads.

The [measurement plan](measurement-plan.md) defines triggers and decisions. Earlier test records and the Word draft describe the initial 2 November direct-GA4 version; they are historical evidence, not verification of this container.

## Guided coverage check events

The site emits `coverage_check_start` on the first answer and `coverage_check_complete` on the first result shown, at most once each per page load and only with analytics consent. The data layer contains the event name and safe page context. The check's answers stay in the browser.

The existing GTM container has a GA4 Event tag and a Custom Event trigger for each event. Both use the same GA4 stream as `generate_lead`, safe page parameters and an `analytics_storage` requirement. To retest, allow analytics in Preview, confirm actual service coverage, answer the three observation questions and show the result. Verify both tags and their hits in Tag Assistant. `generate_lead` is the main key event.

On 20 November 2026, one controlled visit on the published site appeared in GA4 Realtime as one `coverage_check_start`, one `coverage_check_complete` and one `file_download` for `sample-website-audit-report.pdf`. The existing automatic PDF event can be filtered by `file_name`. The closed coverage exploration uses `page_view` on the checklist URL, then the exact start and completion event names. Realtime test activity does not establish sustained use or a completion rate.

## Validation

Browser tests stub the GTM script, verify consent gating, one startup and page view, safe event objects, no submitted values/query data, and no separate direct GA4 request. The direct-GA4 form integration suite explicitly disables GTM to preserve its independent coverage. These are local application checks, not evidence of container publication or real GA4 collection.

The earlier run is recorded in `docs/evidence/gtm-test-summary.json`. Current mock coverage also exercises first-visit and footer focus, cross-tab withdrawal, and withdrawal while the tag script is still loading.
