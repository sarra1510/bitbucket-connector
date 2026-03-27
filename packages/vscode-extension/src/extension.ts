import * as vscode from "vscode";
import { BitbucketClient } from "@bitbucket-connector/core";
import { BitbucketTreeProvider } from "./treeView";
import { FileViewerProvider } from "./fileViewer";
import { registerCommands } from "./commands";

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = new BitbucketTreeProvider();
  const fileViewerProvider = new FileViewerProvider();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("bitbucketExplorer", treeProvider),
    vscode.workspace.registerTextDocumentContentProvider(
      "bitbucket",
      fileViewerProvider
    )
  );

  registerCommands(context, treeProvider, fileViewerProvider);

  // Status bar item
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusBar.text = "$(source-control) Bitbucket";
  statusBar.command = "bitbucket.connect";
  statusBar.tooltip = "Connect to Bitbucket Server";
  statusBar.show();
  context.subscriptions.push(statusBar);

  // Auto-connect if settings are configured
  const cfg = vscode.workspace.getConfiguration("bitbucketConnector");
  const baseUrl = cfg.get<string>("baseUrl");
  const user = cfg.get<string>("user");
  const project = cfg.get<string>("project");
  const repo = cfg.get<string>("repo");

  if (baseUrl && user && project && repo) {
    void context.secrets.get("bitbucketToken").then((token) => {
      const client = new BitbucketClient({
        baseUrl,
        user,
        project,
        repo,
        token,
      });
      treeProvider.setClient(client);
      fileViewerProvider.setClient(client);
      statusBar.text = `$(source-control) Bitbucket: ${repo}`;
    }, (err: Error) => {
      vscode.window.showWarningMessage(`Bitbucket: Auto-connect failed — ${err.message}`);
    });
  }
}

export function deactivate() {}
