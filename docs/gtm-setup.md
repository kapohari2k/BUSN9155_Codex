# Google Tag Manager integration, 9 November 2026

The site now loads the user-supplied public container **GTM-PG38VX8P** after analytics opt-in, on all five pages. The site's shared module uses the standard `gtm.start` / `gtm.js` startup event and asynchronous container script. The submitted snippet mixed the GTM script with a `gtag('js', ...)` command; GTM startup is used instead. No unconditional noscript iframe is included because it would bypass the site's consent choice.

`VITE_GTM_CONTAINER_ID` defaults to this container and is explicitly set in the Pages workflow. GTM takes precedence over `VITE_GA4_MEASUREMENT_ID`, so the app cannot load both the container and a separate direct GA4 script. To use the older direct GA4 implementation instead, explicitly set `VITE_GTM_CONTAINER_ID` to an empty string when building, and supply a real GA4 ID. Set both variables empty to disable both integrations.

## Container configuration still required

Adding a container is not proof of GA4 collection. The container's current contents and publication status have not been verified by the assistant. Its owner must:

1. Configure one Google tag with the intended **GA4 G- measurement ID**, which is different from the GTM container ID. Set `send_page_view` to `false`, `allow_google_signals` to `false`, and `allow_ad_personalization_signals` to `false`. Initialise this tag before the custom event tags.
2. Create data layer variables for `page_location`, `page_referrer`, `page_title`, `placement` and `error_category`. Use these safe page values in tag configuration and event parameters. Do not use built-in Page URL/Referrer values that can include user query data.
3. Configure GA4 event tags for the exact data layer event names: `page_view`, `enquiry_cta_click`, `sample_select`, `guide_select`, `form_start`, `form_error`, `generate_lead`. Trigger on these custom events, not generic form submissions or clicks. The app pushes plain event objects in GTM mode. Do not forward the internal `gtm.js` startup event as a GA4 marketing event.
4. Require `analytics_storage` consent on analytics tags. Disable automatic form/click/history measurements and avoid any tag that reads form fields, submits URLs, captures free text or independently generates page views. The app sends safe data only; arbitrary tags added inside the container could collect other data and are the container owner's responsibility. Advertising consent is denied. Revocation stops app events and updates consent; already-executed container code remains resident and must respect consent checks.
5. In GTM Preview / Tag Assistant, allow analytics on the website and confirm one container, one page view and the expected events. Publish the reviewed container. Verify the correct GA4 property in DebugView and Realtime; mark `generate_lead` as the primary key event only for service-confirmed submissions. The live form still needs its own endpoint.

The [measurement plan](measurement-plan.md) defines triggers and decisions. Earlier test records and the Word draft describe the initial 2 November direct-GA4 version; they are historical evidence, not verification of this container.

## Validation

Browser tests stub the GTM script, verify consent gating, one startup and page view, safe event objects, no submitted values/query data, and no separate direct GA4 request. The direct-GA4 form integration suite explicitly disables GTM to preserve its independent coverage. These are local application checks, not evidence of container publication or real GA4 collection.

Executed: `npm run build`, `npm run check:dist`, 29 production-browser tests and 15 isolated direct-GA4/form tests, all passed. Run timestamps and counts are saved in `docs/evidence/gtm-test-summary.json`.
