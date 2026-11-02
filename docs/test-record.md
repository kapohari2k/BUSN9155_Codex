# Actual test record

## Scope and environment

Testing performed on **2 November 2026**, against the local production build mounted at **`/BUSN9155_Codex/`**. This is not evidence of a public deployment, live Formspree delivery or real GA4 collection.

- Node 24.19.0, npm 11.9.0, Vite 8.3.5, TypeScript 5.9.3.
- Playwright 1.64.1 with system Chromium 154.0.8037.57, headless, on Linux.
- Automated axe checks through `@axe-core/playwright` 4.14.0.
- Desktop/tablet/mobile/narrow viewport widths: **1440, 768, 390 and 320 CSS pixels**. These are browser viewports, not physical-device tests.
- Final production suite began at **18:25:56 Australia/Perth** (10:25:56 UTC). Final isolated integration suite began at **18:25:59 Australia/Perth** (10:25:59 UTC).

## Final executed results

| Command/check | Actual result |
| --- | --- |
| `npm install --legacy-peer-deps` | Passed; declared dependencies installed and lockfile generated |
| `npm run build` | Passed, including strict TypeScript checking; all five HTML pages emitted into `dist` |
| `npm run check:dist` | Passed; unique titles/descriptions, one H1 per page, Australian-English language tags, canonical URLs, sitemap, robots, project-based internal links/assets, emitted fonts/favicon, font licences and publication allowlist |
| `npm test` | **27 passed, 0 failed, 0 skipped, 0 flaky** in the final run, approximately 29.8 seconds |
| `npm run test:integration` | **15 passed, 0 failed, 0 skipped, 0 flaky**, approximately 17.8 seconds; separate `.test-dist` with all external traffic blocked or mocked |
| `npm run capture` | Passed; ten full-page production screenshots, all five pages at 1440px and 390px |
| Official action release checks | Read official release-page redirects for checkout, setup-node, configure-pages, upload-pages-artifact and deploy-pages; selected current major versions recorded in README |

The saved [test summary](evidence/test-summary.json) records test names, outcomes, run timestamps and SHA-256 hashes of the tested production files. Full Playwright JSON reports are available locally at `test-results/site.json` and `test-results/integration.json`; those generated working reports are ignored by Git.

## What the 27 production tests exercised

- **20 page/viewport combinations:** all five pages visited directly and refreshed at all four widths. Main headings and active navigation were checked; no horizontal overflow, uncaught page errors or failing asset responses were observed. Imported SVG favicon URLs resolved below the repository path.
- **Automated accessibility:** no violations from the selected WCAG 2 A/AA and 2.1 A/AA axe rules in the 20 page/layout scans. A further scan of the invalid-form state also passed its selected accessibility rules.
- **Link integrity:** every internal anchor and page URL from all five pages resolved under `/BUSN9155_Codex/`; fragment targets existed in the returned production HTML.
- **Keyboard disclosure navigation:** first Tab reached the skip link; activation focused main content; keyboard activation opened the mobile menu; Tab reached its first link; Escape closed it and restored the toggle focus; desktop resizing restored visible navigation.
- **Both visitor journeys:** Home → audit → sample → suitability → enquiry, and checklist → official Google guidance link / optional audit exploration.
- **Unconfigured integrations:** a valid completed form showed “nothing sent” without any third-party request or false success. Answers remained in place. No GA script or consent banner was created without a measurement ID.
- **Validation:** required fields, malformed email, unsafe URL scheme, blank review reason and malformed optional profile link produced specific errors, an accessible focused summary and invalid-field states. Values were retained.
- **Reduced motion and guide:** reduced-motion scrolling changed to `auto`; the guide did not overflow at 200% root text size in the tested 1280px viewport; print media retained the checklist/example and hid site navigation.
- **No JavaScript:** content and full navigation remained available, the form's no-script message was present, and the submit control stayed disabled. No form answers were added to a URL.

These checks support the implementation but are not a full WCAG conformance assessment. The 200% text test covered the guide; it is not a claim that every page was independently tested at every zoom level.

## What the 15 isolated integration tests exercised

The fixture endpoint `https://formspree.io/f/localLiftTestOnly` and measurement ID `G-TESTONLY123` are **test identifiers only**. External requests were blocked or fulfilled inside Playwright. Nothing was sent to a real form account or Google property.

1. No analytics script before consent; decline respected; subsequent allow created one script and one safe manual page view, with `send_page_view: false`.
2. HTTP success plus JSON `ok: true` alone displayed and focused receipt confirmation, hid the form and queued one `generate_lead`.
3. Pending state disabled the submit button and rejected another submit event; one request and one lead after acceptance.
4. HTTP 422 rejection retained answers and emitted only a safe service-error category.
5. HTTP 429 rate limit retained answers and did not count a lead.
6. HTTP 503 outage retained answers and did not count a lead.
7. HTTP 200 without explicit acceptance stayed unconfirmed.
8. HTTP 200 with `ok: false` stayed unconfirmed.
9. HTTP 200 with malformed/non-JSON response stayed unconfirmed.
10. Network failure retained answers; retry succeeded without re-entering them.
11. A simulated 15-second timeout reported uncertain receipt, retained answers and did not count a lead.
12. Validation queued only a fixed error category, never the entered invalid value.
13. Enquiry, sample and guide selections used approved placement labels.
14. Revoking analytics retained form answers and stopped further application events; the next page loaded no analytics queue.
15. Unavailable local storage did not break the site or enable analytics by itself.

The confirmed-submission test also inspected the queued analytics calls for identifying email, supplied URLs, private free text and page-query data. None were present. Form payload values appeared only in the deliberately intercepted form request. The mock verifies application logic and queue contents; it does **not** verify Google's server-side processing or a provider's live acceptance contract.

## Visual review and corrections

The assistant inspected the actual desktop and mobile home-page screenshots, then the inner-page desktop/mobile captures. Review led to SVG replacements for unreliable arrow glyphs, a footer logo spacing correction, larger body text in several components, and real word separation when inner-page heading line breaks are hidden on mobile. Final heading text is asserted in the page tests.

An earlier production run had 25 passes and two failures caused by test assumptions: the mobile menu's name changes from “Menu” to “Close”, and Playwright's text locator did not expose the nested `noscript` message as expected. Investigation used the actual DOM and navigation sequence; the tests now use stable/specific selectors. No failing accessibility rule or application assertion was suppressed.

| Page | Desktop evidence | Mobile evidence |
| --- | --- | --- |
| Home | [1440px](evidence/home-desktop.png) | [390px](evidence/home-mobile.png) |
| About | [1440px](evidence/about-desktop.png) | [390px](evidence/about-mobile.png) |
| The audit | [1440px](evidence/audit-desktop.png) | [390px](evidence/audit-mobile.png) |
| Coverage checklist | [1440px](evidence/coverage-desktop.png) | [390px](evidence/coverage-mobile.png) |
| Enquire | [1440px](evidence/enquire-desktop.png) | [390px](evidence/enquire-mobile.png) |

## Not performed / still required

- **Public publication:** no push to `main`, Actions dispatch, Pages activation or public deployment was performed. The workflow itself has not run on GitHub.
- **Real form:** no real endpoint supplied. Live acceptance, account/domain configuration, notification and inbox delivery remain unverified.
- **Real GA4:** no property/real ID supplied. Tag Assistant, DebugView, Realtime, enhanced-measurement settings and key-event configuration remain pending.
- **Additional access checks:** no physical mobile device, Safari, Firefox, screen-reader session or independent human usability test was performed.
- **Marketing outcomes:** search indexing, rankings, audience demand, lead quality and business outcomes were not measured or established.

There are no unresolved failures in the final executed local suites. The [measurement plan](measurement-plan.md) lists the remaining live verification steps. Assessment attachments, documents, screenshots and the mock test build are excluded from published `dist`.
