import chalk from "chalk";
const COLOR_MAP = {
    cyan: chalk.cyan,
    green: chalk.green,
    yellow: chalk.yellow,
    magenta: chalk.magenta,
    red: chalk.red,
    blue: chalk.blue,
    white: chalk.white,
};
export function getColor(name) {
    return COLOR_MAP[name] || chalk.white;
}
export function printAgent(label, color, text) {
    const c = getColor(color);
    const header = c.bold(`┌─ ${label} ─────────────────────────────`);
    const footer = c(`└${"─".repeat(40)}`);
    console.log();
    console.log(header);
    for (const line of text.split("\n")) {
        console.log(c("│ ") + line);
    }
    console.log(footer);
}
export function printUser(text) {
    console.log();
    console.log(chalk.white.bold(`┌─ You ─────────────────────────────`));
    for (const line of text.split("\n")) {
        console.log(chalk.white("│ ") + line);
    }
    console.log(chalk.white(`└${"─".repeat(40)}`));
}
export function printSystem(text) {
    console.log(chalk.gray.italic(`  ⚙ ${text}`));
}
export function printError(text) {
    console.log(chalk.red.bold(`  ✗ ${text}`));
}
export function printHelp() {
    console.log();
    console.log(chalk.white.bold("  Council Commands:"));
    console.log(chalk.gray("  ──────────────────────────────────"));
    console.log(chalk.yellow("  /discuss") + chalk.gray("         Round-robin discussion (default)"));
    console.log(chalk.yellow("  /draft-review") + chalk.gray("    Claude drafts, Codex reviews, iterate"));
    console.log(chalk.yellow("  /volley <topic>") + chalk.gray("  Agents debate autonomously (add # for rounds)"));
    console.log(chalk.yellow("  /repo <key>") + chalk.gray("      Set target repo for GitHub access"));
    console.log(chalk.yellow("  /agents") + chalk.gray("          List configured agents"));
    console.log(chalk.yellow("  /spec") + chalk.gray("            Generate Builders spec from conversation"));
    console.log(chalk.yellow("  /queue") + chalk.gray("           Generate spec and queue as gist"));
    console.log(chalk.yellow("  /save [name]") + chalk.gray("     Save transcript to markdown"));
    console.log(chalk.yellow("  /export") + chalk.gray("          Alias for /save"));
    console.log(chalk.yellow("  /clear") + chalk.gray("           Clear conversation history"));
    console.log(chalk.yellow("  /help") + chalk.gray("            Show this help"));
    console.log(chalk.yellow("  /quit") + chalk.gray("            Exit"));
    console.log();
}
export function printBanner() {
    console.log();
    console.log(chalk.bold.white("  ╔═══════════════════════════════════════╗"));
    console.log(chalk.bold.white("  ║") +
        chalk.bold.cyan("        C O U N C I L") +
        chalk.bold.white("                  ║"));
    console.log(chalk.bold.white("  ║") +
        chalk.gray("   Multi-agent planning & review       ") +
        chalk.bold.white("║"));
    console.log(chalk.bold.white("  ╚═══════════════════════════════════════╝"));
    console.log();
    console.log(chalk.gray("  Type /help for commands, /quit to exit."));
    console.log();
}
/** Spinning indicator while agent is thinking */
export function startSpinner(label, color) {
    const c = getColor(color);
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\r  ${c(frames[i++ % frames.length])} ${c(label)} is thinking...`);
    }, 80);
    return () => {
        clearInterval(interval);
        process.stdout.write("\r" + " ".repeat(60) + "\r");
    };
}
//# sourceMappingURL=ui.js.map