# Council — Agent Instructions
Docs-Version: v1
Last-Updated: 2026-03-08
Owner: Nick Merican

## Mission

Multi-agent CLI tool that orchestrates AI agents (Claude, Codex, etc.) to collaboratively plan features and review code. Each agent provides independent analysis, then Council synthesizes perspectives.

## Tech Stack

1. Runtime: Node.js (ES modules)
2. Framework: None (pure CLI)
3. Language: TypeScript 5.7 (strict)
4. Data Layer: None (file-based transcripts)
5. Tests: None yet
6. Deploy: npm bin (global install)

## Coding Conventions

1. Naming: `kebab-case` files, `PascalCase` types, `camelCase` functions
2. Imports: ES module with .js extensions (required for Node ESM)
3. Architecture: New agent types go in src/agents/, new formatters in src/
4. UI Rules: Use chalk consistently with existing color scheme
5. State/Data Rules: Transcripts are append-only files in ./transcripts/

## Quality Gates

Run before PR:

```bash
npm run build
```

Blocking conditions:
- Type errors
- Build failures

## Security Rules

1. Never commit secrets or .council.json with real API keys.
2. Agent CLI credentials are managed by the user's environment, not by Council.
3. Transcripts may contain sensitive content — .gitignore the transcripts/ directory.

## Agent Workflow

1. Read CODEMAP.md first.
2. This is a small codebase (6 files) — read all of src/ before making changes.
3. Make minimal scoped change.
4. Run `npm run build` to verify.
5. Include risk note in PR summary.

## PR Rules

1. Keep PR scope single-purpose.
2. Test with at least one agent CLI before merging.
3. If adding new agent types, update .council.example.json.

## Do Not Touch

1. .council.json (user config) — only edit .council.example.json
2. transcripts/ directory — user data, never committed