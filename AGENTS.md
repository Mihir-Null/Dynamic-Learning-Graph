# Repository Guidelines

## Project Structure & Module Organization
- `Graph.gs` holds the Google Apps Script source defining `Module` and `Resource` classes, spreadsheet ingestion, and the `myFunction` entry point.
- `local.html` is a standalone Cytoscape demo for experimenting with graph layouts before wiring them to live data.
- `README.md` captures background context and future feature ideas; update this when adding new modules, resources, or UI layers.

## Build, Test, and Development Commands
- Apps Script: develop in the online editor or run `myFunction` via the script console to rebuild the in-memory `moduleMap`.
- Local prototyping: run `python3 -m http.server --directory .` and open `http://localhost:8000/local.html` to preview graph styling without Apps Script deployment.

## Coding Style & Naming Conventions
- Use modern JavaScript (ES2015+) with 2-space indentation, `const`/`let`, and arrow functions for reducers.
- Name classes in PascalCase (`Module`, `Resource`) and functions or helpers in camelCase (`generateGraphResourceList`).
- Store collections in `Set` or `Map` when uniqueness or keyed access matters; prefer immutable updates when extending reducer patterns.

## Testing Guidelines
- Validate spreadsheet parsing by running `generateGraphResourceList` after updating the `Resources` sheet; inspect logs for missing module warnings.
- When adding transformations, include lightweight assertions inside temporary `Logger.log` blocks or guard clauses, then strip before committing.
- For UI work in `local.html`, test new layouts with small mock datasets before importing live data.

## Commit & Pull Request Guidelines
- Write imperative, scope-focused commit messages (e.g., `Add prereq conversion for resources`) and group related Apps Script and HTML changes together.
- Reference related issues in the commit body or PR description, and attach screenshots or GIFs when UI output changes.
- PRs should outline data assumptions (sheet column names, expected tags) and list manual tests performed so reviewers can reproduce them quickly.

## Security & Configuration Tips
- Never hard-code Spreadsheet IDs or API keys in `Graph.gs`; store them in Apps Script Properties or environment variables when wiring clasp automation.
- Review sharing settings for the backing Google Sheet before deployment to ensure resources remain read-only for learners.
