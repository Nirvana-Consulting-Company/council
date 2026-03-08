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
export declare function invokeAgent(config: AgentConfig, prompt: string, onChunk?: (chunk: string) => void): Promise<string>;
