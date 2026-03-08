import { execSync } from "node:child_process";
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}
/** Format a spec in Builders format (with frontmatter) */
export function formatBuildersSpec(data) {
    const lines = [];
    lines.push("---");
    lines.push(`repo: ${data.repo}`);
    lines.push(`title: ${data.title}`);
    lines.push("---");
    lines.push("");
    lines.push(data.body);
    return lines.join("\n");
}
/** Queue a spec as a GitHub gist for the dispatcher */
export function queueSpec(data) {
    const slug = slugify(data.title);
    const filename = `${data.repo}-${slug}.md`;
    const specContent = formatBuildersSpec(data);
    // Escape for shell
    const escaped = specContent.replace(/'/g, "'\\''");
    const result = execSync(`echo '${escaped}' | gh gist create --public --filename "${filename}" -`, { encoding: "utf-8", shell: "bash" }).trim();
    return { url: result, filename };
}
/** Extract spec data from the conversation using a simple heuristic.
 *  Returns null if the conversation doesn't have a clear spec yet. */
export function extractSpecFromConversation(entries, defaultRepo) {
    // Look for the last substantial message that looks like a spec
    const allContent = entries.map((e) => `[${e.role}]: ${e.content}`).join("\n");
    // Check if there's frontmatter already in the conversation
    const fmMatch = allContent.match(/---\s*\nrepo:\s*(\S+)\s*\ntitle:\s*(.+?)\s*\n---/);
    if (fmMatch) {
        const afterFm = allContent.split("---").slice(2).join("---").trim();
        return {
            repo: fmMatch[1],
            title: fmMatch[2],
            body: afterFm || "See conversation transcript.",
        };
    }
    return null;
}
//# sourceMappingURL=spec-formatter.js.map