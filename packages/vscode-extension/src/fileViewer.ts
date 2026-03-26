import * as vscode from "vscode";
import { BitbucketClient } from "@bitbucket-connector/core";

export class FileViewerProvider implements vscode.TextDocumentContentProvider {
  private client: BitbucketClient | undefined;
  private branch: string | undefined;

  setClient(client: BitbucketClient) {
    this.client = client;
  }

  setBranch(branch: string) {
    this.branch = branch;
  }

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    if (!this.client) {
      return "// Not connected to Bitbucket";
    }

    // URI path starts with '/', strip it
    const filePath = uri.path.replace(/^\//, "");

    try {
      const content = await this.client.readFile(filePath, this.branch);
      return content.lines.join("\n");
    } catch (err) {
      return `// Error loading file: ${(err as Error).message}`;
    }
  }
}
