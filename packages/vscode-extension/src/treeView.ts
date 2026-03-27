import * as vscode from "vscode";
import { BitbucketClient, FileItem } from "@bitbucket-connector/core";

export class BitbucketTreeItem extends vscode.TreeItem {
  public filePath: string;
  public itemType: "FILE" | "DIRECTORY";
  public fileSize?: number;

  constructor(
    label: string,
    filePath: string,
    itemType: "FILE" | "DIRECTORY",
    fileSize?: number
  ) {
    super(
      label,
      itemType === "DIRECTORY"
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );
    this.filePath = filePath;
    this.itemType = itemType;
    this.fileSize = fileSize;

    if (itemType === "FILE") {
      this.iconPath = new vscode.ThemeIcon("file");
      this.description = fileSize ? `${fileSize} bytes` : undefined;
      this.command = {
        command: "bitbucket.openFile",
        title: "Open File",
        arguments: [filePath],
      };
    } else {
      this.iconPath = new vscode.ThemeIcon("folder");
    }
  }
}

export class BitbucketTreeProvider
  implements vscode.TreeDataProvider<BitbucketTreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    BitbucketTreeItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private client: BitbucketClient | undefined;
  private branch: string | undefined;

  setClient(client: BitbucketClient) {
    this.client = client;
    this.refresh();
  }

  getClient(): BitbucketClient | undefined {
    return this.client;
  }

  setBranch(branch: string) {
    this.branch = branch;
    this.refresh();
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: BitbucketTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: BitbucketTreeItem): Promise<BitbucketTreeItem[]> {
    if (!this.client) {
      return [
        new BitbucketTreeItem(
          "Configure connection...",
          "",
          "FILE"
        ),
      ];
    }

    const path = element?.filePath || "";

    try {
      const items: FileItem[] = await this.client.browse(path, this.branch);

      // Sort: directories first, then files alphabetically
      const dirs = items
        .filter((i) => i.type === "DIRECTORY")
        .sort((a, b) => a.name.localeCompare(b.name));
      const files = items
        .filter((i) => i.type === "FILE")
        .sort((a, b) => a.name.localeCompare(b.name));

      return [...dirs, ...files].map(
        (item) =>
          new BitbucketTreeItem(item.name, item.path, item.type, item.size)
      );
    } catch (err) {
      vscode.window.showErrorMessage(`Bitbucket: ${(err as Error).message}`);
      return [];
    }
  }
}
