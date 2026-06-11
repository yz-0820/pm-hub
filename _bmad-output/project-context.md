---
project_name: 'PM Hub'
user_name: 'PM Hub'
date: '2026-06-11'
sections_completed: ['technology_stack', 'critical_rules', 'domain_rules', 'validation']
existing_patterns_found: 12
---

# Project Context for AI Agents

This file records the implementation rules AI agents must follow when working on PM Hub. Keep it concise and update it when architectural decisions change.

---

## Technology Stack & Versions

- Framework: Next.js 16 App Router with React 19 and TypeScript.
- Runtime: use Node.js 22.x for PM Hub development and builds. Do not switch to Node 24 for this repo unless `better-sqlite3` compatibility has been revalidated.
- Package manager: npm.
- Styling: Tailwind CSS utility classes with existing component conventions. Keep UI changes aligned with current layout and mobile bottom navigation.
- Database: Drizzle ORM with Postgres connection from `DATABASE_URL`. Production must use a persistent online database such as Neon; local SQLite artifacts are legacy/local-only and must not be treated as production storage.
- Search: Meilisearch integration exists; search behavior should remain explicit about indexed fields and rebuild requirements.
- Content ingestion: RSS and career content fetchers live under `config/`, `lib/rss/`, `lib/career/`, and `scripts/prod/`.
- AI tooling: PRD generation, prototype generation, and flowchart generation are PM Hub tool features. Model keys must stay server-side unless a variable is intentionally public with `NEXT_PUBLIC_`.
- Flowchart tool: PM Hub embeds the independently deployed `next-ai-draw-io` app through `NEXT_PUBLIC_FLOWCHART_APP_URL`.

## Critical Implementation Rules

- Do not commit or print secrets. Never expose `DATABASE_URL`, `OPENAI_API_KEY`, `QWEN_API_KEY`, `CRON_SECRET`, Meilisearch keys, or similar values in UI, logs, docs, or final responses.
- Keep `.env.local`, local databases, build outputs, logs, caches, `.next/`, and `node_modules/` out of Git.
- Use `apply_patch` for manual source edits and keep changes surgical. Do not refactor adjacent code unless the request requires it.
- Preserve existing route contracts unless explicitly asked to change them. Important routes include `/articles`, `/career`, `/tools/prd`, `/tools/prototype`, `/tools/flowchart`, and related API routes.
- Local background processes must run silently on Windows. When starting helpers with PowerShell `Start-Process`, use `-WindowStyle Hidden`. Node child processes that start background jobs should use `windowsHide: true` and avoid launching visible `cmd.exe` windows.
- For server/client boundaries, do not import Node-only modules such as `fs`, database clients, or scheduler code into client components.
- For public browser code, only use environment variables prefixed with `NEXT_PUBLIC_`; all provider API keys must remain in server routes.
- Do not weaken quality gates only to increase content volume. If a fallback is required, document the scoring rule and rejection constraints.
- When adding a new tool, update both the homepage entry and `/tools` list unless the user explicitly wants a hidden route.
- For UI changes, verify mobile and desktop behavior. Text must not overflow buttons/cards, and mobile bottom navigation must not cover important actions.

## Domain Rules

### Professional Articles

- `/articles` covers product management, technology, AI, and finance.
- Category admission should follow each category's relevance scoring and rejection rules.
- Finance additions should prefer Chinese market or Chinese-language US stock sources when requested, but still pass finance relevance checks.
- Default cover images should be category-relevant and visually varied. Use stable seeded selection rather than pure runtime randomness so pages do not flicker between renders.

### Career Content

- `/career` content must remain career-development oriented: workplace communication, efficient work, team collaboration, and leadership.
- Reject broad AI industry rankings, product tutorials, entertainment, generic news, and low-actionability content even if keywords partially match.
- Career content visibility should prefer `status='active'`, valid source URLs, current-year constraints where already encoded, and quality/match scoring rules in `lib/career/quality.ts` and fetcher logic.
- The daily fallback mechanism may promote the best pending candidate only when it still satisfies minimum quality, match, core-match, and URL validity constraints.
- Video expansion should prioritize curated Bilibili method/skill content before broad platform scraping.

### Homepage Curation

- Daily/featured selections should be derived from database scores, not hardcoded titles.
- When several article categories tie with perfect scores, avoid permanently biasing the first slot toward one category. Use a documented tie-breaker or rotation policy.
- Career picks on the homepage may use randomized selection from sufficiently high-scoring content if that is the current product rule.
- Homepage cards should balance visual hierarchy with compactness; avoid adding multiple nested bordered rectangles unless a section-level border is requested.

### Tools

- PRD generation should keep the current simplified form: no timeline field and no output-granularity selector unless reintroduced deliberately.
- PRD output supports Markdown and Word download; PDF was intentionally removed.
- Prototype generation uses server-side image-editing API calls. If provider credit or permissions fail, return a clear configuration/provider error rather than fake generated images.
- Flowchart generation is wrapped by PM Hub but powered by the independently deployed `next-ai-draw-io` app. PM Hub owns the wrapper page and entry points, not the embedded app's model config.

## Validation Standards

- For most source changes, run `npm run build`.
- For targeted lint validation, run `npx eslint <changed-file>`.
- For app-level regression after frontend changes, verify HTTP 200 on relevant local pages and inspect the browser when layout matters.
- For RSS/career changes, validate the relevant fetch script or API path where practical, then inspect accepted/rejected examples.
- For database schema changes, run Drizzle generation/migration checks and confirm the production Postgres path remains valid.
- For AI route changes, test missing-key behavior and successful payload shape without exposing real keys in logs.

## Useful Commands

```powershell
npm run dev
npm run build
npx eslint app/page.tsx
npm run rss:fetch
npm run career:fetch
npm run career:videos:validate
npm run search:rebuild
```

## BMAD Usage Guidance

- Use `bmad-help` first when unsure which workflow to run.
- Use `bmad-quick-dev` for small, well-scoped bug fixes or UI tweaks.
- Use `bmad-prd` for new user-facing tools or meaningful feature changes.
- Use `bmad-create-architecture` before changing ingestion, scoring, search, database, or provider/API boundaries.
- Use `bmad-create-epics-and-stories` after PRD and architecture are stable.
- Use `bmad-code-review` after implementing a story.
- Use built-in QA generation for key flows before release; consider the TEA module later if PM Hub needs formal risk-based traceability.
