// utils/aiClient.js
import axios from "axios";

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export const callAI = async (prompt, model = "openai/gpt-4o-mini") => {
  try {
    const response = await axios.post(
      BASE_URL,
      {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a strict academic assistant. Always return valid JSON. Never copy user input.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (err) {
    console.error("AI Error:", err?.response?.data || err.message);
    throw new Error("AI failed");
  }
};

// 🔁 Retry Wrapper
export const callAIWithFallback = async (prompt) => {
  try {
    return await callAI(prompt, "openai/gpt-4o-mini");
  } catch {
    return await callAI(prompt, "anthropic/claude-3.5-sonnet");
  }
};