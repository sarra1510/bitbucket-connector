import * as vscode from "vscode";
import { BitbucketClient } from "@bitbucket-connector/core";
import { BitbucketTreeProvider } from "./treeView";
import { FileViewerProvider } from "./fileViewer";

export function registerCommands(
  context: vscode.ExtensionContext,
  treeProvider: BitbucketTreeProvider,
  fileViewerProvider: FileViewerProvider
) {
  // bitbucket.connect
  context.subscriptions.push(
    vscode.commands.registerCommand("bitbucket.connect", async () => {
      const cfg = vscode.workspace.getConfiguration("bitbucketConnector");

      let baseUrl = cfg.get<string>("baseUrl");
      if (!baseUrl) {
        baseUrl = await vscode.window.showInputBox({
          prompt: "Bitbucket Server URL (e.g. https://bitbucket.my-nx.com)",
          placeHolder: "https://bitbucket.my-nx.com",
        });
        if (!baseUrl) return;
        await cfg.update("baseUrl", baseUrl, vscode.ConfigurationTarget.Global);
      }

      let user = cfg.get<string>("user");
      if (!user) {
        user = await vscode.window.showInputBox({ prompt: "Bitbucket username" });
        if (!user) return;
        await cfg.update("user", user, vscode.ConfigurationTarget.Global);
      }

      let project = cfg.get<string>("project");
      if (!project) {
        project = await vscode.window.showInputBox({
          prompt: "Bitbucket project key",
        });
        if (!project) return;
        await cfg.update("project", project, vscode.ConfigurationTarget.Global);
      }

      let repo = cfg.get<string>("repo");
      if (!repo) {
        repo = await vscode.window.showInputBox({
          prompt: "Bitbucket repository slug",
        });
        if (!repo) return;
        await cfg.update("repo", repo, vscode.ConfigurationTarget.Global);
      }

      let token = await context.secrets.get("bitbucketToken");
      if (!token) {
        token = await vscode.window.showInputBox({
          prompt: "Bitbucket token (leave empty to use username/password)",
          password: true,
        });
        if (token) {
          await context.secrets.store("bitbucketToken", token);
        }
      }

      const client = new BitbucketClient({ baseUrl, user, project, repo, token });

      try {
        const info = await client.getRepoInfo();
        vscode.window.showInformationMessage(
          `✅ Connected to ${info.name} (${info.project.key})`
        );
        treeProvider.setClient(client);
        fileViewerProvider.setClient(client);
      } catch (err) {
        vscode.window.showErrorMessage(
          `❌ Connection failed: ${(err as Error).message}`
        );
      }
    })
  );

  // bitbucket.refresh
  context.subscriptions.push(
    vscode.commands.registerCommand("bitbucket.refresh", () => {
      treeProvider.refresh();
    })
  );

  // bitbucket.openFile
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "bitbucket.openFile",
      async (filePath: string) => {
        const uri = vscode.Uri.parse(`bitbucket:///${filePath}`);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: true });
      }
    )
  );

  // bitbucket.switchBranch
  context.subscriptions.push(
    vscode.commands.registerCommand("bitbucket.switchBranch", async () => {
      const client = treeProvider.getClient();
      if (!client) {
        vscode.window.showWarningMessage("Not connected to Bitbucket");
        return;
      }

      const branches = await client.getBranches(50);
      const items = branches.map((b) => ({
        label: b.displayId,
        description: b.isDefault ? "(default)" : undefined,
      }));

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a branch",
      });

      if (picked) {
        treeProvider.setBranch(picked.label);
        fileViewerProvider.setBranch(picked.label);
      }
    })
  );

  // bitbucket.searchFiles
  context.subscriptions.push(
    vscode.commands.registerCommand("bitbucket.searchFiles", async () => {
      const client = treeProvider.getClient();
      if (!client) {
        vscode.window.showWarningMessage("Not connected to Bitbucket");
        return;
      }

      const query = await vscode.window.showInputBox({
        prompt: "Search files by name",
        placeHolder: "e.g. package.json",
      });
      if (!query) return;

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Searching for "${query}"...`,
        },
        async () => {
          const results = await client.searchFiles(query);
          if (results.length === 0) {
            vscode.window.showInformationMessage(`No files found for "${query}"`);
            return;
          }

          const picked = await vscode.window.showQuickPick(
            results.map((f) => ({ label: f.name, description: f.path })),
            { placeHolder: `${results.length} file(s) found` }
          );

          if (picked) {
            await vscode.commands.executeCommand(
              "bitbucket.openFile",
              picked.description
            );
          }
        }
      );
    })
  );
}
