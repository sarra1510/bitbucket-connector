import { BitbucketSkills } from "./skills";

const HELP_TABLE = `## 🤖 Commandes disponibles

| Commande | Exemple |
|---|---|
| Connexion / Statut | \`connecte-toi\`, \`status\` |
| Lister les branches | \`liste les branches\` |
| Explorer un dossier | \`explore packages/\` |
| Lire un fichier | \`lis le fichier src/index.ts\` |
| Voir les commits | \`derniers commits\`, \`10 commits sur develop\` |
| Pull Requests | \`liste les PR ouvertes\`, \`PR merged\` |
| Rechercher | \`cherche package.json\` |
| Aide | \`aide\`, \`help\` |`;

export class BitbucketAgent {
  constructor(private skills: BitbucketSkills) {}

  async handleMessage(userMessage: string): Promise<string> {
    const msg = userMessage.toLowerCase().trim();

    try {
      // Connect / status
      if (/connect|connexion|status|statut/.test(msg)) {
        return await this.skills.connect();
      }

      // Branches
      if (/branch|branche/.test(msg)) {
        return await this.skills.listBranches();
      }

      // Read file
      if (/\b(lis|lire|read|contenu de|montre|cat)\b/.test(msg)) {
        // Patterns to extract file path:
        // 1. Path inside backticks/quotes after keyword
        // 2. Path-like token (contains a dot) after optional "le fichier" qualifier
        // 3. Fallback: any backtick-quoted token in the message
        const match =
          msg.match(/(?:lis|lire|read|contenu de|montre|cat)[^`"]*[`"]([^`"]+)[`"]/) ||
          msg.match(/(?:lis|lire|read|contenu de|montre|cat)\s+(?:le\s+fichier\s+|le\s+|)([^\s]+\.[^\s]+)/) ||
          msg.match(/`([^`]+)`/);

        const filePath = match?.[1]?.trim();
        if (!filePath) {
          return `❓ Quel fichier voulez-vous lire ? Exemple : \`lis le fichier src/index.ts\``;
        }

        // Optional branch extraction: "sur develop" or "on develop" or "branch develop"
        const branchMatch = userMessage.match(
          /(?:sur|on|branche|branch)\s+([\w\-/.]+)/i
        );
        const branch = branchMatch?.[1];

        return await this.skills.readFile(filePath, branch);
      }

      // Browse / explore
      if (/explore|parcour|dossier|browse|\bls\b/.test(msg)) {
        // Extract path from message
        const match =
          msg.match(/(?:explore|parcour|dossier|browse|ls)\s+([\w\-/.]+)/) ||
          msg.match(/`([^`]+)`/);
        const path = match?.[1]?.trim() || "";
        return await this.skills.browsePath(path);
      }

      // Commits
      if (/commit/.test(msg)) {
        // Extract optional limit (e.g. "20 commits")
        const limitMatch = msg.match(/(\d+)\s*commit/);
        const limit = limitMatch ? parseInt(limitMatch[1], 10) : 10;

        // Extract optional branch
        const branchMatch = userMessage.match(
          /(?:sur|on|branche|branch)\s+([\w\-/.]+)/i
        );
        const branch = branchMatch?.[1];

        return await this.skills.listCommits(limit, branch);
      }

      // Pull Requests
      if (/pull\s*request|merge\s*request|\bpr\b/.test(msg)) {
        let state = "OPEN";
        if (/merg|closed|fermé/.test(msg)) state = "MERGED";
        else if (/declin|refus/.test(msg)) state = "DECLINED";
        else if (/all|tout|toutes/.test(msg)) state = "ALL";
        return await this.skills.listPullRequests(state);
      }

      // Search
      if (/cherch|search|trouv|find/.test(msg)) {
        // Extract search query
        const match =
          userMessage.match(/(?:cherche|search|trouve|find)\s+"([^"]+)"/i) ||
          userMessage.match(/(?:cherche|search|trouve|find)\s+`([^`]+)`/i) ||
          userMessage.match(/(?:cherche|search|trouve|find)\s+([\w\-/.]+)/i);
        const query = match?.[1]?.trim();
        if (!query) {
          return `❓ Que voulez-vous chercher ? Exemple : \`cherche package.json\``;
        }
        return await this.skills.searchFiles(query);
      }

      // Help
      if (/aide|help/.test(msg)) {
        return HELP_TABLE;
      }

      // Default
      return HELP_TABLE;
    } catch (err) {
      return `❌ Erreur : ${(err as Error).message}`;
    }
  }
}
