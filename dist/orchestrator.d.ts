import { type AgentConfig } from "./agents/cli-agent.js";
import { ConversationHistory } from "./history.js";
export type Mode = "discuss" | "draft-review";
export interface CouncilConfig {
    agents: Record<string, AgentConfig>;
    defaultMode: Mode;
    specFormat: string;
    repos: Record<string, string>;
    transcriptDir: string;
}
export declare class Orchestrator {
    config: CouncilConfig;
    history: ConversationHistory;
    mode: Mode;
    activeRepo: string | undefined;
    private agentOrder;
    constructor(config: CouncilConfig);
    setMode(mode: Mode): void;
    setRepo(repoKey: string): void;
    /** Process a user message through the current mode */
    handleUserMessage(message: string): Promise<void>;
    /** Round-robin: each agent responds in order */
    private runDiscuss;
    /** Draft-review loop:
     *  1. First agent (Claude) drafts
     *  2. Second agent (Codex) reviews
     *  3. First agent revises based on review
     *  4. Loop until reviewer says LGTM or user intervenes
     */
    private runDraftReview;
    /** Autonomous volley: agents debate/discuss on their own for N rounds.
     *  Stops early if any agent says "agreed", "consensus", or "LGTM".
     *  User can seed the topic, then sit back and watch. */
    runVolley(topic: string, maxRounds?: number): Promise<void>;
    /** Generate a Builders-format spec from the conversation */
    generateSpec(repo?: string, title?: string): Promise<string>;
    /** Generate spec and queue it as a gist */
    queueSpecAsGist(repo?: string, title?: string): Promise<{
        url: string;
        filename: string;
    }>;
    /** Save the transcript */
    saveTranscript(filename?: string): Promise<string>;
    /** Clear conversation history */
    clear(): void;
    /** List configured agents */
    listAgents(): void;
}
