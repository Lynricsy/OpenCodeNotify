# OpenCode Telegram 通知插件 🔔

一个为 [OpenCode](https://github.com/opencode-ai/opencode) 设计的 Telegram 通知插件，当 AI Agent 完成任务并进入空闲状态时，自动将最后一条回复发送到你的 Telegram。

## 功能特性 ✨

- 🎯 **智能监听** - 监听 Agent 会话进入 `idle` 状态的事件
- ✅ **过滤子 session** - 仅处理根 session，避免子 agent 结束消息误通知
- ✅ **静默运行** - 不输出日志，避免占用/污染 TUI 输入框
- 📝 **格式化消息** - 支持 Markdown 转 Telegram HTML（代码块、粗体、斜体等）
- ✂️ **智能分割** - 超长消息自动分割，保持代码块完整性
- 📱 **即时推送** - 通过 Telegram Bot API 实时发送通知

## 安装 📦

### 前置要求

- [Bun](https://bun.sh/) 运行时环境
- [OpenCode](https://github.com/opencode-ai/opencode) CLI 工具
- Telegram 账号

### 1. 创建 Telegram Bot 🤖

1. 在 Telegram 中搜索 **@BotFather** 并打开对话
2. 发送 `/newbot` 命令
3. 按提示输入你的 Bot **显示名称**（可以是任意名称，如 `My OpenCode Notifier`）
4. 按提示输入你的 Bot **用户名**（必须以 `bot` 结尾，如 `my_opencode_notify_bot`）
5. 创建成功后，BotFather 会返回一个 **Token**，格式类似：
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
6. **请妥善保存这个 Token**，后面会用到

### 2. 获取 Chat ID 🔑

> ⚠️ **这是最关键的一步！** 很多人在这里卡住。

Chat ID 是你与 Bot 对话的唯一标识符。获取步骤：

#### 方法一：使用 getUpdates API（推荐）

1. **先与你的 Bot 开始对话**
   - 在 Telegram 中搜索你刚创建的 Bot（使用你设置的用户名）
   - 点击 `开始` 或发送任意消息（如 `/start` 或 `hello`）

2. **访问 getUpdates API**
   
   在浏览器中打开以下链接（替换 `<YOUR_TOKEN>` 为你的 Bot Token）：
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
   
   例如：
   ```
   https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/getUpdates
   ```

3. **找到你的 Chat ID**
   
   你会看到类似这样的 JSON 响应：
   ```json
   {
     "ok": true,
     "result": [
       {
         "update_id": 123456789,
         "message": {
           "message_id": 1,
           "from": {
             "id": 987654321,
             "first_name": "Your Name"
           },
           "chat": {
             "id": 987654321,
             "first_name": "Your Name",
             "type": "private"
           },
           "text": "/start"
         }
       }
     ]
   }
   ```
   
   其中 `"chat": {"id": 987654321}` 中的 **987654321** 就是你的 Chat ID！

#### 方法二：使用 @userinfobot

1. 在 Telegram 中搜索 **@userinfobot**
2. 点击 `开始` 或发送任意消息
3. 它会直接回复你的 User ID（对于私聊，这也是你的 Chat ID）

#### 群组 Chat ID

如果你想发送到群组：
1. 将 Bot 添加到群组
2. 在群组中发送一条消息
3. 使用上述 getUpdates API 方法获取群组的 Chat ID
4. 群组的 Chat ID 通常是**负数**，如 `-1001234567890`

### 3. 配置插件 ⚙️

创建配置文件 `~/.config/opencode/opencode-notify.json`：

```bash
mkdir -p ~/.config/opencode
```

创建并编辑配置文件：

```json
{
  "telegram_bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
  "telegram_chat_id": "987654321"
}
```

> 📁 **配置文件路径**: `~/.config/opencode/opencode-notify.json`

### 4. 在 OpenCode 中启用插件 🚀

#### 方式一：配置文件（推荐）

编辑 OpenCode 配置文件（通常在 `~/.config/opencode/config.json`）：

```json
{
  "plugins": [
    "/path/to/OpenCodeNotify"
  ]
}
```

#### 方式二：环境变量

```bash
export OPENCODE_PLUGINS="/path/to/OpenCodeNotify"
```

你也可以将其添加到 shell 配置文件（如 `~/.bashrc` 或 `~/.zshrc`）中。

## 配置说明 📋

配置文件路径：`~/.config/opencode/opencode-notify.json`

| 配置项 | 必填 | 说明 |
|--------|------|------|
| `telegram_bot_token` | ✅ 是 | 从 @BotFather 获取的 Bot Token |
| `telegram_chat_id` | ✅ 是 | 目标聊天的 ID（用户 ID 或群组 ID） |

**配置文件示例：**

```json
{
  "telegram_bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
  "telegram_chat_id": "987654321"
}
```

## 工作原理 🔧

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode Agent 运行中                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                 ┌──────────────────┐
                 │ session.idle 事件 │
                 └──────────────────┘
                            │
                            ▼
              ┌───────────────────────┐
              │ 获取最后一条 Assistant 消息 │
              └───────────────────────┘
                            │
                            ▼
              ┌───────────────────────┐
              │  Markdown → HTML 转换   │
              └───────────────────────┘
                            │
                            ▼
              ┌───────────────────────┐
              │   智能分割超长消息       │
              └───────────────────────┘
                            │
                            ▼
              ┌───────────────────────┐
              │  发送到 Telegram Bot API │
              └───────────────────────┘
```

1. **事件监听**：插件监听 OpenCode 的 `session.idle` 事件
2. **消息获取**：当 Agent 进入空闲状态时，获取会话中最后一条 Assistant 消息
3. **格式转换**：将 Markdown 格式转换为 Telegram 支持的 HTML 格式
4. **智能分割**：如果消息过长，自动分割成多条消息发送（保持代码块完整）
5. **推送通知**：通过 Telegram Bot API 发送到指定的 Chat ID

## 项目结构 📁

```
OpenCodeNotify/
├── src/
│   ├── index.ts      # 插件入口，事件监听
│   ├── config.ts     # 配置读取与验证
│   ├── formatter.ts  # Markdown → HTML 格式转换
│   ├── splitter.ts   # 智能消息分割
│   └── telegram.ts   # Telegram API 调用
├── package.json
├── tsconfig.json
└── README.md
```

## 常见问题 ❓

### Q: 为什么收不到通知？

1. **检查 Bot Token**：确保 Token 正确，没有多余的空格
2. **检查 Chat ID**：确保 Chat ID 正确（注意群组是负数）
3. **确认已与 Bot 对话**：必须先向 Bot 发送过消息，Bot 才能给你发消息
4. **检查 OpenCode 日志**：查看是否有错误输出

### Q: getUpdates 返回空数组 `{"ok": true, "result": []}`？

这说明 Bot 没有收到任何消息。请确保：
1. 你已经在 Telegram 中找到并打开了你的 Bot
2. 你向 Bot 发送了消息（如 `/start`）
3. 然后再访问 getUpdates API

### Q: 如何测试 Bot 是否工作？

你可以使用 curl 手动发送测试消息：

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "<YOUR_CHAT_ID>", "text": "测试消息 🎉"}'
```

### Q: 支持群组通知吗？

支持！只需：
1. 将 Bot 添加到目标群组
2. 在群组中发送一条消息
3. 通过 getUpdates 获取群组的 Chat ID（负数）
4. 将群组 Chat ID 配置到 `telegram_chat_id`

## 许可证 📄

MIT License

---

Made with 💜 for the OpenCode community
