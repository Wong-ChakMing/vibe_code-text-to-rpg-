// Language configurations
interface LanguageConfig {
  name: string;
  code: string;
  systemPromptSuffix: string;
  userPromptPrefix: string;
}

// UI Translation interface
interface UITranslations {
  title: string;
  apiProvider: string;
  storyMode: string;
  language: string;
  inputPlaceholder: string;
  sendButton: string;
  loading: string;
  storyModes: {
    fantasy: string;
    romantic: string;
    xianxia: string;
    mystery: string;
    scifi: string;
    horror: string;
  };
  error: {
    generic: string;
    timeout: string;
    apiError: string;
  };
}

const languages: { [key: string]: LanguageConfig } = {
  en: {
    name: "English",
    code: "en",
    systemPromptSuffix:
      "\n\nIMPORTANT: Respond in the language requested by the user. Keep responses engaging and immersive.",
    userPromptPrefix: "",
  },
  zh: {
    name: "简体中文",
    code: "zh",
    systemPromptSuffix:
      "\n\n重要：根据用户要求的语言回答。保持回应引人入胜且富有沉浸感。",
    userPromptPrefix: "请用中文回答：",
  },
  "zh-TW": {
    name: "繁體中文",
    code: "zh-TW",
    systemPromptSuffix:
      "\n\n重要：根據用戶要求的語言回答。保持回應引人入勝且富有沉浸感。",
    userPromptPrefix: "請用繁體中文回答：",
  },
};

const uiTranslations: { [key: string]: UITranslations } = {
  en: {
    title: "AI Text-to-RPG Adventure",
    apiProvider: "AI Provider:",
    storyMode: "Story Mode:",
    language: "Language:",
    inputPlaceholder: "Describe your next action...",
    sendButton: "Send",
    loading: "Thinking...",
    storyModes: {
      fantasy: "Fantasy",
      romantic: "Romantic",
      xianxia: "Xianxia",
      mystery: "Mystery Detective",
      scifi: "Science Fiction",
      horror: "Horror Survival",
    },
    error: {
      generic: "Sorry, something went wrong. Please try again.",
      timeout:
        "Request timed out. The AI might be taking too long to respond. Please try again.",
      apiError:
        "AI service error. Please try again or switch to a different AI provider.",
    },
  },
  zh: {
    title: "AI文字RPG冒险游戏",
    apiProvider: "AI服务商：",
    storyMode: "故事模式：",
    language: "语言：",
    inputPlaceholder: "描述您的下一个行动...",
    sendButton: "发送",
    loading: "思考中...",
    storyModes: {
      fantasy: "奇幻",
      romantic: "浪漫",
      xianxia: "仙侠",
      mystery: "悬疑侦探",
      scifi: "科幻",
      horror: "恐怖生存",
    },
    error: {
      generic: "抱歉，出现了问题。请重试。",
      timeout: "请求超时。AI可能需要更长时间响应。请重试。",
      apiError: "AI服务错误。请重试或切换到不同的AI服务商。",
    },
  },
  "zh-TW": {
    title: "AI文字RPG冒險遊戲",
    apiProvider: "AI服務商：",
    storyMode: "故事模式：",
    language: "語言：",
    inputPlaceholder: "描述您的下一個行動...",
    sendButton: "發送",
    loading: "思考中...",
    storyModes: {
      fantasy: "奇幻",
      romantic: "浪漫",
      xianxia: "仙俠",
      mystery: "懸疑偵探",
      scifi: "科幻",
      horror: "恐怖生存",
    },
    error: {
      generic: "抱歉，出現了問題。請重試。",
      timeout: "請求超時。AI可能需要更長時間響應。請重試。",
      apiError: "AI服務錯誤。請重試或切換到不同的AI服務商。",
    },
  },
};

export function getLanguageConfig(languageCode: string): LanguageConfig {
  return languages[languageCode] || languages.en;
}

export function addLanguageToSystemPrompt(
  systemPrompt: string,
  languageCode: string
): string {
  const config = getLanguageConfig(languageCode);
  return systemPrompt + config.systemPromptSuffix;
}

export function addLanguageToUserMessage(
  userMessage: string,
  languageCode: string
): string {
  const config = getLanguageConfig(languageCode);

  // Simple approach: just add prefix for non-English languages
  if (languageCode !== "en") {
    return config.userPromptPrefix + userMessage;
  }

  return userMessage;
}

export function getUITranslations(languageCode: string): UITranslations {
  return uiTranslations[languageCode] || uiTranslations.en;
}

export function getSupportedLanguages(): { [key: string]: string } {
  const result: { [key: string]: string } = {};
  for (const [code, config] of Object.entries(languages)) {
    result[code] = config.name;
  }
  return result;
}
