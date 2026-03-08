import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
export class ConversationHistory {
    entries = [];
    transcriptDir;
    constructor(transcriptDir) {
        this.transcriptDir = transcriptDir;
    }
    add(role, content) {
        this.entries.push({ role, content, timestamp: new Date() });
    }
    /** Build context string for an agent, showing the full conversation so far */
    buildContext(agentLabel, mode, repoContext) {
        const lines = [];
        lines.push(`You are "${agentLabel}" in a multi-agent planning session with a human and other AI agents.`);
        lines.push(`Current mode: ${mode}`);
        if (repoContext) {
            lines.push(`Target repository: ${repoContext}`);
        }
        lines.push("");
        lines.push("=== CONVERSATION SO FAR ===");
        for (const entry of this.entries) {
            const tag = entry.role === "user"
                ? "[User]"
                : entry.role === "system"
                    ? "[System]"
                    : `[${entry.role}]`;
            lines.push(`${tag}: ${entry.content}`);
        }
        lines.push("");
        lines.push("=== YOUR TURN ===");
        lines.push("Respond concisely. Build on what was said. Disagree if you see issues.");
        return lines.join("\n");
    }
    /** Build context specifically for draft-review mode */
    buildDraftContext(agentLabel, instruction, repoContext) {
        const lines = [];
        lines.push(`You are "${agentLabel}" in a collaborative draft-review session.`);
        if (repoContext) {
            lines.push(`Target repository: ${repoContext}`);
        }
        lines.push("");
        lines.push("=== CONVERSATION SO FAR ===");
        for (const entry of this.entries) {
            const tag = entry.role === "user"
                ? "[User]"
                : entry.role === "system"
                    ? "[System]"
                    : `[${entry.role}]`;
            lines.push(`${tag}: ${entry.content}`);
        }
        lines.push("");
        lines.push(`=== INSTRUCTION ===`);
        lines.push(instruction);
        return lines.join("\n");
    }
    /** Build context for autonomous volley mode — agents debate each other */
    buildVolleyContext(agentLabel, round, maxRounds, repoContext) {
        const lines = [];
        lines.push(`You are "${agentLabel}" in an autonomous multi-agent debate/planning session.`);
        lines.push(`You are discussing directly with the other agent(s). The human is observing.`);
        lines.push(`Round ${round} of ${maxRounds}.`);
        if (repoContext) {
            lines.push(`Target repository: ${repoContext}`);
        }
        lines.push("");
        lines.push("=== CONVERSATION SO FAR ===");
        for (const entry of this.entries) {
            const tag = entry.role === "user"
                ? "[User]"
                : entry.role === "system"
                    ? "[System]"
                    : `[${entry.role}]`;
            lines.push(`${tag}: ${entry.content}`);
        }
        lines.push("");
        lines.push("=== YOUR TURN ===");
        lines.push("Respond to the other agent directly. Challenge, refine, or build on their points.");
        lines.push("Be specific and constructive. If you fully agree on the approach, say 'agreed' clearly.");
        lines.push("Keep responses focused — no need to repeat what's already been established.");
        return lines.join("\n");
    }
    /** Export full transcript as markdown */
    toMarkdown() {
        const lines = [];
        const now = new Date();
        lines.push(`# Council Transcript`);
        lines.push(`> ${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`);
        lines.push("");
        for (const entry of this.entries) {
            const time = entry.timestamp.toTimeString().slice(0, 8);
            if (entry.role === "user") {
                lines.push(`### User (${time})`);
            }
            else if (entry.role === "system") {
                lines.push(`### System (${time})`);
            }
            else {
                lines.push(`### ${entry.role} (${time})`);
            }
            lines.push("");
            lines.push(entry.content);
            lines.push("");
            lines.push("---");
            lines.push("");
        }
        return lines.join("\n");
    }
    /** Save transcript to disk */
    async save(filename) {
        await mkdir(this.transcriptDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const name = filename || `council-${ts}.md`;
        const path = join(this.transcriptDir, name);
        await writeFile(path, this.toMarkdown(), "utf-8");
        return path;
    }
}
//# sourceMappingURL=history.js.map