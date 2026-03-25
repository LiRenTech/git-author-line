import * as vscode from "vscode";
import { GitLineAuthor } from "./main";


let gitLineAuthor: GitLineAuthor | null = null;

export function activate(context: vscode.ExtensionContext) {
  gitLineAuthor = new GitLineAuthor();

  const disposable = vscode.commands.registerCommand(
    "git-line-author.toggle",
    () => {
      if (gitLineAuthor) {
        gitLineAuthor.toggle();
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (gitLineAuthor) {
    gitLineAuthor.dispose();
    gitLineAuthor = null;
  }
}
