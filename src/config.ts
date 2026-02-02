import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface Config {
  telegramBotToken: string;
  telegramChatId: string;
}

interface ConfigFile {
  telegram_bot_token?: string;
  telegram_chat_id?: string;
}

const CONFIG_PATH = join(homedir(), ".config", "opencode", "opencode-notify.json");

export function getConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(
      `❌ 配置文件不存在: ${CONFIG_PATH}\n\n` +
      `请创建配置文件，内容格式如下:\n` +
      `{\n` +
      `  "telegram_bot_token": "your_bot_token_here",\n` +
      `  "telegram_chat_id": "your_chat_id_here"\n` +
      `}`
    );
  }

  let configFile: ConfigFile;
  try {
    const content = readFileSync(CONFIG_PATH, "utf-8");
    configFile = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `❌ 配置文件解析失败: ${CONFIG_PATH}\n\n` +
      `请确保文件是有效的 JSON 格式:\n` +
      `{\n` +
      `  "telegram_bot_token": "your_bot_token_here",\n` +
      `  "telegram_chat_id": "your_chat_id_here"\n` +
      `}`
    );
  }

  const token = configFile.telegram_bot_token;
  const chatId = configFile.telegram_chat_id;

  if (!token) {
    throw new Error(
      `❌ 配置项缺失: telegram_bot_token\n\n` +
      `请在 ${CONFIG_PATH} 中添加:\n` +
      `"telegram_bot_token": "从 @BotFather 获取的 Token"`
    );
  }

  if (!chatId) {
    throw new Error(
      `❌ 配置项缺失: telegram_chat_id\n\n` +
      `请在 ${CONFIG_PATH} 中添加:\n` +
      `"telegram_chat_id": "你的 Chat ID"`
    );
  }

  return {
    telegramBotToken: token,
    telegramChatId: chatId,
  };
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
