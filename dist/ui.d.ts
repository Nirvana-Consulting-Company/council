import { type ChalkInstance } from "chalk";
export declare function getColor(name: string): ChalkInstance;
export declare function printAgent(label: string, color: string, text: string): void;
export declare function printUser(text: string): void;
export declare function printSystem(text: string): void;
export declare function printError(text: string): void;
export declare function printHelp(): void;
export declare function printBanner(): void;
/** Spinning indicator while agent is thinking */
export declare function startSpinner(label: string, color: string): () => void;
