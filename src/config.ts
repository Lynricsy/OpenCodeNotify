export interface Config {
  telegramBotToken: string;
  telegramChatId: string;
}

export function getConfig(): Config {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    throw new Error(
      "❌ 缺少必填环境变量: TELEGRAM_BOT_TOKEN\n" +
      "请在 .env 文件中设置或通过环境变量提供"
    );
  }

  if (!chatId) {
    throw new Error(
      "❌ 缺少必填环境变量: TELEGRAM_CHAT_ID\n" +
      "请在 .env 文件中设置或通过环境变量提供"
    );
  }

  return {
    telegramBotToken: token,
    telegramChatId: chatId,
  };
}
