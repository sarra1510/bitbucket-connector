import { BitbucketClient, FileContent } from "@bitbucket-connector/core";

function detectLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    sh: "bash",
    py: "python",
    java: "java",
    xml: "xml",
    html: "html",
    css: "css",
    scss: "scss",
  };
  return map[ext] || "";
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export class BitbucketSkills {
  constructor(private client: BitbucketClient) {}

  async connect(): Promise<string> {
    const info = await this.client.getRepoInfo();
    return [
      `## ✅ Connexion Bitbucket réussie`,
      ``,
      `| Champ | Valeur |`,
      `|---|---|`,
      `| **Repo** | ${info.name} |`,
      `| **Description** | ${info.description || "N/A"} |`,
      `| **Projet** | ${info.project.name} (\`${info.project.key}\`) |`,
      `| **État** | ${info.state} |`,
      `| **Clone SSH** | \`${info.cloneUrls.ssh || "N/A"}\` |`,
      `| **Clone HTTP** | \`${info.cloneUrls.http || "N/A"}\` |`,
    ].join("\n");
  }

  async listBranches(): Promise<string> {
    const branches = await this.client.getBranches(50);
    const lines = branches.map((b) =>
      b.isDefault ? `- ⭐ **${b.displayId}** (default)` : `- 🌿 ${b.displayId}`
    );
    return [`## 🌿 Branches (${branches.length})`, "", ...lines].join("\n");
  }

  async browsePath(path = ""): Promise<string> {
    const items = await this.client.browse(path);
    const dirs = items
      .filter((i) => i.type === "DIRECTORY")
      .sort((a, b) => a.name.localeCompare(b.name));
    const files = items
      .filter((i) => i.type === "FILE")
      .sort((a, b) => a.name.localeCompare(b.name));

    const lines = [
      ...dirs.map((d) => `- 📁 **${d.name}/**`),
      ...files.map((f) => `- 📄 ${f.name}${f.size ? ` *(${f.size} bytes)*` : ""}`),
    ];

    return [
      `## 📂 Contenu de \`/${path || ""}\` (${items.length} éléments)`,
      "",
      ...lines,
    ].join("\n");
  }

  async readFile(filePath: string, branch?: string): Promise<string> {
    const content: FileContent = await this.client.readFile(filePath, branch);
    const lang = detectLanguage(filePath);
    const branchInfo = branch ? ` sur \`${branch}\`` : "";
    return [
      `## 📄 \`${filePath}\`${branchInfo}`,
      ``,
      `*${content.lines.length} lignes — ${content.size} bytes*`,
      ``,
      `\`\`\`${lang}`,
      content.lines.join("\n"),
      `\`\`\``,
    ].join("\n");
  }

  async listCommits(limit = 10, branch?: string): Promise<string> {
    const commits = await this.client.getCommits(limit, branch);
    const branchInfo = branch ? ` sur \`${branch}\`` : "";
    const lines = commits.map(
      (c) =>
        `- \`${c.displayId}\` — **${c.message.split("\n")[0]}** — *${c.author.name}* — ${formatDate(c.authorTimestamp)}`
    );
    return [
      `## 📊 Derniers commits (${commits.length})${branchInfo}`,
      "",
      ...lines,
    ].join("\n");
  }

  async listPullRequests(state = "OPEN"): Promise<string> {
    const prs = await this.client.getPullRequests(state, 25);
    const lines = prs.map(
      (pr) =>
        `- **#${pr.id}** [${pr.state}] **${pr.title}** — *${pr.author.user.displayName}* — \`${pr.fromRef.displayId}\` → \`${pr.toRef.displayId}\``
    );
    return [
      `## 🔀 Pull Requests \`${state}\` (${prs.length})`,
      "",
      prs.length === 0 ? "*Aucune pull request trouvée.*" : lines.join("\n"),
    ].join("\n");
  }

  async searchFiles(query: string): Promise<string> {
    const results = await this.client.searchFiles(query);
    if (results.length === 0) {
      return `## 🔍 Recherche : \`${query}\`\n\n*Aucun fichier trouvé.*`;
    }
    const lines = results.map((f) => `- 📄 \`${f.path}\``);
    return [
      `## 🔍 Résultats pour \`${query}\` (${results.length} fichiers)`,
      "",
      ...lines,
    ].join("\n");
  }
}
