# Development and AI-use record

Prepared 2 November 2026. This records work actually performed by the AI coding assistant in this repository. It is not a claim that the student has already reviewed, approved or independently refined every output.

## Inputs and authorship

- User request: the uploaded `Pasted text.txt`, treated as the instructions for this build.
- Reference material: the final Part A plan and Part B assessment context, including all five rubric criteria. Word document text and tables were extracted for reading. The attached Part A's screenshot evidence was not independently analysed or used as proof of current results.
- AI tool used for this implementation: **OpenAI Codex** in this chat. GitHub Copilot was not used. The user stated that the lecturer approved any AI model; the assistant did not independently verify that approval.
- The user specified the audience, offer, scope, five-page requirement, keywords, form fields, technology, deployment path, analytics constraints and first-draft publication boundary. Routine layout and implementation choices below were made by the assistant, not attributed to the student.

## Important decisions and refinements

| Input or observation | Implementation/refinement | Reason and evidence |
| --- | --- | --- |
| Part A proposes three navigation pages; the current user request requires five distinct pages | Added separate Home and About, kept The audit as Services and Enquire as Contact | Followed the current instruction while preserving the broader offer and independent guide. `vite.config.ts` explicitly builds all five. |
| Offer includes services, inclusions/exclusions, coverage and enquiries | Wrote complete page copy around the broader content review | Coverage is one trigger, not the entire offer. Recurring cleaning and the synthetic Alex persona were not presented as real customers or market evidence. |
| Outside help needs a fair value comparison | Explained comparison and prepared wording; retained DIY/provider guidance | Does not claim that every cleaning business has a problem, or that the service is unique or proven. |
| Owners confirm facts and others publish | Repeated responsibilities at the point of decision, in the sample, process and enquiry guidance | Avoids quietly expanding into implementation or inventing prices and promises. |
| User requested a consultancy identity rather than cleaning stock imagery or a dashboard | Used warm paper, dark green, restrained peach, local Manrope/Newsreader fonts, a small original SVG mark and a review-note visual | Visual emphasis is on the deliverable. No client logos, testimonials or invented qualifications. |
| First desktop/mobile screenshot review showed inconsistent arrow glyphs and a footer logo spacing issue | Replaced decorative symbols with stroke SVG icons; corrected footer brand spacing; increased some small body text | Actual visual iteration. Final screenshots are in `docs/evidence/`. |
| Inner-page mobile screenshot review showed words joining when a heading line break was hidden | Added actual separating spaces around the editorial line breaks and checked complete heading text in the page tests | Fixed a visual/content issue that automated contrast and overflow checks had not caught. |
| GitHub Pages is served below a repository path | Used explicit HTML entries, base-aware generated links and canonical metadata, imported media and no SPA history router | Production checks exercise `/BUSN9155_Codex/`, including inner-page refreshes and all fragments. |
| Need current official deployment actions | Read official GitHub release redirects before writing the workflow | Checked versions are linked in the README. Workflow created but never triggered in this session. |
| No live form endpoint supplied | Kept it disabled with an honest availability notice, while allowing form exploration | No invented destination and no data transmitted by the unconfigured build. |
| A no-JavaScript form could otherwise fall back to an HTML GET | Disabled the submit button in static HTML; enable it only when the handler is ready; set method POST | Keeps unsent answers out of URLs even if JavaScript is unavailable. Tested fallback content and disabled control. |
| Success must mean actual provider acceptance | Require HTTP success plus JSON `ok: true`; retain answers for failures or uncertain receipt | Browser mocks cover rejection, malformed/negative response, network failure, timeout and successful retry. Only confirmed acceptance triggers `generate_lead`. |
| No real GA4 ID supplied; form answers must stay private | Added opt-in, allowlisted labels/categories, safe canonical page context and manual page views | Tests inspect queued event payloads, not real GA collection. Real property creation and verification remain pending. |
| First production suite had two failing test selectors | Kept a stable menu selector when its accessible name changes to “Close”; selected the `noscript` element directly | Investigation distinguished selector errors from application failures. No accessibility assertions were disabled to get a pass. |

## Examples of generated code and copy to understand

1. **`vite.config.ts`** supplies five build inputs and shared page chrome. Its callback selects `/` for normal development and the project directory for builds. It generates unique metadata, sitemap and robots output. This avoids a rewrite-dependent SPA and keeps content indexable.
2. **`src/form.ts`** validates labelled controls, focuses an error summary, prevents repeated pending submissions and calls only the configured Formspree endpoint. It treats ambiguous responses as unconfirmed, not successful. The service's HTTP/JSON acceptance does not prove inbox delivery.
3. **`src/analytics.ts`** starts Google tagging after consent, sends one manual page view and sends only fixed event parameters. The event helper never receives form values. `generate_lead` is called from the confirmed-success branch of the form handler.
4. **Audit sample copy:** “Tell us your suburb, clean type and property size to request a quote.” It is labelled fictional, conditional on owner confirmation and accompanied by finding, priority reason, placement and publisher. A clear exclusion is deliberately retained.
5. **Suitability copy:** “A simple known update may be a DIY task or something your current web provider can handle.” This supports an informed choice, not a growth or outsourcing assumption.

## Testing and evidence integrity

The [test record](test-record.md) distinguishes the production build, automated accessibility checks, scripted keyboard/browser checks, assistant visual review, mocked integrations and outstanding live verification. No live submissions, real collection checks, customer research, real customer outcomes or student approval are claimed.

The browser tests inspect actual production HTML and emitted assets. The separate integration build uses mock-only identifiers, never sends to a real provider and is excluded from deployment. Raw test reports are generated locally; selected screenshots and a human-readable record are retained outside `dist`.

## Student review and evidence still needed

These are future actions, not completed decisions:

- Review all claims, exclusions, suitability wording and illustrative facts. Record any corrections you make and why.
- Explain the page architecture, base path, form acceptance logic and analytics event decisions in your own words.
- Review the visual hierarchy, mobile layout and guide usability. Note your own judgement rather than adopting the assistant's opinion without checking.
- Configure and verify real Formspree/GA4, publish only after reviewing, and capture actual public-site evidence.
- Convert or adapt the supporting notes to the assessment's required Word format if submitting them. Identify the tool actually used and do not claim Copilot use or independent human refinement that did not occur.

The Excellent AI-use descriptor calls for substantial human refinement. This record supports transparent AI-assisted development and critical testing; it cannot establish student refinement before the student performs and records it.
