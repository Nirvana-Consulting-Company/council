# Council — Agent Instructions

## Tech Stack

- Runtime: Node.js + TypeScript (ES modules)
- Build: tsc → dist/
- CLI: Direct execution via bin entry
- Dependencies: chalk (terminal colors), strip-ansi (text processing)
- No database, no web server — pure CLI tool

## Project Structure

```
src/
  index.ts            # CLI entry point, argument parsing
  orchestrator.ts     # Core agent orchestration logic
  agents/cli-agent.ts # Spawns CLI agents (claude, codex, etc.)
  history.ts          # Conversation/transcript management
  spec-formatter.ts   # Format specs for Builders pipeline
  ui.ts               # Terminal UI (colors, spinners, formatting)
```

## Conventions

- Files: kebab-case
- Functions: camelCase
- Types: PascalCase
- ES module imports (use .js extensions in imports for Node ESM)
- No default exports

## Rules

- Always run `npm run build` before testing changes
- Do not add web/HTTP dependencies — this is a CLI tool
- Agent configs are user-supplied via `.council.json` — do not hardcode agent commands
- Transcripts go to `./transcripts/` directory
- Keep chalk usage consistent with existing color scheme
- When formatting specs, use the `builders` format for Nirvana pipeline compatibility
