class RPGChat {
  constructor() {
    this.chatHistory = [];
    this.translations = null;
    this.firstRequestSent = false; // Track if first request has been sent

    // Game state object
    this.game = {
      language: "en",
      apiProvider: "openrouter",
      storyMode: "fantasy",
    };

    this.initializeElements();
    this.bindEvents();
    // Load initial translations and setup
    this.loadTranslations(this.game.language).then(() => {
      this.changeBackgroundTheme(this.game.storyMode);
      this.updateUserSettings();
    });
  }

  async loadTranslations(language) {
    try {
      const response = await fetch(`/api/translations/${language}`);
      this.translations = await response.json();
      this.updateUI();
      this.game.language = language;
    } catch (error) {
      console.error("Failed to load translations:", error);
      // Fallback to English if translation loading fails
      if (language !== "en") {
        await this.loadTranslations("en");
      }
    }
  }

  updateUI() {
    if (!this.translations) return;

    // Update all elements with data-i18n attributes
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translation = this.getNestedTranslation(key);
      if (translation) {
        if (element.tagName === "TITLE") {
          element.textContent = translation;
        } else {
          element.textContent = translation;
        }
      }
    });

    // Update placeholder text
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      const translation = this.getNestedTranslation(key);
      if (translation) {
        element.placeholder = translation;
      }
    });
  }

  getNestedTranslation(key) {
    const keys = key.split(".");
    let result = this.translations;
    for (const k of keys) {
      result = result?.[k];
    }
    return result;
  }

  updateUserSettings() {
    if (!this.translations || !this.userSettingContainer) return;

    // Get language name
    const languageNames = {
      en: "English",
      zh: "简体中文",
      "zh-TW": "繁體中文",
    };

    // Get API provider name
    const apiNames = {
      openrouter: "OpenRouter",
      azure: "Azure OpenAI",
    };

    // Create notification message
    const languageName = languageNames[this.game.language];
    const apiName = apiNames[this.game.apiProvider];
    const storyModeName = this.translations.storyModes[this.game.storyMode];

    // Create message based on current language
    let notificationMessage;
    if (this.game.language === "en") {
      notificationMessage = `🎮 Currently using: ${languageName} | ${apiName} | ${storyModeName} Mode`;
    } else if (this.game.language === "zh") {
      notificationMessage = `🎮 当前使用：${languageName} | ${apiName} | ${storyModeName}模式`;
    } else if (this.game.language === "zh-TW") {
      notificationMessage = `🎮 目前使用：${languageName} | ${apiName} | ${storyModeName}模式`;
    }

    // Update the container with the notification message
    this.userSettingContainer.innerHTML = `
      <div style="background-color: rgba(0, 123, 255, 0.1); border: 1px solid rgba(0, 123, 255, 0.3); border-radius: 8px; padding: 10px; margin: 10px 0; text-align: center; font-weight: bold; color: #007bff;">
        ${notificationMessage}
      </div>
    `;
  }

  disableSelectors() {
    // Disable the language and story mode selectors
    this.languageSelect.disabled = true;
    this.storyModeSelect.disabled = true;

    // Add visual indication that selectors are disabled
    this.languageSelect.style.opacity = "0.5";
    this.storyModeSelect.style.opacity = "0.5";
    this.languageSelect.style.cursor = "not-allowed";
    this.storyModeSelect.style.cursor = "not-allowed";

    // Update the notification message to indicate settings are locked
    if (this.translations) {
      let lockedMessage;
      if (this.game.language === "en") {
        lockedMessage =
          "🔒 Settings locked after first message. Language and Story Mode cannot be changed.";
      } else if (this.game.language === "zh") {
        lockedMessage =
          "🔒 设置已锁定。发送第一条消息后无法更改语言和故事模式。";
      } else if (this.game.language === "zh-TW") {
        lockedMessage =
          "🔒 設置已鎖定。發送第一條訊息後無法更改語言和故事模式。";
      }

      // Add locked message to the container
      this.userSettingContainer.innerHTML += `
        <div style="background-color: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; padding: 8px; margin: 5px 0; text-align: center; font-size: 0.9em; color: #856404;">
          ${lockedMessage}
        </div>
      `;
    }
  }

  hideOptions() {
    this.option1.style.display = "none";
    this.option2.style.display = "none";
    this.option3.style.display = "none";
  }

  showOptions(options) {
    if (options.length >= 1 && options[0]) {
      this.option1.textContent = options[0];
      this.option1.style.display = "inline-block";
    }
    if (options.length >= 2 && options[1]) {
      this.option2.textContent = options[1];
      this.option2.style.display = "inline-block";
    }
    if (options.length >= 3 && options[2]) {
      this.option3.textContent = options[2];
      this.option3.style.display = "inline-block";
    }
  }

  selectOption(optionNumber) {
    const selectedOption =
      optionNumber === 1
        ? this.option1.textContent
        : optionNumber === 2
        ? this.option2.textContent
        : this.option3.textContent;

    // Add the selected option as a user message
    this.addMessage(selectedOption, "user");

    // Hide options after selection
    this.hideOptions();

    // Send the option as a message
    this.sendOptionMessage(selectedOption);
  }

  parseResponse(response) {
    // Look for [OPTIONS] and [/OPTIONS] markers
    const optionsStart = response.indexOf("[OPTIONS]");
    const optionsEnd = response.indexOf("[/OPTIONS]");

    if (optionsStart !== -1 && optionsEnd !== -1) {
      // Extract the main response (everything before [OPTIONS])
      const mainResponse = response.substring(0, optionsStart).trim();

      // Extract the options section
      const optionsSection = response
        .substring(optionsStart + 9, optionsEnd)
        .trim();

      // Parse individual options (remove numbers and clean up)
      const options = optionsSection
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) =>
          line
            .replace(/^\d+\.\s*/, "")
            .replace(/^\[|\]$/g, "")
            .trim()
        )
        .filter((line) => line.length > 0);

      return { mainResponse, options };
    }

    // If no options found, return the whole response as main response
    return { mainResponse: response, options: [] };
  }

  initializeElements() {
    this.userInput = document.getElementById("userInput");
    this.sendButton = document.getElementById("sendButton");
    this.chatHistoryDiv = document.getElementById("chatHistory");
    this.loading = document.getElementById("loading");
    this.apiSelect = document.getElementById("apiSelect");
    this.storyModeSelect = document.getElementById("storyModeSelect");
    this.languageSelect = document.getElementById("languageSelect");

    // Option buttons
    this.option1 = document.getElementById("option1");
    this.option2 = document.getElementById("option2");
    this.option3 = document.getElementById("option3");

    // User setting container element
    this.userSettingContainer = document.getElementById(
      "User-Setting-Container"
    );

    // Set initial values from game state
    this.apiSelect.value = this.game.apiProvider;
    this.storyModeSelect.value = this.game.storyMode;
    this.languageSelect.value = this.game.language;

    // Initially hide option buttons
    this.hideOptions();
  } // Map story modes to theme class names
  getThemeClass(storyMode) {
    const themeMap = {
      fantasy: "fantasy-theme",
      romantic: "romantic-theme",
      xianxia: "xianxia-theme",
      mystery: "mystery-theme",
      scifi: "scifi-theme",
      horror: "horror-theme",
    };
    return themeMap[storyMode] || "default-theme";
  }

  // Change background image based on story mode
  changeBackgroundTheme(storyMode) {
    const body = document.body;

    // Remove all existing theme classes
    body.classList.remove(
      "fantasy-theme",
      "romantic-theme",
      "xianxia-theme",
      "mystery-theme",
      "scifi-theme",
      "horror-theme",
      "default-theme"
    );

    // Add the new theme class
    const newTheme = this.getThemeClass(storyMode);
    body.classList.add(newTheme);

    console.log(`Background changed to: ${newTheme}`);
  }

  bindEvents() {
    this.sendButton.addEventListener("click", () => this.sendMessage());
    this.userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });
    this.apiSelect.addEventListener("change", () => this.onApiProviderChange());
    this.storyModeSelect.addEventListener("change", () =>
      this.onStoryModeChange()
    );
    this.languageSelect.addEventListener("change", () =>
      this.onLanguageChange()
    );

    // Option button event listeners
    this.option1.addEventListener("click", () => this.selectOption(1));
    this.option2.addEventListener("click", () => this.selectOption(2));
    this.option3.addEventListener("click", () => this.selectOption(3));
  }

  onApiProviderChange() {
    const apiProvider = this.apiSelect.value;
    console.log("API Provider changed to:", apiProvider);

    // Update game state
    this.game.apiProvider = apiProvider;

    // Update User-Setting-Container display
    this.updateUserSettings();
  }

  async onLanguageChange() {
    // Prevent changes if first request has been sent
    if (this.firstRequestSent) {
      // Reset the selector to the current game language
      this.languageSelect.value = this.game.language;
      return;
    }

    const language = this.languageSelect.value;
    console.log("Language changed to:", language);

    // Update game state
    this.game.language = language;

    // Load new translations without clearing chat history
    await this.loadTranslations(language);

    // Update User-Setting-Container display
    this.updateUserSettings();
  }

  onStoryModeChange() {
    // Prevent changes if first request has been sent
    if (this.firstRequestSent) {
      // Reset the selector to the current game story mode
      this.storyModeSelect.value = this.game.storyMode;
      return;
    }

    const storyMode = this.storyModeSelect.value;

    // Update game state
    this.game.storyMode = storyMode;

    // Change background theme immediately
    this.changeBackgroundTheme(storyMode);

    // Update User-Setting-Container display
    this.updateUserSettings();
  }

  async sendOptionMessage(selectedOption) {
    // Ensure options are hidden while processing
    this.hideOptions();
    this.setLoading(true);

    try {
      // Use game state instead of reading from selectors
      const selectedAPI = this.game.apiProvider;
      const storyMode = this.game.storyMode;
      const language = this.game.language;

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`/api/chat/${selectedAPI}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: selectedOption,
          chatHistory: this.chatHistory,
          storyMode: storyMode,
          language: language,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const data = await response.json();
      const { mainResponse, options } = this.parseResponse(data.response);

      // Add the main response to chat
      this.addMessage(mainResponse, "ai", false, data.fallback);

      // Show options if they exist
      if (options.length > 0) {
        this.showOptions(options);
      }

      // Update chat history
      this.chatHistory.push({ role: "user", content: selectedOption });
      if (!data.fallback) {
        this.chatHistory.push({ role: "assistant", content: data.response });
      }

      // Keep only last 20 messages for context
      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(-20);
      }
    } catch (error) {
      console.error("Error:", error);
      let errorMessage =
        this.translations?.error?.generic ||
        "Sorry, something went wrong. Please try again.";

      this.addMessage(errorMessage, "ai", true);
    } finally {
      this.setLoading(false);
    }
  }

  async sendMessage() {
    const message = this.userInput.value.trim();
    if (!message) return;

    // Disable selectors after first request is sent
    if (!this.firstRequestSent) {
      this.firstRequestSent = true;
      this.disableSelectors();
    }

    // Add user message to chat
    this.addMessage(message, "user");
    this.userInput.value = "";

    // Hide option buttons while waiting for response
    this.hideOptions();
    this.setLoading(true);

    try {
      // Use game state instead of reading from selectors
      const selectedAPI = this.game.apiProvider;
      const storyMode = this.game.storyMode;
      const language = this.game.language;

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`/api/chat/${selectedAPI}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          chatHistory: this.chatHistory,
          storyMode: storyMode,
          language: language,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const data = await response.json();

      // Parse the response to separate main content from options
      const { mainResponse, options } = this.parseResponse(data.response);

      // Check if this is a fallback response
      const isFallback = data.fallback;
      const wasTruncated = data.truncated;

      let responseText = mainResponse;

      // Add warning if response was truncated
      if (wasTruncated && !isFallback) {
        responseText +=
          "\n\n[Note: Response was truncated due to length limits]";
      }

      // Add the main response to chat
      this.addMessage(responseText, "ai", false, isFallback);

      // Show options if they exist
      if (options.length > 0) {
        this.showOptions(options);
      } else {
        this.hideOptions();
      }

      // Update chat history for context (don't include fallback responses in history)
      this.chatHistory.push({ role: "user", content: message });
      if (!isFallback) {
        this.chatHistory.push({ role: "assistant", content: data.response });
      }

      // Keep only last 10 messages for context (to avoid token limits)
      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(-20);
      }
    } catch (error) {
      console.error("Error:", error);
      let errorMessage =
        this.translations?.error?.generic ||
        "Sorry, something went wrong. Please try again.";

      if (error.name === "AbortError") {
        errorMessage =
          this.translations?.error?.timeout ||
          "Request timed out. The AI might be taking too long to respond. Please try again.";
      } else if (error.message.includes("Failed to get AI response")) {
        errorMessage =
          this.translations?.error?.apiError ||
          "AI service error. Please try again or switch to a different AI provider.";
      }

      this.addMessage(errorMessage, "ai", true);
    } finally {
      this.setLoading(false);
    }
  }

  addMessage(text, sender, isError = false, isFallback = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;
    if (isError) messageDiv.className += " error";
    if (isFallback) messageDiv.className += " fallback";

    messageDiv.textContent = text;
    this.chatHistoryDiv.appendChild(messageDiv);
    this.chatHistoryDiv.scrollTop = this.chatHistoryDiv.scrollHeight;
  }

  setLoading(isLoading) {
    this.loading.classList.toggle("hidden", !isLoading);
    this.sendButton.disabled = isLoading;
    this.userInput.disabled = isLoading;
  }
}

// Initialize the chat when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new RPGChat();
});
