# OpenCode Telegram 通知插件

## TL;DR

> **Quick Summary**: 创建一个 OpenCode 插件，当主 agent 完成任务时，将最后一次回复完整保留格式发送到 Telegram。
> 
> **Deliverables**:
> - OpenCode 插件完整项目 (`src/index.ts`)
> - Telegram-safe HTML 转换器 (`src/formatter.ts`)
> - 智能消息分割器 (`src/splitter.ts`)
> - Telegram 发送模块 (`src/telegram.ts`)
> - 配置管理 (`src/config.ts`)
> - README 文档
> 
> **Estimated Effort**: Medium (4-6 小时)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6

---

## Context

### Original Request
当 OpenCode 主 agent 完成任务时，将 agent 的最后一次回复完整保留格式发送到 Telegram。

### Interview Summary
**Key Discussions**:
- **触发时机**: 监听 `session.idle` 事件
- **消息获取**: 使用 `client.session.messages({ sessionID, limit: 1 })` 获取最后一条消息
- **格式化**: 使用 HTML 模式保留格式，需要 Telegram-safe 转换
- **长消息处理**: 智能分割，每段 ≤4096 字符，标签感知
- **测试策略**: 手动验证（直接在 OpenCode 中加载插件测试）

**Research Findings**:
- OpenCode Plugin SDK: 使用 `@opencode-ai/plugin` 和 `@opencode-ai/sdk`
- Event hook: `event: async ({ event }) => {...}`
- Telegram Bot API: POST /bot{token}/sendMessage, parse_mode: "HTML"
- Telegram HTML 只支持有限标签: `<b>`, `<i>`, `<a>`, `<code>`, `<pre>` 等

### Metis Review
**Identified Gaps** (addressed):
- **Telegram HTML 严格性**: 需要专门的 Telegram-safe HTML 转换器，剥离不支持的标签
- **智能分割复杂性**: 分割逻辑必须是标签感知的，处理未闭合标签
- **配置管理**: 使用环境变量 (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
- **README 说明**: 需要明确说明如何获取 Chat ID

---

## Work Objectives

### Core Objective
创建一个健壮的 OpenCode 插件，监听任务完成事件，将 Agent 回复安全地格式化并发送到 Telegram。

### Concrete Deliverables
- `/root/Projects/Ling/OpenCodeNotify/src/index.ts` - 插件入口
- `/root/Projects/Ling/OpenCodeNotify/src/formatter.ts` - Markdown → Telegram HTML 转换器
- `/root/Projects/Ling/OpenCodeNotify/src/splitter.ts` - 智能消息分割器
- `/root/Projects/Ling/OpenCodeNotify/src/telegram.ts` - Telegram API 封装
- `/root/Projects/Ling/OpenCodeNotify/src/config.ts` - 配置管理
- `/root/Projects/Ling/OpenCodeNotify/README.md` - 使用文档
- `/root/Projects/Ling/OpenCodeNotify/package.json` - 项目配置

### Definition of Done
- [ ] 插件可以被 OpenCode 正确加载
- [ ] 当 Agent 完成任务时，消息成功发送到 Telegram
- [ ] 长消息正确分割，每段都是合法的 HTML
- [ ] 代码块和格式在 Telegram 中正确显示

### Must Have
- 监听 `session.idle` 事件
- 获取 Agent 最后一条 AssistantMessage
- Telegram-safe HTML 转换 (支持: `<b>`, `<i>`, `<code>`, `<pre>`, `<a>`)
- 智能分割超长消息 (≤4096 字符)
- 标签感知分割 (处理未闭合标签)
- 环境变量配置 (BOT_TOKEN, CHAT_ID)
- 错误处理和重试机制 (429 速率限制)

### Must NOT Have (Guardrails)
- ❌ 不使用通用 Markdown-to-HTML 库而不做后处理
- ❌ 不实现 Telegram Bot 交互命令
- ❌ 不实现消息历史存储
- ❌ 不实现多用户支持
- ❌ 不在代码块中间粗暴截断 (必须标签感知)
- ❌ 不生成 `<h1>`, `<ul>`, `<li>`, `<p>` 等 Telegram 不支持的标签

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (新项目)
- **User wants tests**: Manual verification
- **Framework**: None (手动测试)

### Manual Verification Procedure

**Agent-Executable Verification:**

1. **插件加载验证**:
   ```bash
   # 在 OpenCode 配置中添加插件后
   # 启动 OpenCode，检查控制台是否有错误
   opencode
   # 预期: 无插件加载错误
   ```

2. **消息发送验证**:
   ```bash
   # 让 Agent 执行一个简单任务后等待 idle
   # 检查 Telegram 是否收到消息
   # 预期: Telegram 收到格式正确的消息
   ```

3. **格式化验证**:
   ```bash
   # 让 Agent 输出包含代码块的回复
   # 检查 Telegram 中代码块是否正确显示
   # 预期: 代码块有语法高亮背景
   ```

4. **长消息分割验证**:
   ```bash
   # 让 Agent 输出超过 4096 字符的回复
   # 检查是否分割为多条消息
   # 预期: 收到多条消息，每条都格式正确
   ```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: 初始化项目结构
└── (无其他并行任务，需要先建立基础)

Wave 2 (After Task 1):
├── Task 2: 实现配置管理
├── Task 3: 实现 Telegram API 封装
└── Task 4: 实现格式转换器

Wave 3 (After Wave 2):
└── Task 5: 实现消息分割器 (依赖 Task 4)

Wave 4 (After Wave 3):
└── Task 6: 实现插件主逻辑 (依赖所有前置任务)

Wave 5 (After Wave 4):
└── Task 7: 编写 README 文档

Critical Path: Task 1 → Task 2 → Task 6 → Task 7
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4 | None (first) |
| 2 | 1 | 6 | 3, 4 |
| 3 | 1 | 6 | 2, 4 |
| 4 | 1 | 5, 6 | 2, 3 |
| 5 | 4 | 6 | None |
| 6 | 2, 3, 4, 5 | 7 | None |
| 7 | 6 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | delegate_task(category="quick", load_skills=[], run_in_background=false) |
| 2 | 2, 3, 4 | dispatch parallel with run_in_background=true |
| 3 | 5 | delegate_task(category="unspecified-low", load_skills=[], run_in_background=false) |
| 4 | 6 | delegate_task(category="unspecified-high", load_skills=[], run_in_background=false) |
| 5 | 7 | delegate_task(category="writing", load_skills=[], run_in_background=false) |

---

## TODOs

- [x] 1. 初始化项目结构

  **What to do**:
  - 创建 `package.json` 配置文件
  - 配置 TypeScript (`tsconfig.json`)
  - 安装依赖: `@opencode-ai/plugin`, `@opencode-ai/sdk`
  - 创建 `src/` 目录结构
  - 创建 `.env.example` 文件

  **Must NOT do**:
  - 不安装 Telegram 第三方库 (使用原生 fetch)
  - 不创建复杂的构建流程

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的项目初始化任务，涉及创建文件和安装依赖
  - **Skills**: `[]`
    - 不需要特殊技能，标准开发任务

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7
  - **Blocked By**: None (first task)

  **References**:

  **Pattern References**:
  - 无 (新项目)

  **External References**:
  - OpenCode Plugin SDK: `@opencode-ai/plugin` 包
  - Bun 项目初始化: `bun init`

  **Acceptance Criteria**:

  ```bash
  # 验证 package.json 存在且包含正确依赖
  cat /root/Projects/Ling/OpenCodeNotify/package.json | grep "@opencode-ai/plugin"
  # 预期: 输出包含 "@opencode-ai/plugin"

  # 验证 tsconfig.json 存在
  test -f /root/Projects/Ling/OpenCodeNotify/tsconfig.json && echo "EXISTS"
  # 预期: EXISTS

  # 验证 src 目录结构
  ls /root/Projects/Ling/OpenCodeNotify/src/
  # 预期: 显示 index.ts 等文件 (可能为空模板)

  # 验证依赖安装
  test -d /root/Projects/Ling/OpenCodeNotify/node_modules/@opencode-ai && echo "INSTALLED"
  # 预期: INSTALLED
  ```

  **Commit**: YES
  - Message: `:tada: feat: [init] 初始化 OpenCode Telegram 通知插件项目`
  - Files: `package.json`, `tsconfig.json`, `src/`, `.env.example`, `.gitignore`
  - Pre-commit: N/A

---

- [x] 2. 实现配置管理模块

  **What to do**:
  - 创建 `src/config.ts`
  - 从环境变量读取配置: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
  - 实现配置验证 (必填项检查)
  - 导出类型安全的配置对象

  **Must NOT do**:
  - 不硬编码任何敏感信息
  - 不实现复杂的配置文件解析

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的配置读取逻辑
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - Bun 环境变量: `process.env.VARIABLE_NAME` 或 `Bun.env.VARIABLE_NAME`

  **Acceptance Criteria**:

  ```bash
  # 验证文件存在
  test -f /root/Projects/Ling/OpenCodeNotify/src/config.ts && echo "EXISTS"
  # 预期: EXISTS

  # 验证导出 getConfig 函数
  grep -E "export.*(getConfig|config)" /root/Projects/Ling/OpenCodeNotify/src/config.ts
  # 预期: 匹配到导出语句

  # 验证环境变量读取
  grep "TELEGRAM_BOT_TOKEN" /root/Projects/Ling/OpenCodeNotify/src/config.ts
  # 预期: 匹配到环境变量名
  ```

  **Commit**: YES (groups with 3, 4)
  - Message: `:wrench: feat: [config] 实现配置管理模块`
  - Files: `src/config.ts`
  - Pre-commit: `bun run typecheck` (如果配置了)

---

- [x] 3. 实现 Telegram API 封装

  **What to do**:
  - 创建 `src/telegram.ts`
  - 实现 `sendMessage(text: string, parseMode?: string)` 函数
  - 使用原生 `fetch` 调用 Telegram Bot API
  - 实现错误处理 (429 速率限制重试)
  - 实现批量发送 (用于分割后的多条消息)

  **Must NOT do**:
  - 不使用第三方 Telegram 库
  - 不实现轮询或 webhook

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的 HTTP API 调用封装
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1

  **References**:

  **External References**:
  - Telegram Bot API sendMessage: `https://core.telegram.org/bots/api#sendmessage`
  - API Endpoint: `https://api.telegram.org/bot{token}/sendMessage`

  **WHY Each Reference Matters**:
  - sendMessage API 文档包含所有参数说明，特别是 `parse_mode` 和错误码

  **Acceptance Criteria**:

  ```bash
  # 验证文件存在
  test -f /root/Projects/Ling/OpenCodeNotify/src/telegram.ts && echo "EXISTS"
  # 预期: EXISTS

  # 验证 sendMessage 函数导出
  grep -E "export.*sendMessage" /root/Projects/Ling/OpenCodeNotify/src/telegram.ts
  # 预期: 匹配到导出语句

  # 验证使用正确的 API endpoint
  grep "api.telegram.org" /root/Projects/Ling/OpenCodeNotify/src/telegram.ts
  # 预期: 匹配到 API 地址

  # 验证 parse_mode 参数
  grep "parse_mode" /root/Projects/Ling/OpenCodeNotify/src/telegram.ts
  # 预期: 匹配到 parse_mode
  ```

  **Commit**: YES (groups with 2, 4)
  - Message: `:sparkles: feat: [telegram] 实现 Telegram Bot API 封装`
  - Files: `src/telegram.ts`
  - Pre-commit: `bun run typecheck`

---

- [x] 4. 实现 Markdown 到 Telegram HTML 格式转换器

  **What to do**:
  - 创建 `src/formatter.ts`
  - 实现 `formatForTelegram(markdown: string): string` 函数
  - 转换规则:
    - `**bold**` 或 `__bold__` → `<b>bold</b>`
    - `*italic*` 或 `_italic_` → `<i>italic</i>`
    - `` `code` `` → `<code>code</code>`
    - ` ```lang\ncode\n``` ` → `<pre><code class="language-lang">code</code></pre>`
    - `[text](url)` → `<a href="url">text</a>`
    - `# heading` → `<b>heading</b>` (不用 h1)
    - `- list item` → `• list item` (不用 ul/li)
  - 转义特殊字符: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;` (在非标签位置)
  - 剥离所有不支持的 HTML 标签

  **Must NOT do**:
  - 不生成 `<h1>`, `<h2>`, `<ul>`, `<li>`, `<p>` 等 Telegram 不支持的标签
  - 不使用通用 Markdown 库而不做后处理

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 需要仔细处理多种 Markdown 语法，但逻辑不复杂
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: Task 1

  **References**:

  **External References**:
  - Telegram HTML 格式支持: `https://core.telegram.org/bots/api#html-style`
  - 支持的标签列表: `<b>`, `<strong>`, `<i>`, `<em>`, `<u>`, `<ins>`, `<s>`, `<strike>`, `<del>`, `<span class="tg-spoiler">`, `<a href="">`, `<code>`, `<pre>`, `<pre><code class="language-xxx">`

  **WHY Each Reference Matters**:
  - 这个文档明确列出了 Telegram 支持的所有 HTML 标签，是实现转换器的关键参考

  **Acceptance Criteria**:

  ```bash
  # 验证文件存在
  test -f /root/Projects/Ling/OpenCodeNotify/src/formatter.ts && echo "EXISTS"
  # 预期: EXISTS

  # 验证导出 formatForTelegram 函数
  grep -E "export.*formatForTelegram" /root/Projects/Ling/OpenCodeNotify/src/formatter.ts
  # 预期: 匹配到导出语句

  # 验证不生成不支持的标签
  ! grep -E "<(h[1-6]|ul|ol|li|p|div|span[^>]*tg-spoiler)" /root/Projects/Ling/OpenCodeNotify/src/formatter.ts
  # 预期: 无输出 (不包含这些标签的生成逻辑)

  # 验证基本转换逻辑
  bun -e "import { formatForTelegram } from './src/formatter'; console.log(formatForTelegram('**bold**'))"
  # 预期: <b>bold</b>
  ```

  **Commit**: YES (groups with 2, 3)
  - Message: `:art: feat: [formatter] 实现 Telegram-safe Markdown 转换器`
  - Files: `src/formatter.ts`
  - Pre-commit: `bun run typecheck`

---

- [x] 5. 实现智能消息分割器

  **What to do**:
  - 创建 `src/splitter.ts`
  - 实现 `splitMessage(html: string, maxLength?: number): string[]` 函数
  - 默认 maxLength = 4000 (留 96 字符缓冲)
  - 分割优先级:
    1. 在段落边界 (`\n\n`) 分割
    2. 在换行符 (`\n`) 分割
    3. 在句号 (`. ` 或 `。`) 分割
    4. 在空格处分割
  - **关键**: 实现标签感知分割
    - 如果在 `<pre><code>` 块中分割，第一段结尾补 `</code></pre>`，第二段开头补 `<pre><code>`
    - 追踪打开的标签栈，分割时正确闭合/重开

  **Must NOT do**:
  - 不在代码块中间粗暴截断而不处理标签
  - 不生成未闭合的 HTML 标签

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 需要实现标签追踪逻辑，有一定复杂度
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (solo)
  - **Blocks**: Task 6
  - **Blocked By**: Task 4 (需要了解格式化输出的结构)

  **References**:

  **Pattern References**:
  - Task 4 的输出格式 (`src/formatter.ts`) - 需要了解会生成哪些标签

  **WHY Each Reference Matters**:
  - 分割器需要知道格式化器会产生哪些标签，才能正确追踪和闭合

  **Acceptance Criteria**:

  ```bash
  # 验证文件存在
  test -f /root/Projects/Ling/OpenCodeNotify/src/splitter.ts && echo "EXISTS"
  # 预期: EXISTS

  # 验证导出 splitMessage 函数
  grep -E "export.*splitMessage" /root/Projects/Ling/OpenCodeNotify/src/splitter.ts
  # 预期: 匹配到导出语句

  # 验证分割逻辑 - 短消息不分割
  bun -e "import { splitMessage } from './src/splitter'; console.log(splitMessage('hello').length)"
  # 预期: 1

  # 验证分割逻辑 - 长消息分割
  bun -e "import { splitMessage } from './src/splitter'; const long = 'a'.repeat(5000); console.log(splitMessage(long).length > 1)"
  # 预期: true

  # 验证每段都不超过限制
  bun -e "import { splitMessage } from './src/splitter'; const long = 'a '.repeat(3000); const parts = splitMessage(long); console.log(parts.every(p => p.length <= 4000))"
  # 预期: true
  ```

  **Commit**: YES
  - Message: `:scissors: feat: [splitter] 实现标签感知的智能消息分割器`
  - Files: `src/splitter.ts`
  - Pre-commit: `bun run typecheck`

---

- [x] 6. 实现插件主逻辑

  **What to do**:
  - 创建 `src/index.ts` 作为插件入口
  - 实现 OpenCode Plugin 接口
  - 监听 `session.idle` 事件
  - 获取最后一条 AssistantMessage: `ctx.client.session.messages({ sessionID, limit: 1 })`
  - 提取 TextPart 内容
  - 调用格式化器转换为 Telegram HTML
  - 调用分割器处理超长消息
  - 调用 Telegram 模块发送消息
  - 实现错误处理和日志

  **Must NOT do**:
  - 不在获取消息时获取非 AssistantMessage
  - 不发送空消息

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 这是核心集成任务，需要正确组合所有模块
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (solo)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 2, 3, 4, 5 (依赖所有模块)

  **References**:

  **Pattern References**:
  - `src/config.ts` - 配置获取方式
  - `src/telegram.ts` - 发送消息接口
  - `src/formatter.ts` - 格式化接口
  - `src/splitter.ts` - 分割接口

  **API/Type References**:
  - OpenCode Plugin SDK: `@opencode-ai/plugin` 的 Plugin 函数签名
  - MessageV2.WithParts 类型结构

  **External References**:
  - OpenCode Plugin 文档 (如果有)

  **WHY Each Reference Matters**:
  - 需要正确使用 OpenCode SDK 的 event hook 和 session API
  - 需要正确组合前面实现的所有模块

  **Acceptance Criteria**:

  ```bash
  # 验证文件存在
  test -f /root/Projects/Ling/OpenCodeNotify/src/index.ts && echo "EXISTS"
  # 预期: EXISTS

  # 验证导出 Plugin 函数
  grep -E "export.*Plugin|export default" /root/Projects/Ling/OpenCodeNotify/src/index.ts
  # 预期: 匹配到导出语句

  # 验证监听 session.idle 事件
  grep "session.idle" /root/Projects/Ling/OpenCodeNotify/src/index.ts
  # 预期: 匹配到事件名

  # 验证调用 session.messages
  grep "session.messages" /root/Projects/Ling/OpenCodeNotify/src/index.ts
  # 预期: 匹配到 API 调用

  # 验证 TypeScript 编译通过
  cd /root/Projects/Ling/OpenCodeNotify && bun run typecheck
  # 预期: 无错误
  ```

  **Commit**: YES
  - Message: `:zap: feat: [plugin] 实现 OpenCode 插件主逻辑`
  - Files: `src/index.ts`
  - Pre-commit: `bun run typecheck`

---

- [x] 7. 编写 README 文档

  **What to do**:
  - 创建/更新 `README.md`
  - 包含内容:
    - 项目简介
    - 功能说明
    - 安装步骤
    - 配置说明 (环境变量)
    - **如何获取 Telegram Chat ID** (详细步骤)
    - **如何创建 Telegram Bot** (详细步骤)
    - 如何在 OpenCode 中配置插件
    - 使用示例
    - 常见问题

  **Must NOT do**:
  - 不遗漏 Chat ID 获取步骤 (用户最常困惑的点)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 文档编写任务
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final)
  - **Blocks**: None
  - **Blocked By**: Task 6 (需要知道完整的使用方式)

  **References**:

  **Pattern References**:
  - `.env.example` - 需要文档化的环境变量
  - `src/config.ts` - 配置项说明

  **External References**:
  - Telegram BotFather: `https://t.me/BotFather` - 创建 Bot 的官方工具
  - 获取 Chat ID 方法: 使用 `https://api.telegram.org/bot{token}/getUpdates`

  **WHY Each Reference Matters**:
  - 用户需要知道如何创建 Bot 和获取 Chat ID 才能使用插件

  **Acceptance Criteria**:

  ```bash
  # 验证 README 存在
  test -f /root/Projects/Ling/OpenCodeNotify/README.md && echo "EXISTS"
  # 预期: EXISTS

  # 验证包含 Chat ID 获取说明
  grep -i "chat.*id" /root/Projects/Ling/OpenCodeNotify/README.md
  # 预期: 匹配到 Chat ID 相关内容

  # 验证包含 BotFather 说明
  grep -i "botfather" /root/Projects/Ling/OpenCodeNotify/README.md
  # 预期: 匹配到 BotFather

  # 验证包含环境变量说明
  grep "TELEGRAM_BOT_TOKEN" /root/Projects/Ling/OpenCodeNotify/README.md
  # 预期: 匹配到环境变量名
  ```

  **Commit**: YES
  - Message: `:memo: docs: 编写 README 使用文档`
  - Files: `README.md`
  - Pre-commit: N/A

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `:tada: feat: [init] 初始化项目` | package.json, tsconfig.json, src/, .env.example | bun install |
| 2, 3, 4 | `:sparkles: feat: [core] 实现核心模块` | src/config.ts, src/telegram.ts, src/formatter.ts | bun run typecheck |
| 5 | `:scissors: feat: [splitter] 实现消息分割器` | src/splitter.ts | bun run typecheck |
| 6 | `:zap: feat: [plugin] 实现插件主逻辑` | src/index.ts | bun run typecheck |
| 7 | `:memo: docs: 编写 README` | README.md | N/A |

---

## Success Criteria

### Verification Commands
```bash
# 1. TypeScript 编译通过
cd /root/Projects/Ling/OpenCodeNotify && bun run typecheck
# Expected: 无错误

# 2. 依赖安装完整
test -d /root/Projects/Ling/OpenCodeNotify/node_modules/@opencode-ai && echo "OK"
# Expected: OK

# 3. 所有源文件存在
ls /root/Projects/Ling/OpenCodeNotify/src/*.ts
# Expected: index.ts, config.ts, telegram.ts, formatter.ts, splitter.ts
```

### Final Checklist
- [ ] 所有 "Must Have" 功能已实现
- [ ] 所有 "Must NOT Have" 限制已遵守
- [ ] TypeScript 编译无错误
- [ ] README 文档完整
- [ ] 可以被 OpenCode 正确加载
- [ ] 消息成功发送到 Telegram
