# Git Line Author README

Git Line Author is a VSCode extension that displays git author information next to line numbers, similar to JetBrains IDEs.

## Features

* **Author Display**: Shows the git author name next to each line number
* **Color Coded**: Background color varies from dark to light blue based on modification time
* **Auto-Adaptive Text**: Text color automatically adjusts to background brightness
* **Toggle Switch**: Easy on/off toggle in the status bar
* **File-Specific Time Range**: Color gradient is based on the current file's modification history

## Requirements

* Git must be installed and accessible in your PATH
* Works with any Git repository

## Extension Settings

This extension contributes the following commands:

* `git-line-author.toggle`: Toggle the display of git author information

## Usage

1. Open any file in a Git repository
2. The extension will automatically display author information next to line numbers
3. Click the status bar item ("$(eye) Git Author: On/Off") to toggle display

## Known Issues

* Currently only displays the author name, not commit message or other details
* May have performance issues with very large files

## Release Notes

### 0.0.1

Initial release of Git Line Author

* Basic author display functionality
* Color coded background based on modification time
* Status bar toggle
* Auto-adaptive text color

---

## Following extension guidelines

This extension follows the [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines).

**Enjoy!**