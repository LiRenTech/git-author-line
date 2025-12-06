# Git Line Author

Git Line Author is a VSCode extension that displays git author information next to line numbers, similar to JetBrains IDEs.

## Features

* **Author Display**: Shows the git author name next to each line number
* **Color Coded**: Background color varies from dark to light blue based on modification time
* **Auto-Adaptive Text**: Text color automatically adjusts to background brightness
* **Toggle Switch**: Easy on/off toggle in the status bar (left side)
* **File-Specific Time Range**: Color gradient is based on the current file's modification history
* **Default Off**: Starts in inactive mode, only activates when explicitly toggled

## Requirements

* Git must be installed and accessible in your PATH
* Works with any Git repository

## Extension Settings

This extension contributes the following commands:

* `git-line-author.toggle`: Toggle the display of git author information

## Usage

1. Open any file in a Git repository
2. The extension starts in inactive mode (status bar shows "GitAuthorLine:Off")
3. Click the status bar item on the left side to toggle display
4. When active, author information will be shown next to line numbers with color-coded backgrounds

## Known Issues

* Currently only displays the author name, not commit message or other details
* May have performance issues with very large files

## Release Notes

### 0.0.1

Initial release of Git Line Author

* Basic author display functionality
* Color coded background based on modification time
* Status bar toggle on the left side
* Auto-adaptive text color
* Default off mode
* File-specific time range for color gradient

---

## 中文说明

Git Line Author 是一个 VSCode 扩展，用于在行号旁显示 Git 作者信息，类似于 JetBrains IDE 的功能。

## 功能特性

* **作者显示**：在行号旁显示每行代码的 Git 作者名称
* **颜色编码**：背景颜色从深蓝到浅蓝渐变，基于修改时间
* **自适应文字**：文字颜色根据背景亮度自动调整（亮背景黑文字，暗背景白文字）
* **切换开关**：状态栏左侧的便捷开关，用于开启/关闭功能
* **文件特定时间范围**：颜色渐变基于当前文件的修改历史
* **默认关闭**：初始处于非激活状态，仅在用户明确切换时激活

## 要求

* 必须安装 Git 并确保可在 PATH 中访问
* 适用于任何 Git 仓库

## 扩展设置

此扩展提供以下命令：

* `git-line-author.toggle`：切换 Git 作者信息的显示

## 使用方法

1. 打开 Git 仓库中的任何文件
2. 扩展初始处于非激活状态（状态栏显示 "GitAuthorLine:Off"）
3. 点击左侧状态栏项切换显示状态
4. 激活时，行号旁会显示作者信息，并带有颜色编码的背景

## 已知问题

* 目前仅显示作者名称，不显示提交信息或其他详情
* 对于非常大的文件可能存在性能问题

## 发布说明

### 0.0.1

Git Line Author 初始版本发布

* 基本作者显示功能
* 基于修改时间的颜色编码背景
* 左侧状态栏切换开关
* 自适应文字颜色
* 默认关闭模式
* 文件特定时间范围的颜色渐变

---

## Following extension guidelines

This extension follows the [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines).

**Enjoy!**

**使用愉快！**