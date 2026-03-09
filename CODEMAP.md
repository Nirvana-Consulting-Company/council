# CODEMAP — Council

> Agent-friendly directory map.

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

| File | Purpose |
|------|---------|
| `src/orchestrator.ts` | Heart of Council — iterates agents, collects perspectives |
| `src/agents/cli-agent.ts` | Spawns external CLI processes (claude -p, codex exec) |
| `src/spec-formatter.ts` | Converts Council output to Builders spec format |
| `.council.example.json` | Config template — agent commands, modes, repo mappings |

## Module Relations

```
index.ts (entry)
├── orchestrator.ts    → runs agent loop
│   ├── cli-agent.ts   → spawns external CLI process
│   └── history.ts     → saves transcript
├── spec-formatter.ts  → formats spec output
└── ui.ts              → terminal formatting
```

## Config Schema (.council.json)

- `agents` — Map of agent name → {command, args, label, color}
- `defaultMode` — discuss | plan | review
- `specFormat` — Output format (builders = Nirvana pipeline compatible)
- `repos` — Map of repo key → GitHub org/repo
- `transcriptDir` — Where to save conversation transcripts
