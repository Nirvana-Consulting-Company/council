#!/usr/bin/env node

import { createInterface } from "node:readline";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import chalk from "chalk";
import {
  printBanner,
  printHelp,
  printSystem,
  printError,
  printUser,
} from "./ui.js";
import { Orchestrator, type CouncilConfig, type Mode } from "./orchestrator.js";

const CONFIG_FILENAME = ".council.json";

async function loadConfig(): Promise<CouncilConfig> {
  // Search: current dir, then home dir
  const candidates = [
    resolve(process.cwd(), CONFIG_FILENAME),
    resolve(process.env.HOME || process.env.USERPROFILE || ".", CONFIG_FILENAME),
  ];

  for (const path of candidates) {
    try {
      const raw = await readFile(path, "utf-8");
      const config = JSON.parse(raw) as CouncilConfig;
      printSystem(`Config loaded from ${path}`);
      return config;
    } catch {
      // try next
    }
  }

  // Fallback default config
  printSystem("No .council.json found, using defaults (claude + codex)");
  return {
    agents: {
      claude: {
        command: "claude",
        args: ["-p", "--model", "claude-opus-4-6", "--output-format", "text"],
        label: "Claude",
        color: "cyan",
      },
      codex: {
        command: "codex",
        args: ["--full-auto", "--model", "gpt-5.3-codex", "--reasoning", "high", "-q"],
        label: "Codex",
        color: "green",
      },
    },
    defaultMode: "discuss",
    specFormat: "builders",
    repos: {},
    transcriptDir: "./transcripts",
  };
}

async function main(): Promise<void> {
  printBanner();

  const config = await loadConfig();
  const orchestrator = new Orchestrator(config);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.white.bold("  You > "),
  });

  rl.prompt();

  rl.on("line", async (line: string) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    // --- Command handling ---
    if (input.startsWith("/")) {
      const [cmd, ...args] = input.split(/\s+/);
      const arg = args.join(" ");

      switch (cmd) {
        case "/help":
          printHelp();
          break;

        case "/quit":
        case "/exit":
          printSystem("Saving transcript...");
          try {
            const path = await orchestrator.saveTranscript();
            printSystem(`Transcript saved: ${path}`);
          } catch {
            // ok if save fails
          }
          printSystem("Goodbye.");
          process.exit(0);

        case "/discuss":
          orchestrator.setMode("discuss");
          break;

        case "/draft-review":
        case "/dr":
          orchestrator.setMode("draft-review");
          break;

        case "/volley":
        case "/v": {
          if (!arg) {
            printError("Usage: /volley <topic> [rounds]");
            printSystem("Example: /volley 'Should we use REST or GraphQL for this API?' 4");
          } else {
            // Check if last token is a number (round count)
            const tokens = arg.split(/\s+/);
            const lastToken = tokens[tokens.length - 1];
            let rounds = 6;
            let topic = arg;
            if (/^\d+$/.test(lastToken) && tokens.length > 1) {
              rounds = parseInt(lastToken, 10);
              topic = tokens.slice(0, -1).join(" ");
            }
            printSystem(`Starting volley (${rounds} rounds max)...`);
            try {
              await orchestrator.runVolley(topic, rounds);
            } catch (err: any) {
              printError(`Volley error: ${err.message}`);
            }
          }
          break;
        }

        case "/repo":
          if (!arg) {
            printError("Usage: /repo <key-or-owner/name>");
            printSystem(
              "Available: " +
                Object.keys(orchestrator.config.repos).join(", "),
            );
          } else {
            orchestrator.setRepo(arg);
          }
          break;

        case "/agents":
          orchestrator.listAgents();
          break;

        case "/spec": {
          try {
            const parts = arg.split(/\s+/);
            const repo = parts[0] || undefined;
            const title = parts.slice(1).join(" ") || undefined;
            const spec = await orchestrator.generateSpec(repo, title);
            console.log();
            console.log(chalk.yellow("─".repeat(50)));
            console.log(spec);
            console.log(chalk.yellow("─".repeat(50)));
            printSystem("Use /queue to create a gist and queue it.");
          } catch (err: any) {
            printError(`Spec generation failed: ${err.message}`);
          }
          break;
        }

        case "/queue": {
          try {
            const parts = arg.split(/\s+/);
            const repo = parts[0] || undefined;
            const title = parts.slice(1).join(" ") || undefined;
            const result = await orchestrator.queueSpecAsGist(repo, title);
            printSystem(
              `Queued! Gist: ${result.url} (${result.filename})`,
            );
            printSystem("The dispatcher will pick it up within 30 seconds.");
          } catch (err: any) {
            printError(`Queue failed: ${err.message}`);
          }
          break;
        }

        case "/save":
        case "/export": {
          try {
            const path = await orchestrator.saveTranscript(
              arg || undefined,
            );
            printSystem(`Transcript saved: ${path}`);
          } catch (err: any) {
            printError(`Save failed: ${err.message}`);
          }
          break;
        }

        case "/clear":
          orchestrator.clear();
          break;

        default:
          printError(`Unknown command: ${cmd}. Type /help for commands.`);
      }

      rl.prompt();
      return;
    }

    // --- Regular message: send to agents ---
    printUser(input);

    try {
      await orchestrator.handleUserMessage(input);
    } catch (err: any) {
      printError(`Error: ${err.message}`);
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log();
    printSystem("Session ended.");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
