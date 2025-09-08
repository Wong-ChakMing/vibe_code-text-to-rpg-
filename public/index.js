class RPGChat {
  constructor() {
    this.chatHistory = [];
    this.initializeElements();
    this.bindEvents();
    this.startGame();
  }

  initializeElements() {
    this.userInput = document.getElementById("userInput");
    this.sendButton = document.getElementById("sendButton");
    this.chatHistoryDiv = document.getElementById("chatHistory");
    this.loading = document.getElementById("loading");
    this.apiSelect = document.getElementById("apiSelect");
  }

  bindEvents() {
    this.sendButton.addEventListener("click", () => this.sendMessage());
    this.userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });
  }

  async startGame() {
    const welcomeMessage =
      "Welcome to your AI-powered RPG adventure! You find yourself standing at the edge of a mysterious forest. The ancient trees tower above you, their branches swaying in the gentle breeze. What do you do?";
    this.addMessage(welcomeMessage, "ai");
  }

  async sendMessage() {
    const message = this.userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    this.addMessage(message, "user");
    this.userInput.value = "";
    this.setLoading(true);

    try {
      const selectedAPI = this.apiSelect.value;
      const response = await fetch(`/api/chat/${selectedAPI}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          chatHistory: this.chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      // Check if this is a fallback response
      const isFallback = data.fallback;
      this.addMessage(data.response, "ai", false, isFallback);

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
      this.addMessage(
        "Sorry, something went wrong. Please try again.",
        "ai",
        true
      );
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
