# Part B rubric mapping and handover

This is the initial development handover. The published verification on 19 November is recorded in the [GTM notes](gtm-setup.md), and the final Word portfolio contains the current assessment evidence.

The implementation is designed to support the five Excellent descriptors. This is an evidence map, not a predicted mark. The assessment brief requires publication and verified GA4 collection; those are deliberately **not claimed complete** in this first draft.

| Criterion (8 points each) | Evidence prepared in this repository | Remaining evidence or limitation |
| --- | --- | --- |
| Website functionality and technical implementation | Five explicit static HTML entries, shared build-time chrome, base-aware navigation and assets, typed form states, sitemap/canonicals, official Pages workflow, production-output checks and browser tests | No public deployment or successful Actions run yet. Verify final site, direct refreshes and real enquiry delivery after configuration. |
| User experience, accessibility and visual consistency | Consultancy visual system, deliverable-led home visual, mobile navigation with Escape/focus behaviour, active states, skip link, semantic landmarks, labelled form/errors, reduced motion, print guide; five pages tested at desktop/tablet/mobile/narrow widths | Automated axe checks and scripted keyboard checks do not prove complete accessibility. Screen-reader and additional browser/device reviews remain useful and unperformed. |
| Content quality and search implementation | Complete Australian-English copy, broader clarity-review positioning, fair DIY comparison, ungated labelled sample and retain item, useful independent guide and official Google link; unique titles/descriptions, natural qualified keywords, indexable HTML, canonical URLs and sitemap | Student editorial review, search indexing and audience/keyword demand are unverified. No ranking, traffic or outcome claims are made. |
| Google Analytics implementation | Configurable consent-based layer, one manual page view, safe CTA/sample/guide/form events, `generate_lead` only on confirmed acceptance, mock-verified payloads; strategic [measurement plan](measurement-plan.md) | **Not assessment-complete:** a real property/ID, public deployment, enhanced-measurement review, key-event configuration, Tag Assistant/DebugView and Realtime evidence are still required. |
| Transparent and critical use of AI | Actual tool/input disclosure, documented decisions and iteration, examples of code/copy, explicit limits, tested failure branches and visual corrections in the [development record](development-record.md) | Student must perform and record their own review/refinement and demonstrate understanding. Do not present assistant refinements as already completed human judgement or claim Copilot use. |

## How the two journeys are supported

**Referral or service search:** Home explains the offer → The audit defines scope → ungated sample shows the deliverable → suitability and arrangements qualify expectations → Enquire explains inputs and next steps.

**Informational search:** Coverage checklist provides practical steps and a fictional worked example → owner can use it and leave without enquiring → optional service/sample links support further exploration.

## Search intent allocation

| Intent | Destination and treatment |
| --- | --- |
| `cleaning business website audit Perth` | The audit title and qualified scope copy; explicitly content/enquiry review, not technical or comprehensive SEO |
| `website content audit Perth`; `website copywriting Perth` | Natural qualified service discussion; replacement wording limited to agreed content |
| `Google Business Profile service area`; `change Google Business Profile service area` | Checklist title and useful instructions with the official Google support link |

No household-cleaning booking intent, duplicated location landing pages, ranking promises or unverified search volumes are introduced.

## Assessment submission checklist for the owner

- Review this first draft; record real decisions and changes.
- Activate **Settings → Pages → Source → GitHub Actions** and publish the reviewed version when ready.
- Configure the form, verify actual acceptance and inbox receipt, and redact sensitive details in evidence.
- Create/configure GA4, disable conflicting automatic measurements, mark `generate_lead` as the primary key event, and verify through Tag Assistant, DebugView and Realtime.
- Include the actual public website URL and adapt the supporting records to the required MS Word submission format. Attach only tests and screenshots that you actually performed or can clearly attribute.

Do not describe the site as published, analytics as verified, human refinements as completed or customer outcomes as achieved until those statements are supported.
