# PM Hub Agent Instructions

- Before significant product, architecture, content-ingestion, AI-tooling, or deployment changes, read `_bmad-output/project-context.md`.
- Use BMAD artifacts in `_bmad-output/` as the planning and implementation source of truth when they exist.
- Keep changes surgical and aligned with the existing Next.js App Router structure.
- Do not expose or print secrets from `.env*` files.
- Use Node.js 22.x for PM Hub development and validation unless compatibility has been rechecked.
- On Windows, background helper processes must run hidden and must not open visible `cmd.exe` windows.
