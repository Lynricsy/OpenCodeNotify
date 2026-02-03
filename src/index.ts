/**
 * OpenCode Telegram 通知插件
 * 当 session 进入 idle 状态时，发送最后一条 Assistant 消息到 Telegram
 */
import type { Plugin } from "@opencode-ai/plugin";
import type { EventSessionIdle, Part, TextPart } from "@opencode-ai/sdk";
import { getConfig } from "./config";
import { escapeHtml, formatForTelegram } from "./formatter";
import { splitMessage } from "./splitter";
import { sendMessages } from "./telegram";

function extractTextContent(parts: Part[]): string {
  return parts
    .filter((part): part is TextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export const plugin: Plugin = async (ctx) => {
  // 插件在 TUI 场景下不应输出任何日志：配置异常时直接禁用。
  let enabled = true;
  try {
    getConfig();
  } catch {
    enabled = false;
  }

  return {
    event: async ({ event }) => {
      if (!enabled) {
        return;
      }
      if (event.type !== "session.idle") {
        return;
      }

      try {
        const { sessionID } = (event as EventSessionIdle).properties;

        // 子 agent 会创建子 session，结束时也会触发 session.idle。
        // 为避免将子 session 的结束消息误发到 Telegram，这里仅处理根 session。
        const { data: session, error: sessionError } = await ctx.client.session.get({
          path: { id: sessionID },
        });

        if (sessionError || !session) {
          return;
        }

        if (session.parentID) {
          return;
        }

        const { data: messages, error } = await ctx.client.session.messages({
          path: { id: sessionID },
          query: { limit: 10 },
        });

        if (error || !messages) return;

        const lastAssistantMessage = [...messages]
          .reverse()
          .find((msg) => msg.info.role === "assistant");

        if (!lastAssistantMessage) return;

        const textContent = extractTextContent(lastAssistantMessage.parts);

        if (!textContent.trim()) return;

        const now = new Date();
        const timeStr = now.toLocaleString("zh-CN", {
          timeZone: "Asia/Shanghai",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const htmlContent = formatForTelegram(textContent);
        const contentParts = splitMessage(htmlContent);
        const totalPages = contentParts.length;

        const messagesWithHeaders = contentParts.map((content, index) => {
          const pageInfo = totalPages > 1 ? ` (${index + 1}/${totalPages})` : "";
          const headerLines = [
            `📋 <b>${escapeHtml(session.title || "未命名会话")}</b>${pageInfo}`,
            `📁 <code>${escapeHtml(session.directory)}</code>`,
            `🕐 ${escapeHtml(timeStr)}`,
            "",
            "───────────────",
            "",
          ];
          return headerLines.join("\n") + content;
        });

        await sendMessages(messagesWithHeaders, "HTML");

      } catch {
        // 避免污染 TUI：吞掉异常即可
      }
    },
  };
};

export default plugin;
