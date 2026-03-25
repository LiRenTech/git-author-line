import * as cp from "child_process";
import * as path from "path";
import * as vscode from "vscode";

import { getTextColor, hslToRgb } from "./tools";

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
export class GitLineAuthor {
	private decorationType: vscode.TextEditorDecorationType | null = null;
	private isActive: boolean = false;
	private decorations: Map<string, vscode.DecorationOptions[]> = new Map();
	private statusBarItem: vscode.StatusBarItem;
	private colorConfigs: ColorConfig[];

	// Default color configurations
	// https://www.ysdaima.com/tools/color-wheel
	private readonly defaultColorConfigs: ColorConfig[] = [
		{ regex: "^feat", hue: 234 },
		{ regex: "^fix", hue: 0 },
		{ regex: "^docs", hue: 100 },
		{ regex: "^refactor", hue: 60 },
		{ regex: "^test", hue: 308 },
	];

	constructor() {
		this.createDecorationType();
		this.statusBarItem = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Left,
			100,
		);
		this.statusBarItem.text = `$(eye-disabled)$(lines-icon)`;
		this.statusBarItem.tooltip = "Toggle Git Author Display";
		this.statusBarItem.command = "git-line-author.toggle";
		this.statusBarItem.show();

		// Initialize color configs
		this.colorConfigs = this.defaultColorConfigs;

		// Load initial configuration
		this.loadConfiguration();

		// Watch for configuration changes
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("gitLineAuthor")) {
				this.loadConfiguration();
				// Refresh decorations for all visible editors
				if (this.isActive) {
					vscode.window.visibleTextEditors.forEach((editor) => {
						this.updateDecorations(editor);
					});
				}
			}
		});
	}

	private loadConfiguration() {
		const config = vscode.workspace.getConfiguration("gitLineAuthor");
		this.colorConfigs = config.get<ColorConfig[]>(
			"colorConfigs",
			this.defaultColorConfigs,
		);
	}

	private createDecorationType() {
		this.decorationType = vscode.window.createTextEditorDecorationType({
			gutterIconSize: "contain",
			gutterIconPath: undefined,
			before: {
				contentText: "",
				color: new vscode.ThemeColor("editorLineNumber.foreground"),
				margin: "0 8px 0 0",
				width: "250px",
			},
		});
	}

	private getBackgroundColor(
		timestamp: number,
		minTimestamp: number,
		maxTimestamp: number,
		subject: string,
	): string {
		// Normalize timestamp within the file's range (0 = oldest, 1 = newest)
		const normalized =
			(timestamp - minTimestamp) / (maxTimestamp - minTimestamp);

		// Check if any regex pattern matches
		let matched = false;
		let hue = 240; // Default blue

		for (const config of this.colorConfigs) {
			if (new RegExp(config.regex).test(subject)) {
				hue = config.hue;
				matched = true;
				break;
			}
		}

		// If no match, use grayscale
		if (!matched) {
			// For no match, use grayscale from dark gray to light gray
			// Normalized: 0 (oldest) -> dark gray, 1 (newest) -> light gray
			const grayValue = Math.round(50 + normalized * 205); // 50 (dark) to 255 (light)
			const hexValue = grayValue.toString(16).padStart(2, "0");
			return `#${hexValue}${hexValue}${hexValue}`;
		}

		// Convert HSL to RGB for matched patterns
		// hue: 0-360, saturation: 0.7, lightness: varies based on timestamp
		const saturation = 0.7;
		const lightness = 0.3 + normalized * 0.6; // Oldest: 0.3 (dark), Newest: 0.9 (light)

		const [r, g, b] = hslToRgb(hue, saturation, lightness);

		// Convert to hex color
		return `#${r.toString(16).padStart(2, "0")}${g
			.toString(16)
			.padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
	}

	private async getGitBlameInfo(
		filePath: string,
	): Promise<Map<number, GitBlameInfo>> {
		const result = new Map<number, GitBlameInfo>();

		try {
			// Execute git blame command
			const gitBlameOutput = cp.execSync(
				`git blame --line-porcelain ${filePath}`,
				{ cwd: path.dirname(filePath), encoding: "utf8" },
			);

			// Parse git blame output
			const lines = gitBlameOutput.split("\n");
			let currentLine = 1;
			let currentBlameInfo: Partial<GitBlameInfo> = {};

			for (const line of lines) {
				if (line.startsWith("author ")) {
					currentBlameInfo.author = line.substring(7);
				} else if (line.startsWith("committer-time ")) {
					const timestamp = parseInt(line.substring(15));
					currentBlameInfo.timestamp = timestamp;
					currentBlameInfo.date = new Date(
						timestamp * 1000,
					).toLocaleDateString();
					// Format date as YY/MM/DD
					const date = new Date(timestamp * 1000);
					const year = date.getFullYear().toString().slice(-2);
					const month = (date.getMonth() + 1).toString().padStart(2, "0");
					const day = date.getDate().toString().padStart(2, "0");
					currentBlameInfo.dateString = `${year}/${month}/${day}`;
				} else if (line.startsWith("summary ")) {
					currentBlameInfo.subject = line.substring(8);
				} else if (line.startsWith("\t")) {
					// End of blame info for this line
					if (
						currentBlameInfo.author &&
						currentBlameInfo.timestamp !== undefined
					) {
						result.set(currentLine, {
							author: currentBlameInfo.author!,
							commit: "",
							timestamp: currentBlameInfo.timestamp!,
							date: currentBlameInfo.date || "",
							dateString: currentBlameInfo.dateString || "",
							subject: currentBlameInfo.subject || "",
						});
					}
					currentLine++;
					currentBlameInfo = {};
				}
			}
		} catch (error) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(`Git Line Author: ${error.message}`);
      }
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
		blameInfo.forEach((info) => {
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
				const backgroundColor = this.getBackgroundColor(
					info.timestamp,
					minTimestamp,
					maxTimestamp,
					info.subject,
				);
				const textColor = getTextColor(backgroundColor);
				decorationOptions.push({
					range,
					renderOptions: {
						before: {
							contentText: `${info.dateString} ${info.author}`,
							backgroundColor: backgroundColor,
							color: textColor,
						},
					},
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
		this.statusBarItem.text = `$(eye-enabled)$(lines-icon)`;

		// Update decorations for all visible editors
		vscode.window.visibleTextEditors.forEach((editor) => {
			this.updateDecorations(editor);
		});

		// Subscribe to editor events
		vscode.window.onDidChangeActiveTextEditor(
			this.handleTextEditorChange.bind(this),
		);
		vscode.workspace.onDidChangeTextDocument(
			this.handleDocumentChange.bind(this),
		);

		console.log("Git Line Author activated");
	}

	public deactivate() {
		if (!this.isActive) {
			return;
		}

		this.isActive = false;
		this.statusBarItem.text = `$(eye-disabled)$(lines-icon)`;

		// Clear decorations from all editors
		const decorationType = this.decorationType;
		if (decorationType) {
			vscode.window.visibleTextEditors.forEach((editor) => {
				editor.setDecorations(decorationType, []);
			});
		}

		this.decorations.clear();
		console.log("Git Line Author deactivated");
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
