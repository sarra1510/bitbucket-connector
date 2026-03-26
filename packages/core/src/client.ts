import axios, { AxiosInstance } from "axios";
import {
  BitbucketConfig,
  RepoInfo,
  Branch,
  FileItem,
  FileContent,
  Commit,
  PullRequest,
} from "./types";

export class BitbucketClient {
  private api: AxiosInstance;
  private config: BitbucketConfig;
  private repoBase: string;

  constructor(config: BitbucketConfig) {
    this.config = config;
    this.repoBase = `/projects/${config.project}/repos/${config.repo}`;

    const headers: Record<string, string> = {};
    if (config.token) {
      headers["Authorization"] = `Bearer ${config.token}`;
    }

    this.api = axios.create({
      baseURL: `${config.baseUrl}/rest/api/1.0`,
      headers,
      auth:
        !config.token && config.password
          ? { username: config.user, password: config.password }
          : undefined,
    });
  }

  async getRepoInfo(): Promise<RepoInfo> {
    const res = await this.api.get(this.repoBase);
    const data = res.data;
    return {
      name: data.name,
      description: data.description || "",
      project: { name: data.project.name, key: data.project.key },
      state: data.state,
      cloneUrls: {
        ssh: data.links?.clone?.find((l: { name: string; href: string }) => l.name === "ssh")?.href,
        http: data.links?.clone?.find((l: { name: string; href: string }) => l.name === "http")?.href,
      },
    };
  }

  async getBranches(limit = 25): Promise<Branch[]> {
    const res = await this.api.get(`${this.repoBase}/branches?limit=${limit}`);
    return res.data.values.map((b: { id: string; displayId: string; isDefault: boolean; latestCommit: string }) => ({
      id: b.id,
      displayId: b.displayId,
      isDefault: b.isDefault,
      latestCommit: b.latestCommit,
    }));
  }

  async browse(path = "", branch?: string): Promise<FileItem[]> {
    const branchParam = branch ? `&at=refs/heads/${encodeURIComponent(branch)}` : "";
    const url = `${this.repoBase}/browse${path ? `/${path}` : ""}?limit=500${branchParam}`;
    const res = await this.api.get(url);
    const items: { path: { name: string }; type: string; size?: number }[] =
      res.data.children?.values || [];
    return items.map((item) => ({
      name: item.path.name,
      type: item.type as "FILE" | "DIRECTORY",
      path: path ? `${path}/${item.path.name}` : item.path.name,
      size: item.size,
    }));
  }

  async readFile(filePath: string, branch?: string): Promise<FileContent> {
    const branchParam = branch ? `&at=refs/heads/${encodeURIComponent(branch)}` : "";
    let start = 0;
    let isLastPage = false;
    const allLines: string[] = [];
    let size = 0;

    while (!isLastPage) {
      const url = `${this.repoBase}/browse/${filePath}?limit=500&start=${start}${branchParam}`;
      const res = await this.api.get(url);

      if (res.data.size !== undefined) {
        size = res.data.size;
      }

      const lines: { text: string }[] = res.data.lines || [];
      lines.forEach((line) => allLines.push(line.text));

      isLastPage = res.data.isLastPage;
      start =
        res.data.nextPageStart !== undefined
          ? res.data.nextPageStart
          : start + lines.length;

      if (lines.length === 0) break;
    }

    return { lines: allLines, path: filePath, size, branch };
  }

  async getCommits(limit = 25, branch?: string): Promise<Commit[]> {
    const branchParam = branch ? `&at=refs/heads/${encodeURIComponent(branch)}` : "";
    const res = await this.api.get(
      `${this.repoBase}/commits?limit=${limit}${branchParam}`
    );
    return res.data.values.map(
      (c: {
        id: string;
        displayId: string;
        message: string;
        author: { name: string; emailAddress: string };
        authorTimestamp: number;
      }) => ({
        id: c.id,
        displayId: c.displayId,
        message: c.message,
        author: c.author,
        authorTimestamp: c.authorTimestamp,
      })
    );
  }

  async getPullRequests(state = "OPEN", limit = 25): Promise<PullRequest[]> {
    const res = await this.api.get(
      `${this.repoBase}/pull-requests?state=${state.toUpperCase()}&limit=${limit}`
    );
    return res.data.values.map(
      (pr: {
        id: number;
        title: string;
        description: string;
        state: string;
        author: { user: { displayName: string; name: string } };
        fromRef: { displayId: string };
        toRef: { displayId: string };
        createdDate: number;
        updatedDate: number;
      }) => ({
        id: pr.id,
        title: pr.title,
        description: pr.description || "",
        state: pr.state,
        author: pr.author,
        fromRef: pr.fromRef,
        toRef: pr.toRef,
        createdDate: pr.createdDate,
        updatedDate: pr.updatedDate,
      })
    );
  }

  /**
   * Search for files whose name matches the query string.
   * Note: this performs a full recursive directory traversal before filtering.
   * For large repositories, consider limiting the search to a specific path.
   */
  async searchFiles(query: string, path = ""): Promise<FileItem[]> {
    const allFiles = await this._getAllFiles(path);
    const lowerQuery = query.toLowerCase();
    return allFiles.filter((f) => f.name.toLowerCase().includes(lowerQuery));
  }

  private async _getAllFiles(path = ""): Promise<FileItem[]> {
    const items = await this.browse(path);
    const results: FileItem[] = [];
    for (const item of items) {
      if (item.type === "FILE") {
        results.push(item);
      } else {
        const sub = await this._getAllFiles(item.path);
        results.push(...sub);
      }
    }
    return results;
  }
}
