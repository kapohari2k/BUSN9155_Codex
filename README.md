# Local Lift

A seven-page static website for the proposed **Website and SEO audit for owner-led Perth residential cleaning businesses**, developed for BUSN9155 Part B. The free Quote Form Fixer turns field labels and a pricing method into a copyable draft in the browser.

Public GitHub Pages address: **https://kapohari2k.github.io/BUSN9155_Codex/**. The working tree preview shows local changes before publication.

## Run locally

Use Node.js **24 LTS** (`.nvmrc`). Vite 8 requires Node 20.19+ or 22.12+; Node 24 was used here.

```sh
cd /workspace/BUSN9155_Codex
npm install --legacy-peer-deps
npm run dev
```

Vite prints the development address. Development uses `/` by default. If your checkout is elsewhere, use its actual directory. Run the commands from the repository checkout.

## Build and preview the actual Pages path

```sh
npm run build
npm run check:dist
VITE_BASE_PATH=/BUSN9155_Codex/ npm run preview -- --host 127.0.0.1 --port 4173
```

Open the preview origin printed by Vite **with `/BUSN9155_Codex/` appended**. Check the audit, sample report, quote form fixer, coverage checklist, About and Enquire pages directly under that directory and refresh them.

PowerShell equivalent for preview:

```powershell
$env:VITE_BASE_PATH='/BUSN9155_Codex/'
npm run preview -- --host 127.0.0.1 --port 4173
```

`vite.config.ts` uses the requested callback expression:

```ts
base: process.env.VITE_BASE_PATH ?? (command === 'build' ? '/BUSN9155_Codex/' : '/')
```

The default output is `dist`. All seven pages are explicit build inputs. Shared navigation, metadata and footer are inserted at build time. Internal links include the project base. Fonts and the SVG favicon use ES module imports and are emitted into `dist/assets` with `assetsInlineLimit: 0`.

## Published enquiry and analytics checks

The site loads **GTM-PG38VX8P** after analytics opt-in. GTM takes priority over direct GA4 to avoid duplicate tracking. The owner confirmed live Formspree inbox delivery and GA4 reporting on 19 November 2026. See [GTM setup and verification](docs/gtm-setup.md) for the reported counts and the procedure for retesting a changed container.

## Optional configuration

Copy `.env.example` to `.env.local` for local development. Vite embeds `VITE_*` settings in public output: they must **never contain secrets**. Restart development or rebuild after changes. GitHub Actions uses **repository variables**, not your local env file.

| Setting | Purpose | Empty/default behaviour |
| --- | --- | --- |
| `VITE_FORMSPREE_ENDPOINT` | Real Formspree form URL, exactly `https://formspree.io/f/YOUR_ID` | Live submission disabled, clear availability notice, no data sent |
| `VITE_GTM_CONTAINER_ID` | Google Tag Manager container; takes priority over direct GA4 | Defaults to `GTM-PG38VX8P`; blank disables GTM |
| `VITE_GA4_MEASUREMENT_ID` | Real GA4 web-stream ID, such as `G-…` | No Google script, analytics requests or consent panel |
| `VITE_SITE_URL` | Full canonical directory URL ending in `/` | Uses the deployment address above |
| `VITE_BASE_PATH` | Shell/workflow variable for Vite's base | Build: `/BUSN9155_Codex/`; dev/preview: `/` |

An invalid form endpoint or measurement ID also stays disabled. The form provider is intentionally restricted to Formspree. To choose another provider, adapt the endpoint validation and confirmed-acceptance contract in `src/form.ts`; do not assume every successful HTTP response means acceptance.

### Enable the real enquiry form

1. Create a Formspree form under the account that will receive enquiries. Confirm its inbox, access, notifications, retention and any domain restrictions for the published site. Do not put inbox credentials into source code.
2. Review the information-use copy in `enquire.html` against the actual handling arrangements. Use only non-sensitive test data during verification.
3. Add the real endpoint as repository variable `VITE_FORMSPREE_ENDPOINT` in **Settings → Secrets and variables → Actions → Variables**. Use the same variable in `.env.local` only if you want to test locally.
4. Rebuild/deploy only when ready. Submit a controlled test on the published origin. Confirm Formspree returns JSON with `ok: true`, the receipt screen appears, and the configured recipient actually receives the enquiry. A receipt screen alone does not prove inbox delivery.
5. Test an invalid field and a failed request. Answers should stay in the form. Pending requests disable the submit button. Receipt-uncertain errors warn against immediate duplicate retries.

The form collects email, business website and what the owner wants reviewed. A public Google Business Profile link is optional. Bare domains are sent as HTTPS links. Answers are sent by POST only to the configured endpoint. They are never added to analytics or page query strings. No passwords, payment or account access are requested. With JavaScript unavailable, the submit button stays disabled and a message explains why. Answers are not saved to browser storage and can be lost on refresh or leaving the page.

### Enable GA4

Follow the [measurement plan](docs/measurement-plan.md) before adding `VITE_GA4_MEASUREMENT_ID` as a repository variable and rebuilding. Analytics loads only after an explicit analytics opt-in. With GTM enabled, configure the Google tag and GA4 event tags in the container as documented above. Disable automatic page views from browser history changes, form interactions and unnecessary click tracking in GA4 to avoid duplicate events or unsanitised parameters. `generate_lead` is the recommended primary key event, only after service-confirmed submission.

## Deploy changes

The workflow at `.github/workflows/deploy.yml` publishes reviewed changes pushed to `main`.

1. Review the website, business facts and disclosures. Configure and verify the form/GA4 when available.
2. In the repository, choose **Settings → Pages → Source → GitHub Actions**.
3. Add the optional repository variables above, then push the reviewed work to `main`, or run the deployment workflow manually after it exists on GitHub.
4. The build job installs with `npm install --legacy-peer-deps`, sets the project base, builds and checks `dist`, then uploads it. Deployment has `needs: build`, the `github-pages` environment, Pages/OIDC permissions and deployment concurrency.
5. Verify the actual public URL, direct page refreshes, assets, form delivery and GA4 using the live checklist in the measurement plan. Do not treat a local test or a green Actions run as proof of analytics collection.

Official release pages checked on 2 November 2026: [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0), [configure-pages v6.0.0](https://github.com/actions/configure-pages/releases/tag/v6.0.0), [upload-pages-artifact v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0), [deploy-pages v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1). The workflow uses those supported major versions and Node 24 LTS. It does not require `npm ci` or lockfile-dependent caching. A generated `package-lock.json` is included for review.

## Test and capture evidence

```sh
npm run build
npm run check:dist
npm test
npm run test:integration
# With the production preview running on port 4173:
npm run capture
```

Browser tests use `/usr/bin/chromium` when installed, or `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if supplied. On other machines, run `npx playwright install chromium` (or `npx playwright install --with-deps chromium` where system dependency installation is appropriate). Without a system executable, Playwright uses its installed browser.

The test runner starts the correctly based preview automatically if needed. Integration tests build into ignored `.test-dist`, use clearly labelled mock-only IDs and block or intercept all external requests. **Never deploy `.test-dist`.** JSON test reports and failure traces live under ignored `test-results/`. Screenshots captured into `docs/evidence/` are local-production evidence, not live-site evidence.

## Handover

- [Early Word draft](docs/Local-Lift-Part-B-supporting-draft.docx), retained as a development record and superseded by the final Word portfolio
- [Measurement plan and live verification](docs/measurement-plan.md)
- [Initial local test record from 2 November](docs/test-record.md)
- [Development and AI-use record](docs/development-record.md)
- [Initial rubric mapping and handover](docs/rubric-mapping.md)
- [Font attribution and licence notes](docs/third-party-notices.md)

The public sitemap is at `/BUSN9155_Codex/sitemap.xml`. On project Pages, crawlers look for robots rules at the host root. Submit the project sitemap URL directly in Google Search Console.

Only `dist` is uploaded by the Pages workflow. Assessment attachments, supporting documents, browser evidence, source files, test builds and env files are not copied into that directory. There is no runtime server, database, authentication, AI API or other hosting service. Optional Formspree and GA4 are the only external runtime integrations.
