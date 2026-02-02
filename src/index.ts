/**
 * OpenCode Telegram 通知插件
 * 当 session 进入 idle 状态时，发送最后一条 Assistant 消息到 Telegram
 */
import type { Plugin } from "@opencode-ai/plugin";
import type { EventSessionIdle, Part, TextPart } from "@opencode-ai/sdk";
import { getConfig } from "./config";
import { formatForTelegram } from "./formatter";
import { splitMessage } from "./splitter";
import { sendMessages } from "./telegram";

function extractTextContent(parts: Part[]): string {
  return parts
    .filter((part): part is TextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export const plugin: Plugin = async (ctx) => {
  try {
    getConfig();
    console.log("🔔 OpenCode Telegram 通知插件已加载");
  } catch (error) {
    console.error("⚠️ OpenCode Telegram 通知插件配置错误:", error);
  }

  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") {
        return;
      }

      try {
        const { sessionID } = (event as EventSessionIdle).properties;

        const { data: messages, error } = await ctx.client.session.messages({
          path: { id: sessionID },
          query: { limit: 10 },
        });

        if (error || !messages) {
          console.error("❌ 获取消息失败:", error);
          return;
        }

        const lastAssistantMessage = [...messages]
          .reverse()
          .find((msg) => msg.info.role === "assistant");

        if (!lastAssistantMessage) {
          console.log("ℹ️ 未找到 assistant 消息，跳过通知");
          return;
        }

        const textContent = extractTextContent(lastAssistantMessage.parts);

        if (!textContent.trim()) {
          console.log("ℹ️ 消息内容为空，跳过通知");
          return;
        }

        const htmlContent = formatForTelegram(textContent);
        const messageParts = splitMessage(htmlContent);

        await sendMessages(messageParts, "HTML");

        console.log(`✅ 已发送 ${messageParts.length} 条通知到 Telegram`);
      } catch (error) {
        console.error("❌ 发送 Telegram 通知失败:", error);
      }
    },
  };
};

export default plugin;
