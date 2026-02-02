# Learnings

## 2026-02-02 Session Start
- Project: OpenCode Telegram 通知插件
- Goal: 监听 session.idle 事件，将 Agent 回复发送到 Telegram
- Tech Stack: TypeScript + Bun + @opencode-ai/plugin SDK
- Telegram 格式: HTML 模式 (支持: <b>, <i>, <code>, <pre>, <a>)
- 消息限制: 4096 字符，需要智能分割
