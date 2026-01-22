# Sumit Design Portfolio
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://<your-vercel-url>)
[![License: MIT](https://img.shields.io/badge/License-MIT-0a0a0a?style=flat)](./LICENSE)

Personal portfolio site with case studies.
Built with static HTML + Tailwind CSS.

## Highlights
- Portfolio pages and case studies under `work/`
- Light/dark theme toggle with saved preference

## What's inside
- Portfolio pages: `index.html`, `about.html`, `work.html`, and case studies under `work/`
- Tailwind CSS source + output: `src/input.css` and `src/output.css`
- Front-end JS: `src/theme.js` (theme toggle)
- Serverless API (Vercel-style): `api/`

## File structure
```
.
├── assets/              # images, icons, media
├── components/          # shared HTML snippets
├── src/                 # JS + Tailwind input/output
├── work/                # case studies and subpages
├── index.html
├── about.html
└── work.html
```

## Tech stack
- HTML + vanilla JS
- Tailwind CSS (via `@tailwindcss/cli`)

## Local setup
### 1) Install dependencies
```bash
npm install
```

### 2) Build Tailwind CSS
One-time build:
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css
```

Watch mode:
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
```

### 3) Serve the site locally
```bash
python3 -m http.server
```
Then open `http://localhost:8000`.

## Theme toggle
- Uses `src/theme.js`.
- Persists preference in `localStorage` under the key `theme`.

## Testing
- No automated tests are configured (`npm test` is not defined).


### Case studies
- Each case study is a static HTML page under `work/`.
- Images and assets live under `assets/<project>/`.

#### Case study page structure
Each page under `work/` follows the same narrative structure so the site stays consistent and scannable.

Recommended section order (headings may vary slightly per project):
1. **Hero**: project title, timeframe, role, platform (web/mobile), program/org context
2. **Skimmable summary**: 3–5 bullets covering the problem, what I did, and outcomes (no inflated metrics)
3. **Problem**: what broke at scale and why it mattered operationally
4. **Research summary**: key roles, context, constraints (deadlines/policy, low-end devices, low connectivity)
5. **Users & roles (RBAC)**: roles involved, what each role can view/do, and how that shows up in UI
6. **Workflow & states**: end-to-end flow, state machine, handoffs, approvals, audit trail
7. **Key UX decisions**: the decisions, why they were necessary, and the constraint each solved
8. **Key UIs**: annotated screenshots or callouts tied to the decisions above
9. **Accessibility & operational constraints**: low literacy, low connectivity, high-volume entry, error prevention
10. **Impact (qualitative)**: what improved (speed, rework reduction, fewer errors), stated conservatively
11. **Implementation notes**: design system patterns, reusable components, and handoff/QA considerations

Naming conventions (recommended):
- Case study file: `work/<project>.html` (example: `work/cho-soft.html`)
- Hero image: `assets/<project>/module-hero.*`
- Thumbnail: `assets/<project>/module-thumbnail.*`
- Key screens: `assets/<project>/screen-display-1.*`, `screen-display-2.*`, ...

Image accessibility:
- Every image should include meaningful `alt` text.
- If the page includes an image caption/description, keep it short and tie it to the UI decision it supports.

# Sumit Design Portfolio

A personal portfolio site for showcasing case studies and product work.
Built as a lightweight static site using HTML + Tailwind CSS, with a small amount of vanilla JS for UI behavior.

## Live site
- Deployed via Vercel (see the repo “Website” link on GitHub).

## What this repo contains
This repository is intentionally simple so it stays fast to load, easy to maintain, and easy to iterate on.

### Primary pages
- `index.html`  
  Landing page and highlights.
- `work.html`  
  Case study listing and navigation into project pages.
- `about.html`  
  Background, focus areas, and contact.

### Case studies
- All case studies live under `work/`.
- Each case study is a standalone HTML page so it can be edited and shipped quickly without a build framework.

### Shared assets
- `assets/` contains images, icons, and media.
- `components/` contains reusable HTML snippets/partials (where applicable).

### Styling
- Tailwind source: `src/input.css`
- Generated CSS output: `src/output.css`

### Behavior
- Theme toggle: `src/theme.js`

### Serverless API (optional)
- `api/` exists for Vercel-style serverless functions.
- If you are not using any API routes for the portfolio, it can remain unused without affecting the site.

## Highlights
- Case study pages under `work/` with consistent layout and navigation
- Light/dark theme toggle with saved preference
- Static-site architecture optimized for fast loads and simple hosting

## File structure
```
.
├── assets/              # images, icons, media
├── components/          # shared HTML snippets
├── src/                 # JS + Tailwind input/output
├── work/                # case studies and subpages
├── index.html
├── about.html
└── work.html
```

## Tech stack
- HTML + vanilla JS
- Tailwind CSS (via `@tailwindcss/cli`)
- Static hosting (Vercel)

## Local setup
### 1) Install dependencies
```bash
npm install
```

### 2) Build Tailwind CSS
One-time build:
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css
```

Watch mode (recommended while editing):
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
```

### 3) Serve the site locally
```bash
python3 -m http.server
```
Then open `http://localhost:8000`.

## Editing workflow
- Update page content directly in the relevant HTML file (`index.html`, `about.html`, `work.html`, or a page under `work/`).
- For layout consistency, prefer using existing patterns/components rather than inventing new one-off styles per page.
- When you change Tailwind classes or add new utilities, rebuild `src/output.css` (or keep watch mode running).

## Theme toggle
- Implemented in `src/theme.js`.
- Persists preference in `localStorage` under the key `theme`.
- Default behavior respects the user’s system theme if no preference has been saved.

## Deployment
This repo is deployed as a static site.

### Vercel
- Connect the repository in Vercel.
- Set the build step to generate Tailwind output if your deployment does not commit `src/output.css`.
- The deployed URL is shown in the GitHub repo “Website” field.

## Testing
- No automated tests are configured (`npm test` is not defined).

## Project notes
- `src/output.css` is generated. Rebuild it after changes to `src/input.css`.
- Keep the repository clean: do not commit `node_modules/` or OS files (for example `.DS_Store`).

## License
- No license is defined yet. Add a `LICENSE` file if you want explicit reuse permissions.
