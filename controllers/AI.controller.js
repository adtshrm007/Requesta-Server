import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * POST /api/ai/generate-request
 * Body: { rawText: string, type: "LEAVE" | "CERTIFICATE" }
 * Returns: { title, description, suggestions[] }
 */
export const generateRequest = async (req, res) => {
  try {
    const { rawText, type = "LEAVE" } = req.body;

    if (!rawText || rawText.trim().length < 5) {
      return res.status(400).json({
        message: "Please provide a description of your request (at least 5 characters).",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback if API key not configured
      return res.status(200).json({
        title: "Leave Request",
        description: rawText,
        suggestions: [
          "Please add the specific dates for your leave.",
          "Include a clear reason for the leave.",
          "Attach any supporting documents if applicable.",
        ],
        fallback: true,
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const requestTypeContext =
      type === "CERTIFICATE"
        ? "certificate issuance request (e.g., bonafide certificate, transfer certificate, degree certificate, etc.)"
        : "leave application (e.g., medical leave, casual leave, study leave, etc.)";

    const prompt = `You are an academic assistant helping students write formal ${requestTypeContext}s.

A student wrote this rough description:
"${rawText}"

Your task:
1. Generate a concise, formal title for this request (max 10 words)
2. Rewrite the description in formal, professional academic language (2-4 sentences)
3. List 2-4 specific suggestions for information that is missing or could strengthen this request (e.g., dates, supporting documents, specific reason, duration)

Respond ONLY with valid JSON in this exact format:
{
  "title": "...",
  "description": "...",
  "suggestions": ["...", "...", "..."]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Extract JSON from response (handle markdown code blocks if present)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI returned invalid JSON format");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!parsed.title || !parsed.description || !Array.isArray(parsed.suggestions)) {
      throw new Error("AI response missing required fields");
    }

    return res.status(200).json({
      title: parsed.title,
      description: parsed.description,
      suggestions: parsed.suggestions,
    });
  } catch (err) {
    console.error("[AI] Error generating request:", err.message);

    // Graceful degradation — return a helpful fallback
    return res.status(200).json({
      title: "Request",
      description: req.body?.rawText || "",
      suggestions: [
        "Please provide specific dates for your request.",
        "Include a clear and detailed reason.",
        "Attach any relevant supporting documents.",
        "Ensure your contact information is up to date.",
      ],
      error: "AI service temporarily unavailable. Please fill in the details manually.",
    });
  }
};
