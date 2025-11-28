// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

// Git blame information for a line
interface GitBlameInfo {
	author: string;
	commit: string;
	timestamp: number;
	date: string;
	subject: string;
}

// Extension state
class GitLineAuthor {
	private decorationType: vscode.TextEditorDecorationType | null = null;
	private isActive: boolean = false;
	private decorations: Map<string, vscode.DecorationOptions[]> = new Map();
	private statusBarItem: vscode.StatusBarItem;

	constructor() {
		this.createDecorationType();
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		this.statusBarItem.text = '$(eye) Git Author: On';
		this.statusBarItem.tooltip = 'Toggle Git Author Display';
		this.statusBarItem.command = 'git-line-author.toggle';
		this.statusBarItem.show();
	}

	private createDecorationType() {
		this.decorationType = vscode.window.createTextEditorDecorationType({
			gutterIconSize: 'contain',
			gutterIconPath: undefined,
			before: {
				contentText: '',
				color: new vscode.ThemeColor('editorLineNumber.foreground'),
				margin: '0 8px 0 0'
			}
		});
	}

	private getAuthorColor(timestamp: number): string {
		// Calculate time difference in days
		const now = Date.now() / 1000;
		const daysDiff = Math.floor((now - timestamp) / (60 * 60 * 24));
		
		// Define color range: recent (bright blue) to old (dark blue)
		// Bright blue: #4A90E2, Dark blue: #1A365D
		// Adjust based on days (max 365 days for full darkening)
		const maxDays = 365;
		const normalizedDays = Math.min(daysDiff / maxDays, 1);
		
		// Calculate RGB components
		const r1 = 74; // Bright blue R
		const g1 = 144; // Bright blue G
		const b1 = 226; // Bright blue B
		
		const r2 = 26; // Dark blue R
		const g2 = 54; // Dark blue G
		const b2 = 93; // Dark blue B
		
		// Interpolate between bright and dark based on normalized days
		const r = Math.round(r1 + (r2 - r1) * normalizedDays);
		const g = Math.round(g1 + (g2 - g1) * normalizedDays);
		const b = Math.round(b1 + (b2 - b1) * normalizedDays);
		
		// Convert to hex color
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}

	private async getGitBlameInfo(filePath: string): Promise<Map<number, GitBlameInfo>> {
		const result = new Map<number, GitBlameInfo>();

		try {
			// Execute git blame command
			const gitBlameOutput = cp.execSync(
				`git blame --line-porcelain ${filePath}`,
				{ cwd: path.dirname(filePath), encoding: 'utf8' }
			);

			// Parse git blame output
			const lines = gitBlameOutput.split('\n');
			let currentLine = 1;
			let currentBlameInfo: Partial<GitBlameInfo> = {};

			for (const line of lines) {
				if (line.startsWith('author ')) {
					currentBlameInfo.author = line.substring(7);
				} else if (line.startsWith('committer-time ')) {
					const timestamp = parseInt(line.substring(15));
					currentBlameInfo.timestamp = timestamp;
					currentBlameInfo.date = new Date(timestamp * 1000).toLocaleDateString();
				} else if (line.startsWith('summary ')) {
					currentBlameInfo.subject = line.substring(8);
				} else if (line.startsWith('\t')) {
					// End of blame info for this line
					if (currentBlameInfo.author && currentBlameInfo.timestamp !== undefined) {
						result.set(currentLine, {
							author: currentBlameInfo.author!,
							commit: '',
							timestamp: currentBlameInfo.timestamp!,
							date: currentBlameInfo.date || '',
							subject: currentBlameInfo.subject || ''
						});
					}
					currentLine++;
					currentBlameInfo = {};
				}
			}
		} catch (error) {
			console.error('Error getting git blame info:', error);
		}

		return result;
	}

	private async updateDecorations(editor: vscode.TextEditor) {
		if (!this.decorationType || !this.isActive) {
			return;
		}

		const filePath = editor.document.uri.fsPath;
		const blameInfo = await this.getGitBlameInfo(filePath);

		const decorationOptions: vscode.DecorationOptions[] = [];

		for (let line = 0; line < editor.document.lineCount; line++) {
			const lineNumber = line + 1;
			const info = blameInfo.get(lineNumber);

			if (info) {
				const range = new vscode.Range(line, 0, line, 0);
				const color = this.getAuthorColor(info.timestamp);
				decorationOptions.push({
					range,
					renderOptions: {
						before: {
							contentText: info.author,
							color: color
						}
					}
				});
			}
		}

		this.decorations.set(filePath, decorationOptions);
		editor.setDecorations(this.decorationType, decorationOptions);
	}

	private handleTextEditorChange(editor: vscode.TextEditor | undefined) {
		if (editor) {
			this.updateDecorations(editor);
		}
	}

	private handleTextEditorSelectionChange(event: vscode.TextEditorSelectionChangeEvent) {
		// No need to update on selection change
	}

	private handleDocumentChange(event: vscode.TextDocumentChangeEvent) {
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document.uri.fsPath === event.document.uri.fsPath) {
			this.updateDecorations(editor);
		}
	}

	public activate() {
		if (this.isActive) {
			return;
		}

		this.isActive = true;
		this.statusBarItem.text = '$(eye) Git Author: On';

		// Update decorations for all visible editors
		vscode.window.visibleTextEditors.forEach(editor => {
			this.updateDecorations(editor);
		});

		// Subscribe to editor events
		vscode.window.onDidChangeActiveTextEditor(this.handleTextEditorChange.bind(this));
		vscode.window.onDidChangeTextEditorSelection(this.handleTextEditorSelectionChange.bind(this));
		vscode.workspace.onDidChangeTextDocument(this.handleDocumentChange.bind(this));

		console.log('Git Line Author activated');
	}

	public deactivate() {
		if (!this.isActive) {
			return;
		}

		this.isActive = false;
		this.statusBarItem.text = '$(eye) Git Author: Off';

		// Clear decorations from all editors
		const decorationType = this.decorationType;
		if (decorationType) {
			vscode.window.visibleTextEditors.forEach(editor => {
				editor.setDecorations(decorationType, []);
			});
		}

		this.decorations.clear();
		console.log('Git Line Author deactivated');
	}

	public toggle() {
		if (this.isActive) {
			this.deactivate();
		} else {
			this.activate();
		}
	}

	public dispose() {
		this.deactivate();
		if (this.decorationType) {
			this.decorationType.dispose();
		}
		this.statusBarItem.dispose();
	}
}

// Global instance
let gitLineAuthor: GitLineAuthor | null = null;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "git-line-author" is now active!');

	// Create instance
	gitLineAuthor = new GitLineAuthor();

	// Register toggle command
	const disposable = vscode.commands.registerCommand('git-line-author.toggle', () => {
		if (gitLineAuthor) {
			gitLineAuthor.toggle();
		}
	});

	context.subscriptions.push(disposable);

	// Activate by default
	if (gitLineAuthor) {
		gitLineAuthor.activate();
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (gitLineAuthor) {
		gitLineAuthor.dispose();
		gitLineAuthor = null;
	}
}
