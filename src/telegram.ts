/**
 * Telegram API 封装模块
 * 提供发送消息到 Telegram 的功能
 */
import { getConfig } from './config';

/**
 * 发送单条消息到 Telegram
 * @param text 消息文本内容
 * @param parseMode 解析模式，可选值: "HTML", "Markdown", "MarkdownV2"
 * @throws {Error} 当发送失败时抛出错误
 */
export async function sendMessage(text: string, parseMode?: string): Promise<void> {
  const config = getConfig();
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  
  await sendWithRetry(url, {
    chat_id: config.telegramChatId,
    text,
    parse_mode: parseMode,
  });
}

/**
 * 批量发送多条消息到 Telegram
 * @param texts 消息文本数组
 * @param parseMode 解析模式，可选值: "HTML", "Markdown", "MarkdownV2"
 */
export async function sendMessages(texts: string[], parseMode?: string): Promise<void> {
  for (const text of texts) {
    await sendMessage(text, parseMode);
  }
}

async function sendWithRetry(url: string, body: any, retries: number = 0): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    const data = await response.json();
    const retryAfter = data.parameters?.retry_after || 5;
    
    console.warn(`⚠️ Telegram API 速率限制，${retryAfter} 秒后重试...`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    
    return sendWithRetry(url, body, retries + 1);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      `❌ Telegram API 请求失败 (${response.status}): ${errorData?.description || response.statusText}`
    );
  }
}
