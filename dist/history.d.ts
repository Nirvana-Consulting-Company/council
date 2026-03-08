export interface HistoryEntry {
    role: string;
    content: string;
    timestamp: Date;
}
export declare class ConversationHistory {
    entries: HistoryEntry[];
    private transcriptDir;
    constructor(transcriptDir: string);
    add(role: string, content: string): void;
    /** Build context string for an agent, showing the full conversation so far */
    buildContext(agentLabel: string, mode: string, repoContext?: string): string;
    /** Build context specifically for draft-review mode */
    buildDraftContext(agentLabel: string, instruction: string, repoContext?: string): string;
    /** Build context for autonomous volley mode — agents debate each other */
    buildVolleyContext(agentLabel: string, round: number, maxRounds: number, repoContext?: string): string;
    /** Export full transcript as markdown */
    toMarkdown(): string;
    /** Save transcript to disk */
    save(filename?: string): Promise<string>;
}
