import { spawn } from "node:child_process";
import stripAnsi from "strip-ansi";

export interface AgentConfig {
  command: string;
  args: string[];
  label: string;
  color: string;
}

export interface AgentMessage {
  agent: string;
  content: string;
  timestamp: Date;
}

export async function invokeAgent(
  config: AgentConfig,
  prompt: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const isClaudeCli =
      config.command === "claude" || config.command.endsWith("/claude");
    const isCodexExec =
      (config.command === "codex" || config.command.endsWith("/codex")) &&
      config.args.includes("exec");

    let args: string[];
    let useStdin = false;

    if (isClaudeCli) {
      // claude -p "prompt" --model ... --output-format text
      args = [...config.args, prompt];
    } else if (isCodexExec) {
      // codex exec reads prompt from stdin when given "-"
      // This avoids shell escaping issues with large prompts
      args = [...config.args, "-"];
      useStdin = true;
    } else {
      // Generic: pass prompt as last arg
      args = [...config.args, prompt];
    }

    const child = spawn(config.command, args, {
      stdio: [useStdin ? "pipe" : "ignore", "pipe", "pipe"],
      shell: true,
      env: { ...process.env },
    });

    // If using stdin, write the prompt and close
    if (useStdin && child.stdin) {
      child.stdin.write(prompt);
      child.stdin.end();
    }

    let stdout = "";
    let stderr = "";

    child.stdout!.on("data", (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      if (onChunk) {
        onChunk(text);
      }
    });

    child.stderr!.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        reject(
          new Error(
            `${config.label} exited with code ${code}: ${stderr.trim()}`,
          ),
        );
      } else {
        // Strip ANSI escape codes for clean storage
        resolve(stripAnsi(stdout.trim()));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn ${config.label}: ${err.message}`));
    });
  });
}
