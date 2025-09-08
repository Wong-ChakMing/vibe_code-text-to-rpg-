const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;

// Read API keys from .env file
let API_KEY_AZURE = "";
let API_KEY_OPENROUTER = "";
try {
  const envContent = fs.readFileSync(".env", "utf8");

  // Get Azure API key (api-key-3)
  const azureKeyLine = envContent
    .split("\n")
    .find((line) => line.startsWith("api-key-3:"));
  if (azureKeyLine) {
    API_KEY_AZURE = azureKeyLine.split(":")[1].trim();
  }

  // Get OpenRouter API key (api-key-2)
  const openrouterKeyLine = envContent
    .split("\n")
    .find((line) => line.startsWith("api-key-2:"));
  if (openrouterKeyLine) {
    API_KEY_OPENROUTER = openrouterKeyLine.split(":")[1].trim();
  }
} catch (error) {
  console.error("Error reading .env file:", error);
}

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

// AI endpoint
app.post("/api/chat/azure", async (req, res) => {
  try {
    const { message, chatHistory } = req.body;

    // Create a context-aware prompt for RPG
    const systemPrompt = `You are a creative and engaging RPG game master. Create immersive text-based RPG adventures based on player input. 

Rules:
- Keep responses to 2-3 sentences
- Be descriptive and atmospheric
- Present choices or ask what the player does next
- Maintain continuity with previous actions
- Include elements of fantasy, adventure, or mystery
- Make the world feel alive and reactive`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: message },
    ];

    const apiUrl =
      "https://hkust.azure-api.net/openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-05-15";

    console.log(`Making request to Azure OpenAI: ${apiUrl}`);

    // Make API call to Azure OpenAI
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "api-key": API_KEY_AZURE,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    console.log(`API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`API Error Details: ${errorText}`);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Error calling AI API:", error);

    // Provide a fallback response if API fails
    const fallbackResponses = [
      "You find yourself in a mysterious tavern. The bartender eyes you curiously. What do you do next?",
      "A gentle breeze rustles through the ancient oak trees around you. You notice a faint path leading deeper into the woods. Do you follow it?",
      "The old wizard looks at you with knowing eyes. 'Ah, another adventurer seeks the lost treasure,' he says mysteriously. What is your response?",
      "You discover an old, weathered map tucked between the pages of a dusty tome. It seems to show the location of a hidden cave. What do you do?",
      "The sound of flowing water catches your attention. Through the trees, you can see a sparkling stream. As you approach, you notice something glinting beneath the surface. What's your next move?",
    ];

    const randomResponse =
      fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    res.json({
      response: `[Note: AI service temporarily unavailable, using fallback response]\n\n${randomResponse}`,
      fallback: true,
    });
  }
});

app.post("/api/chat/openrouter", async (req, res) => {
  try {
    const { message, chatHistory } = req.body;

    // Create a context-aware prompt for RPG
    const systemPrompt = `You are a creative and engaging RPG game master. Create immersive text-based RPG adventures based on player input. 

Rules:
- Keep responses to 2-3 sentences
- Be descriptive and atmospheric
- Present choices or ask what the player does next
- Maintain continuity with previous actions
- Include elements of fantasy, adventure, or mystery
- Make the world feel alive and reactive`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: message },
    ];

    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

    console.log(`Making request to OpenRouter: ${apiUrl}`);

    // Make API call to OpenRouter
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY_OPENROUTER}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Optional: for tracking
        "X-Title": "AI Text-to-RPG", // Optional: for tracking
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku", // You can change this to other models like "openai/gpt-3.5-turbo", "meta-llama/llama-2-70b-chat", etc.
        messages: messages,
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    console.log(`API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`API Error Details: ${errorText}`);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);

    // Provide a fallback response if API fails
    const fallbackResponses = [
      "You find yourself in a mysterious tavern. The bartender eyes you curiously. What do you do next?",
      "A gentle breeze rustles through the ancient oak trees around you. You notice a faint path leading deeper into the woods. Do you follow it?",
      "The old wizard looks at you with knowing eyes. 'Ah, another adventurer seeks the lost treasure,' he says mysteriously. What is your response?",
      "You discover an old, weathered map tucked between the pages of a dusty tome. It seems to show the location of a hidden cave. What do you do?",
      "The sound of flowing water catches your attention. Through the trees, you can see a sparkling stream. As you approach, you notice something glinting beneath the surface. What's your next move?",
    ];

    const randomResponse =
      fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    res.json({
      response: `[Note: AI service temporarily unavailable, using fallback response]\n\n${randomResponse}`,
      fallback: true,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Azure API Key loaded:", API_KEY_AZURE ? "Yes" : "No");
  console.log("OpenRouter API Key loaded:", API_KEY_OPENROUTER ? "Yes" : "No");
});
