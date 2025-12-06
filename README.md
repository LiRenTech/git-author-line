# Git Line Author

Git Line Author is a VSCode extension that displays git author information next to line numbers, similar to JetBrains IDEs.

## Features

* **Author Display**: Shows the git author name next to each line number
* **Date Format**: Displays simplified date format (YY/MM/DD) before the author name
* **Color Coded**: Background color varies from dark to light based on modification time
* **Auto-Adaptive Text**: Text color automatically adjusts to background brightness
* **Toggle Switch**: Easy on/off toggle in the status bar (left side)
* **File-Specific Time Range**: Color gradient is based on the current file's modification history
* **Default Off**: Starts in inactive mode, only activates when explicitly toggled
* **Customizable Colors**: User-configurable regex patterns with associated hue values for color coding
* **Gray Scale for Unmatched**: Uses grayscale color transition (dark to light) for commits that don't match any regex pattern

## Requirements

* Git must be installed and accessible in your PATH
* Works with any Git repository

## Extension Settings

This extension contributes the following commands:

* `git-line-author.toggle`: Toggle the display of git author information

This extension contributes the following settings:

* `gitLineAuthor.colorConfigs`: Array of regex patterns with associated hue values (0-360) for color coding commit messages

### Default Configuration

```json
[
  {
    "regex": "^feat:",
    "hue": 0
  },
  {
    "regex": "^fix:",
    "hue": 60
  },
  {
    "regex": "^docs:",
    "hue": 120
  },
  {
    "regex": "^refactor:",
    "hue": 240
  },
  {
    "regex": "^test:",
    "hue": 300
  }
]
```

### Color Design Philosophy

Each default color configuration has a thoughtful design behind it:

* **Blue**: Blue is VSCode's symbolic color, representing default commits. It also symbolizes innovation and the future, making it suitable for feature additions.
* **Red**: Red symbolizes danger, making it appropriate for bug fix commits.
* **Green**: Green is traditionally used for comments in code and represents safety. Documentation changes are safe and non-intrusive, much like comments.
* **Yellow**: Yellow is a bright cautionary color that alerts other developers that this code has been refactored, making it suitable for refactor commits.
* **Purple**: Purple evokes mystery and exploration, reflecting the experimental and investigative nature of testing new functionality, making it appropriate for test commits.

---

### 默认配置设计理念

每个默认颜色配置都有其精心设计的理念：

* **蓝色**: 蓝色是VSCode的标志性颜色，代表默认提交，同时蓝色也有创新和未来的含义，所以作为feat提交
* **红色**: 红色象征危险，所以作为fix的bug修复提交。
* **绿色**: 绿色传统上用于代码中的注释，代表安全。文档更改是安全且非侵入性的，就像注释一样。
* **黄色**: 黄色是一种亮眼的警示色，用于提醒其他开发者注意这段代码是被重构了的。所以作为refactor提交。
* **紫色**: 紫色唤起神秘和探索感，反映了测试新功能的实验性和调查性本质。所以作为test提交。

## Usage

1. Open any file in a Git repository
2. The extension starts in inactive mode (status bar shows "GitAuthorLine:Off")
3. Click the status bar item on the left side to toggle display
4. When active, author information with date will be shown next to line numbers with color-coded backgrounds
5. Customize color configurations in VSCode settings under "Git Line Author"

## Known Issues

* Currently only displays the author name and date, not full commit message
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
* Simplified date format (YY/MM/DD)
* Customizable regex-based color configuration

---

## 中文说明

Git Line Author 是一个 VSCode 扩展，用于在行号旁显示 Git 作者信息，类似于 JetBrains IDE 的功能。

## 功能特性

* **作者显示**：在行号旁显示每行代码的 Git 作者名称
* **日期格式**：在作者名称前显示简化的日期格式（YY/MM/DD）
* **颜色编码**：背景颜色从深到浅渐变，基于修改时间
* **自适应文字**：文字颜色根据背景亮度自动调整（亮背景黑文字，暗背景白文字）
* **切换开关**：状态栏左侧的便捷开关，用于开启/关闭功能
* **文件特定时间范围**：颜色渐变基于当前文件的修改历史
* **默认关闭**：初始处于非激活状态，仅在用户明确切换时激活
* **可自定义颜色**：用户可配置的正则表达式模式，带有关联的色相值用于颜色编码
* **未匹配的灰度显示**：对于不匹配任何正则表达式的提交，使用灰度颜色过渡（从深到浅）

## 要求

* 必须安装 Git 并确保可在 PATH 中访问
* 适用于任何 Git 仓库

## 扩展设置

此扩展提供以下命令：

* `git-line-author.toggle`：切换 Git 作者信息的显示

此扩展提供以下设置：

* `gitLineAuthor.colorConfigs`：用于颜色编码提交消息的正则表达式模式数组，带有关联的色相值（0-360）

### 默认配置

```json
[
  {
    "regex": "^feat:",
    "hue": 0
  },
  {
    "regex": "^fix:",
    "hue": 60
  },
  {
    "regex": "^docs:",
    "hue": 120
  },
  {
    "regex": "^refactor:",
    "hue": 240
  },
  {
    "regex": "^test:",
    "hue": 300
  }
]
```

## 使用方法

1. 打开 Git 仓库中的任何文件
2. 扩展初始处于非激活状态（状态栏显示 "GitAuthorLine:Off"）
3. 点击左侧状态栏项切换显示状态
4. 激活时，行号旁会显示带有日期的作者信息，并带有颜色编码的背景
5. 在 VSCode 设置的 "Git Line Author" 下自定义颜色配置

## 已知问题

* 目前仅显示作者名称和日期，不显示完整提交信息
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
* 简化的日期格式（YY/MM/DD）
* 基于正则表达式的可自定义颜色配置

---

## Following extension guidelines

This extension follows the [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines).

**Enjoy!**

**使用愉快！**