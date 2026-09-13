# Task 18 — CI, refresh workflow, deployment

**Depends on:** 16, 17. **Read:** MASTER.md §7, §4.4, §10, §11.

## Goal

Tests run on every PR, data refreshes daily behind the gate, and the site deploys to Cloudflare Pages.

## Files

Create: `.github/workflows/ci.yml`, `.github/workflows/refresh-data.yml`, `docs/deployment.md`, `docs/verification-launch.md`.
Delete: `.github/workflows/.gitkeep` after both workflow files exist.

## Steps

1. **`ci.yml`** — on `pull_request` and on push to `main`. Node 22.13+ (or 24), `npm ci`, then `npm run lint`, `npm run check`, `npm test`, `npm run build`. No network access needed; every test is mocked or fixture-based.
2. **`refresh-data.yml`** — `schedule: cron: '0 3 * * *'` (**03:00 UTC daily**) plus `workflow_dispatch`. GitHub Actions cron is UTC-only, so a local-time schedule would drift an hour twice a year across the EET/EEST boundary; 03:00 UTC lands at 05:00 or 06:00 Athens time year-round, before morning traffic (MASTER.md §7).

   Steps, in order, with a clean checkout as the committed previous state:
   1. Checkout, Node 22.13+ (or 24), `npm ci`.
   2. `npm run golden:check` — offline parser regression check; fail on any committed-output difference.
   3. `npm run build:data` — exactly one live flix fetch; write candidate and metrics. The same rows feed `compareLiveGolden`, whose result is carried to the gate.
   4. `npm run posters -- --dataset .build/schedule.candidate.json` using the repository secret `TMDB_API_KEY`. There is no OMDb key. This updates the candidate and assets before final validation.
   5. `npm run data:budget -- .build/schedule.candidate.json`.
   6. `npm run validate` against the untouched committed dataset, candidate, and metrics. This validates the final JSON and referenced poster assets, including the live golden result.
   7. `npm run promote:data` only after every prior command succeeds, then `npm run lint`, `npm run check`, `npm test`, and `npm run build` against the promoted state.
   8. Commit `src/lib/data/schedule.json`, `static/posters/**`, `data/film-ids.json`, `data/cinema-ids.json`, and `data/identity-decisions.json` **only if the gate and final checks passed**. Message: `data: refresh YYYY-MM-DD`.
   9. **On any failure: exit non-zero and commit nothing.** The candidate is never promoted before validation; the previously committed dataset keeps serving and GitHub's default failure notification is the alert.
3. **No Athinorama job.** Do not create a scraper, weekly canary, schedule entry, spot check, or validation step for Athinorama. Only the daily flix refresh and manual dispatch exist in this workflow.
4. **Cloudflare Pages** — connect the repo. Build command `npm run build`, output directory `build`, Node 22.13+ (or 24). Document the exact dashboard steps in `docs/deployment.md`, including where `TMDB_API_KEY` goes (GitHub repository secrets, **not** Cloudflare — posters are resolved at build time in Actions, not at deploy time).
5. **Repository is public** (MASTER.md §7). Confirm no secret value is committed; variable names such as `TMDB_API_KEY` are expected and are not findings.
6. **`docs/deployment.md`** — record: Cloudflare settings, the single secret name `TMDB_API_KEY`, manual refresh (`workflow_dispatch`), identity-rename review, deliberate golden re-bless (regenerate, review, run named `;` tests, commit), and bad-data rollback (revert the data commit; Pages redeploys).
7. **Pre-launch checklist** in `docs/deployment.md`, per MASTER.md §11 — verify before making the site public:
   - Footer shows the flix.gr attribution linkback.
   - Footer shows the TMDB logo and prescribed notice.
   - No editorial content from flix is republished: no `release__reviews__rating`, no reviews, no images.
   - The posture is recorded: launch with attribution, seek no permission, comply immediately on objection.
8. **`docs/verification-launch.md`** — dated end-to-end evidence: 360/640/900/1280px; both themes; persisted-dark reload; reduced motion; character-by-character filtering with measured CLS and zero network requests; keyboard tile open, mobile focus containment, `Esc`, and focus return; valid/expired day behavior; all-pairs hall accounting; and the dead-source drill. For the drill, point flix at a dead URL and confirm non-zero exit, no promotion/commit, previous deployment still serves, and advancing `now` beyond its dates removes expired chips/showtimes and shows staleness rather than wrong dates.

## Acceptance criteria

- [ ] `ci.yml` passes on a PR, including `npm run lint`.
- [ ] `workflow_dispatch` on `refresh-data.yml` completes and commits updated data.
- [ ] Pointing the flix adapter at a dead URL makes the run fail, commit nothing, and leave the deployed site serving the previous dataset — run this drill and record it (MASTER.md §10).
- [ ] A deliberate golden-file diff fails the refresh run.
- [ ] Cloudflare Pages serves the built site; posters load from the CDN.
- [ ] No secrets in git history.
- [ ] `TMDB_API_KEY` is set via `gh secret set TMDB_API_KEY --repo vdassios/calcine`; no other API key exists.
- [ ] The pre-launch checklist is complete and every item verified.
- [ ] The full dated launch verification matrix is complete, including expired-date behavior in the dead-source drill.
- [ ] The workflow contains no Athinorama code, schedule, or validation step.

## Do not

- Do not schedule in local time.
- Do not commit when the gate fails.
- Do not fetch or validate Athinorama at all.
- Do not put API keys in Cloudflare.
- Do not add a deployment provider beyond Cloudflare Pages.
