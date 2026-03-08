import { invokeAgent } from "./agents/cli-agent.js";
import { ConversationHistory } from "./history.js";
import { formatBuildersSpec, queueSpec, } from "./spec-formatter.js";
import { printAgent, printSystem, printError, startSpinner } from "./ui.js";
export class Orchestrator {
    config;
    history;
    mode;
    activeRepo;
    agentOrder;
    constructor(config) {
        this.config = config;
        this.history = new ConversationHistory(config.transcriptDir);
        this.mode = config.defaultMode || "discuss";
        this.agentOrder = Object.keys(config.agents);
    }
    setMode(mode) {
        this.mode = mode;
        this.history.add("system", `Mode changed to: ${mode}`);
        printSystem(`Mode: ${mode}`);
    }
    setRepo(repoKey) {
        const fullRepo = this.config.repos[repoKey] || repoKey;
        this.activeRepo = fullRepo;
        this.history.add("system", `Target repo set to: ${fullRepo}`);
        printSystem(`Repo: ${fullRepo}`);
    }
    /** Process a user message through the current mode */
    async handleUserMessage(message) {
        this.history.add("user", message);
        switch (this.mode) {
            case "discuss":
                await this.runDiscuss();
                break;
            case "draft-review":
                await this.runDraftReview();
                break;
        }
    }
    /** Round-robin: each agent responds in order */
    async runDiscuss() {
        for (const agentKey of this.agentOrder) {
            const agent = this.config.agents[agentKey];
            const context = this.history.buildContext(agent.label, this.mode, this.activeRepo);
            const stop = startSpinner(agent.label, agent.color);
            try {
                const response = await invokeAgent(agent, context);
                stop();
                this.history.add(agent.label, response);
                printAgent(agent.label, agent.color, response);
            }
            catch (err) {
                stop();
                printError(`${agent.label} failed: ${err.message}`);
                this.history.add("system", `${agent.label} failed: ${err.message}`);
            }
        }
    }
    /** Draft-review loop:
     *  1. First agent (Claude) drafts
     *  2. Second agent (Codex) reviews
     *  3. First agent revises based on review
     *  4. Loop until reviewer says LGTM or user intervenes
     */
    async runDraftReview() {
        const drafter = this.agentOrder[0];
        const reviewer = this.agentOrder[1];
        if (!drafter || !reviewer) {
            printError("Draft-review requires at least 2 agents configured.");
            return;
        }
        const drafterConfig = this.config.agents[drafter];
        const reviewerConfig = this.config.agents[reviewer];
        const MAX_ROUNDS = 5;
        for (let round = 1; round <= MAX_ROUNDS; round++) {
            // --- Drafter's turn ---
            const draftInstruction = round === 1
                ? "Based on the conversation, draft a detailed implementation plan or code. Be thorough and specific."
                : "Address the reviewer's feedback. Revise your previous draft accordingly. Show what changed.";
            const draftContext = this.history.buildDraftContext(drafterConfig.label, draftInstruction, this.activeRepo);
            let stop = startSpinner(`${drafterConfig.label} (draft round ${round})`, drafterConfig.color);
            try {
                const draft = await invokeAgent(drafterConfig, draftContext);
                stop();
                this.history.add(drafterConfig.label, draft);
                printAgent(`${drafterConfig.label} [Draft R${round}]`, drafterConfig.color, draft);
            }
            catch (err) {
                stop();
                printError(`${drafterConfig.label} draft failed: ${err.message}`);
                return;
            }
            // --- Reviewer's turn ---
            const reviewInstruction = [
                "Review the latest draft critically. Check for:",
                "- Correctness and completeness",
                "- Edge cases and error handling",
                "- Security concerns",
                "- Performance implications",
                "- Adherence to the original requirements",
                "",
                "If the draft is solid, respond with LGTM at the start of your message.",
                "Otherwise, list specific issues and suggestions for improvement.",
            ].join("\n");
            const reviewContext = this.history.buildDraftContext(reviewerConfig.label, reviewInstruction, this.activeRepo);
            stop = startSpinner(`${reviewerConfig.label} (review round ${round})`, reviewerConfig.color);
            try {
                const review = await invokeAgent(reviewerConfig, reviewContext);
                stop();
                this.history.add(reviewerConfig.label, review);
                printAgent(`${reviewerConfig.label} [Review R${round}]`, reviewerConfig.color, review);
                // Check if reviewer approved
                if (review.trim().toUpperCase().startsWith("LGTM")) {
                    printSystem(`${reviewerConfig.label} approved the draft after ${round} round(s).`);
                    return;
                }
            }
            catch (err) {
                stop();
                printError(`${reviewerConfig.label} review failed: ${err.message}`);
                return;
            }
            if (round === MAX_ROUNDS) {
                printSystem(`Reached max ${MAX_ROUNDS} rounds. Use /discuss to continue manually, or /spec to extract what you have.`);
            }
        }
    }
    /** Autonomous volley: agents debate/discuss on their own for N rounds.
     *  Stops early if any agent says "agreed", "consensus", or "LGTM".
     *  User can seed the topic, then sit back and watch. */
    async runVolley(topic, maxRounds = 6) {
        this.history.add("user", topic);
        const CONSENSUS_SIGNALS = ["agreed", "consensus", "lgtm", "we're aligned", "i agree"];
        for (let round = 1; round <= maxRounds; round++) {
            for (const agentKey of this.agentOrder) {
                const agent = this.config.agents[agentKey];
                const context = this.history.buildVolleyContext(agent.label, round, maxRounds, this.activeRepo);
                const stop = startSpinner(`${agent.label} (round ${round}/${maxRounds})`, agent.color);
                try {
                    const response = await invokeAgent(agent, context);
                    stop();
                    this.history.add(agent.label, response);
                    printAgent(`${agent.label} [R${round}]`, agent.color, response);
                    // Check for consensus
                    const lower = response.toLowerCase().slice(0, 200);
                    if (CONSENSUS_SIGNALS.some((s) => lower.includes(s))) {
                        printSystem(`${agent.label} signaled agreement in round ${round}. Volley complete.`);
                        // Let the other agent confirm if it hasn't spoken this round
                        const remaining = this.agentOrder.slice(this.agentOrder.indexOf(agentKey) + 1);
                        for (const rKey of remaining) {
                            const rAgent = this.config.agents[rKey];
                            const rCtx = this.history.buildVolleyContext(rAgent.label, round, maxRounds, this.activeRepo);
                            const rStop = startSpinner(rAgent.label, rAgent.color);
                            try {
                                const rResp = await invokeAgent(rAgent, rCtx);
                                rStop();
                                this.history.add(rAgent.label, rResp);
                                printAgent(`${rAgent.label} [R${round}]`, rAgent.color, rResp);
                            }
                            catch {
                                rStop();
                            }
                        }
                        return;
                    }
                }
                catch (err) {
                    stop();
                    printError(`${agent.label} failed: ${err.message}`);
                    this.history.add("system", `${agent.label} failed: ${err.message}`);
                }
            }
        }
        printSystem(`Volley finished after ${maxRounds} rounds. Use /spec to extract results, or keep going with /volley.`);
    }
    /** Generate a Builders-format spec from the conversation */
    async generateSpec(repo, title) {
        const targetRepo = repo || this.activeRepo || "unknown";
        // Use the first agent to synthesize the conversation into a spec
        const firstAgent = this.config.agents[this.agentOrder[0]];
        const synthesisPrompt = [
            "Synthesize the following multi-agent conversation into a clean implementation spec.",
            "Output ONLY the spec body in markdown (no frontmatter, I'll add that).",
            "Include: Overview, Requirements, Acceptance Criteria, Technical Notes.",
            "",
            "=== CONVERSATION ===",
            ...this.history.entries.map((e) => `[${e.role}]: ${e.content}`),
        ].join("\n");
        if (title) {
            printSystem(`Generating spec: ${title}`);
        }
        const stop = startSpinner(firstAgent.label, firstAgent.color);
        try {
            const body = await invokeAgent(firstAgent, synthesisPrompt);
            stop();
            const specTitle = title ||
                this.history.entries
                    .find((e) => e.role === "user")
                    ?.content.slice(0, 60) ||
                "untitled";
            return formatBuildersSpec({
                repo: targetRepo,
                title: specTitle,
                body,
            });
        }
        catch (err) {
            stop();
            throw err;
        }
    }
    /** Generate spec and queue it as a gist */
    async queueSpecAsGist(repo, title) {
        const targetRepo = repo || this.activeRepo || "unknown";
        const specTitle = title ||
            this.history.entries
                .find((e) => e.role === "user")
                ?.content.slice(0, 60) ||
            "untitled";
        // Generate the spec body first
        const firstAgent = this.config.agents[this.agentOrder[0]];
        const synthesisPrompt = [
            "Synthesize the following multi-agent conversation into a clean implementation spec.",
            "Output ONLY the spec body in markdown (no frontmatter, I'll add that).",
            "Include: Overview, Requirements, Acceptance Criteria, Technical Notes.",
            "",
            "=== CONVERSATION ===",
            ...this.history.entries.map((e) => `[${e.role}]: ${e.content}`),
        ].join("\n");
        const stop = startSpinner(firstAgent.label, firstAgent.color);
        const body = await invokeAgent(firstAgent, synthesisPrompt);
        stop();
        return queueSpec({ repo: targetRepo, title: specTitle, body });
    }
    /** Save the transcript */
    async saveTranscript(filename) {
        return this.history.save(filename);
    }
    /** Clear conversation history */
    clear() {
        this.history = new ConversationHistory(this.config.transcriptDir);
        printSystem("Conversation cleared.");
    }
    /** List configured agents */
    listAgents() {
        for (const [key, agent] of Object.entries(this.config.agents)) {
            printSystem(`${key}: ${agent.label} (${agent.command} ${agent.args.join(" ")})`);
        }
    }
}
//# sourceMappingURL=orchestrator.js.map