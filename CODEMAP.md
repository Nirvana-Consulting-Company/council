# CODEMAP — Council
Docs-Version: v1
Last-Updated: 2026-03-08
Owner: Nick Merican

> Agent-first map of where to read, edit, and run.

## Quick Start Commands

```bash
# install
npm install

# run locally
npm run dev

# build
npm run build

# run compiled
npm start
```

## Directory Map

```
src/
  index.ts            # CLI entry — parses args, invokes orchestrator
  orchestrator.ts     # Core loop — sends prompt to each agent, collects responses
  agents/
    cli-agent.ts      # Spawn a CLI agent process (claude, codex, etc.)
  history.ts          # Manage conversation transcripts
  spec-formatter.ts   # Format output as Builders-compatible spec
  ui.ts               # Terminal formatting — chalk colors, spinners
```

## Key Files

| File | Purpose | Edit Safety |
|------|---------|-------------|
| `src/orchestrator.ts` | Heart of Council — iterates agents, collects perspectives | CAREFUL |
| `src/agents/cli-agent.ts` | Spawns external CLI processes (claude, codex) | CAREFUL |
| `src/spec-formatter.ts` | Converts output to Builders spec format | SAFE |
| `src/index.ts` | CLI entry point, argument parsing | SAFE |
| `.council.example.json` | Config template — agent commands, modes, repos | SAFE |

## Module Relations

```
index.ts (entry)
|- orchestrator.ts -> runs agent loop
|  |- cli-agent.ts -> spawns external CLI process
|  `- history.ts -> saves transcript
|- spec-formatter.ts -> formats spec output
`- ui.ts -> terminal formatting
```

## Data and External Dependencies

- Database: None (pure CLI tool)
- Auth: None
- External APIs: None directly — delegates to agent CLIs (claude, codex)
- Queues/Workers/Cron: No

## Critical Rules

1. No web/HTTP dependencies — this is a CLI tool, keep it lightweight
2. Agent configs are user-supplied via .council.json — never hardcode agent commands
3. Use ES module imports with .js extensions — required for Node ESM compatibility
4. Transcripts save to ./transcripts/ — ensure directory exists before write

## Common Tasks

| Task | Command | Success Signal |
|------|---------|----------------|
| Plan a feature | `council plan "description"` | Agents respond with plan |
| Review code | `council review path/to/diff` | Agents provide review |
| Discuss topic | `council discuss "topic"` | Multi-agent conversation |
| Build | `npm run build` | dist/ populated, no errors |

## Known Footguns

1. Missing .council.json → cryptic error → Recovery: copy .council.example.json to .council.json
2. Agent CLI not installed (e.g. claude not in PATH) → spawn fails silently → Recovery: install the agent CLI globally
3. Transcripts dir missing → write crash → Recovery: mkdir transcripts/