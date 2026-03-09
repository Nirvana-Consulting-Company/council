# Council

Multi-agent CLI planning & review — convene your Council.

## What is Council?

Council orchestrates multiple AI agents (Claude, Codex, etc.) to collaboratively plan features and review code. Each agent provides independent analysis, then Council synthesizes perspectives.

## Quick Start

```bash
npm install
npm run build
council plan "Add user authentication to the API"
council review path/to/diff.patch
```

## Configuration

Copy `.council.example.json` to `.council.json` and configure your agents:

```json
{
  "agents": {
    "claude": {
      "command": "claude",
      "args": ["-p", "--model", "claude-opus-4-6", "--output-format", "text"],
      "label": "Claude",
      "color": "cyan"
    }
  },
  "defaultMode": "discuss",
  "specFormat": "builders"
}
```

## Modes

- **discuss** — Agents discuss a topic collaboratively
- **plan** — Agents plan a feature implementation
- **review** — Agents review code changes

## Development

```bash
npm run dev   # Run with tsx (hot reload)
npm run build # Compile TypeScript
npm start     # Run compiled output
```

## Docs

- [CODEMAP.md](CODEMAP.md) — Directory structure and module relations
- [CLAUDE.md](CLAUDE.md) — Agent operating instructions