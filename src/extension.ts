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
	dateString: string;
	subject: string;
}

// Color config interface for user settings
interface ColorConfig {
	regex: string;
	hue: number;
}

// Extension state
class GitLineAuthor {
	private decorationType: vscode.TextEditorDecorationType | null = null;
	private isActive: boolean = false;
	private decorations: Map<string, vscode.DecorationOptions[]> = new Map();
	private statusBarItem: vscode.StatusBarItem;
	private colorConfigs: ColorConfig[];
	
	// Default color configurations
  // https://www.ysdaima.com/tools/color-wheel
	private readonly defaultColorConfigs: ColorConfig[] = [
		{ regex: '^feat', hue: 234 },
		{ regex: '^fix', hue: 0 },
		{ regex: '^docs', hue: 100 },
		{ regex: '^refactor', hue: 60 },
		{ regex: '^test', hue: 308 }
	];

	constructor() {
		this.createDecorationType();
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
		this.statusBarItem.text = 'GitAuthorLine:Off';
		this.statusBarItem.tooltip = 'Toggle Git Author Display';
		this.statusBarItem.command = 'git-line-author.toggle';
		this.statusBarItem.show();
		
		// Initialize color configs
		this.colorConfigs = this.defaultColorConfigs;
		
		// Load initial configuration
		this.loadConfiguration();
		
		// Watch for configuration changes
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('gitLineAuthor')) {
				this.loadConfiguration();
				// Refresh decorations for all visible editors
				if (this.isActive) {
					vscode.window.visibleTextEditors.forEach(editor => {
						this.updateDecorations(editor);
					});
				}
			}
		});
	}

	private loadConfiguration() {
		const config = vscode.workspace.getConfiguration('gitLineAuthor');
		this.colorConfigs = config.get<ColorConfig[]>('colorConfigs', this.defaultColorConfigs);
	}

	private createDecorationType() {
		this.decorationType = vscode.window.createTextEditorDecorationType({
			gutterIconSize: 'contain',
			gutterIconPath: undefined,
			before: {
				contentText: '',
				color: new vscode.ThemeColor('editorLineNumber.foreground'),
				margin: '0 8px 0 0',
				width: '250px'
			}
		});
	}

	private getBackgroundColor(timestamp: number, minTimestamp: number, maxTimestamp: number, subject: string): string {
		// Normalize timestamp within the file's range (0 = oldest, 1 = newest)
		const normalized = (timestamp - minTimestamp) / (maxTimestamp - minTimestamp);
		
		// Get hue based on commit subject
		let hue = 240; // Default blue
		
		// Check each regex pattern
		for (const config of this.colorConfigs) {
			if (new RegExp(config.regex).test(subject)) {
				hue = config.hue;
				break;
			}
		}
		
		// Convert HSL to RGB
		// hue: 0-360, saturation: 0.7, lightness: varies based on timestamp
		const saturation = 0.7;
		const lightness = 0.3 + normalized * 0.6; // Oldest: 0.3 (dark), Newest: 0.9 (light)
		
		const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
			const c = (1 - Math.abs(2 * l - 1)) * s;
			const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
			const m = l - c / 2;
			let r = 0, g = 0, b = 0;
			
			if (0 <= h && h < 60) {
				r = c; g = x; b = 0;
			} else if (60 <= h && h < 120) {
				r = x; g = c; b = 0;
			} else if (120 <= h && h < 180) {
				r = 0; g = c; b = x;
			} else if (180 <= h && h < 240) {
				r = 0; g = x; b = c;
			} else if (240 <= h && h < 300) {
				r = x; g = 0; b = c;
			} else if (300 <= h && h < 360) {
				r = c; g = 0; b = x;
			}
			
			return [
				Math.round((r + m) * 255),
				Math.round((g + m) * 255),
				Math.round((b + m) * 255)
			];
		};
		
		const [r, g, b] = hslToRgb(hue, saturation, lightness);
		
		// Convert to hex color
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}

	private getTextColor(backgroundColor: string): string {
		// Extract RGB components from hex color
		const hex = backgroundColor.replace('#', '');
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);
		
		// Calculate relative luminance (perceived brightness)
		// Using formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/#relativeluminancedef
		const [rs, gs, bs] = [r, g, b].map(c => {
			const s = c / 255;
			return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
		});
		const luminance = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
		
		// Use black text for light backgrounds, white text for dark backgrounds
		// Threshold of 0.5 is a common choice
		return luminance > 0.5 ? '#000000' : '#FFFFFF';
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
					// Format date as YY/MM/DD
					const date = new Date(timestamp * 1000);
					const year = date.getFullYear().toString().slice(-2);
					const month = (date.getMonth() + 1).toString().padStart(2, '0');
					const day = date.getDate().toString().padStart(2, '0');
					currentBlameInfo.dateString = `${year}/${month}/${day}`;
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
							dateString: currentBlameInfo.dateString || '',
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

		// Calculate min and max timestamps for this file
		let minTimestamp = Infinity;
		let maxTimestamp = -Infinity;
		blameInfo.forEach(info => {
			minTimestamp = Math.min(minTimestamp, info.timestamp);
			maxTimestamp = Math.max(maxTimestamp, info.timestamp);
		});

		// Ensure we have a valid range
		if (minTimestamp === maxTimestamp) {
			minTimestamp = maxTimestamp - 86400; // 1 day difference if all timestamps are the same
		}

		const decorationOptions: vscode.DecorationOptions[] = [];

		for (let line = 0; line < editor.document.lineCount; line++) {
			const lineNumber = line + 1;
			const info = blameInfo.get(lineNumber);

			if (info) {
				const range = new vscode.Range(line, 0, line, 0);
				const backgroundColor = this.getBackgroundColor(info.timestamp, minTimestamp, maxTimestamp, info.subject);
				const textColor = this.getTextColor(backgroundColor);
				decorationOptions.push({
					range,
					renderOptions: {
						before: {
							contentText: `${info.dateString} ${info.author}`,
							backgroundColor: backgroundColor,
							color: textColor
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
		this.statusBarItem.text = 'GitAuthorLine:On';

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
		this.statusBarItem.text = 'GitAuthorLine:Off';

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

	// Default to inactive
	// gitLineAuthor.activate();
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (gitLineAuthor) {
		gitLineAuthor.dispose();
		gitLineAuthor = null;
	}
}