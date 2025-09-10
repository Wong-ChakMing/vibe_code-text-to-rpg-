import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { saveToFile, readFromFile } from "./utils/file";
import {
  addLanguageToSystemPrompt,
  addLanguageToUserMessage,
  getUITranslations,
} from "./utils/language";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// TypeScript interfaces
interface StoryPrompt {
  name: string;
  description: string;
  prompt: string;
}

interface StoryPrompts {
  [key: string]: StoryPrompt;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  message: string;
  chatHistory: ChatMessage[];
  storyMode: string;
  language?: string;
}

interface APIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
}

// Load story prompts from external file
let storyPrompts: StoryPrompts = {};
try {
  const promptsContent: string = fs.readFileSync("prompts.json", "utf8");
  storyPrompts = JSON.parse(promptsContent) as StoryPrompts;
  console.log("Story prompts loaded successfully");
} catch (error) {
  console.error("Error reading prompts.json file:", error);
  // Fallback to default prompts if file can't be read
  storyPrompts = {
    fantasy: {
      name: "Fantasy Adventure",
      description: "Classic magical adventures",
      prompt:
        "You are a creative and engaging Fantasy RPG game master. Create immersive magical adventures in fantastical worlds.\n\nRules:\n- Keep responses to 2-3 sentences\n- Include magic, mythical creatures, ancient prophecies, and legendary artifacts\n- Create scenarios with enchanted forests, magical kingdoms, and mystical dungeons\n- Present choices involving spellcasting, creature encounters, and magical quests\n- Make the world feel alive with magic and wonder",
    },
  };
}

// Read API keys from environment variables
const API_KEY_AZURE: string = process.env.API_KEY_AZURE || "";
const API_KEY_OPENROUTER: string = process.env.API_KEY_OPENROUTER || "";

if (!API_KEY_AZURE || !API_KEY_OPENROUTER) {
  console.warn("Warning: API keys not found in environment variables");
}

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Function to get system prompt based on story mode
function getSystemPrompt(mode: string): string {
  const modeData: StoryPrompt | undefined = storyPrompts[mode];
  if (modeData && modeData.prompt) {
    return modeData.prompt;
  }
  // Default to fantasy if mode not found
  return (
    storyPrompts.fantasy?.prompt ||
    "You are a creative RPG game master. Create engaging adventures."
  );
}

// Serve the main HTML file
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

// Get translations for UI
app.get("/api/translations/:language", (req: Request, res: Response) => {
  const language = req.params.language;
  const translations = getUITranslations(language);
  res.json(translations);
});

// AI endpoint for Azure OpenAI
app.post(
  "/api/chat/azure",
  async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
    try {
      const {
        message,
        chatHistory,
        storyMode,
        language = "en",
      }: ChatRequestBody = req.body;

      // Get system prompt based on story mode and add language instruction
      let systemPrompt: string = getSystemPrompt(storyMode || "fantasy");
      systemPrompt = addLanguageToSystemPrompt(systemPrompt, language);

      // Add language instruction to user message if needed
      const localizedMessage = addLanguageToUserMessage(message, language);

      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: localizedMessage },
      ];

      const apiUrl: string =
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
          max_tokens: 800,
          temperature: 0.8,
        }),
      });

      console.log(`API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorText: string = await response.text();
        console.log(`API Error Details: ${errorText}`);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as APIResponse;
      const aiResponse: string = data.choices[0].message.content;

      // Check if response was truncated (often ends mid-sentence)
      const wasTruncated: boolean = data.choices[0].finish_reason === "length";

      console.log(`Response length: ${aiResponse.length} characters`);
      console.log(`Finish reason: ${data.choices[0].finish_reason}`);

      if (wasTruncated) {
        console.warn("Response was truncated due to length limit");
      }

      res.json({
        response: aiResponse,
        truncated: wasTruncated,
      });
    } catch (error) {
      console.error("Error calling AI API:", error);

      res.json({
        response: `[Note: AI service temporarily unavailable, using fallback response]`,
        fallback: true,
      });
    }
  }
);

app.post("/api/chat/openrouter", async (req, res) => {
  try {
    const { message, chatHistory, storyMode, language = "en" } = req.body;

    // Get system prompt based on story mode and add language instruction
    let systemPrompt = getSystemPrompt(storyMode || "fantasy");
    systemPrompt = addLanguageToSystemPrompt(systemPrompt, language);

    // Add language instruction to user message if needed
    const localizedMessage = addLanguageToUserMessage(message, language);

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: localizedMessage },
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
        model: "deepseek/deepseek-chat",
        messages: messages,
        max_tokens: 800, // Increased from 200 to allow longer responses
        temperature: 0.8,
      }),
    });

    console.log(`API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`API Error Details: ${errorText}`);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as APIResponse;
    const aiResponse = data.choices[0].message.content;

    // Check if response was truncated (often ends mid-sentence)
    const wasTruncated = data.choices[0].finish_reason === "length";

    console.log(`Response length: ${aiResponse.length} characters`);
    console.log(`Finish reason: ${data.choices[0].finish_reason}`);

    if (wasTruncated) {
      console.warn("Response was truncated due to length limit");
    }

    res.json({
      response: aiResponse,
      truncated: wasTruncated,
    });
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    res.json({
      response: `[Note: AI service temporarily unavailable, using fallback response]`,
      fallback: true,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Azure API Key loaded:", API_KEY_AZURE ? "Yes" : "No");
  console.log("OpenRouter API Key loaded:", API_KEY_OPENROUTER ? "Yes" : "No");
});
