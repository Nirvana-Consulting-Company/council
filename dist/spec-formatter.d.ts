export interface SpecData {
    repo: string;
    title: string;
    body: string;
}
/** Format a spec in Builders format (with frontmatter) */
export declare function formatBuildersSpec(data: SpecData): string;
/** Queue a spec as a GitHub gist for the dispatcher */
export declare function queueSpec(data: SpecData): {
    url: string;
    filename: string;
};
/** Extract spec data from the conversation using a simple heuristic.
 *  Returns null if the conversation doesn't have a clear spec yet. */
export declare function extractSpecFromConversation(entries: Array<{
    role: string;
    content: string;
}>, defaultRepo?: string): SpecData | null;
