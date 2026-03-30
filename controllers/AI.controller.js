import { callAIWithFallback } from "../utils/aiClient.js";

export const generateRequest = async (req, res) => {
  try {
    const { rawText, type = "LEAVE" } = req.body;

    if (!rawText || rawText.trim().length < 5) {
      return res.status(400).json({
        message: "Please provide at least 5 characters.",
      });
    }

    const context =
      type === "CERTIFICATE" ? "certificate request" : "leave application";

    const prompt = `
Convert this into a formal ${context}.

Input: "${rawText}"

STRICT:
- Do NOT copy input text
- Expand professionally
- Use formal tone

Return JSON:
{
  "subject": "professional subject",
  "body": "detailed formal paragraph (4-6 lines)"
}

Example:
Input: "i am sick for 3 days"
Output:
{
  "subject": "Request for Leave of Absence Due to Medical Reasons",
  "body": "I would like to formally request leave of absence..."
}
`;

    const parsed = await callAIWithFallback(prompt);

    // 🛡️ Anti-copy guard
    const isCopy =
      parsed.subject.toLowerCase().includes(rawText.toLowerCase()) ||
      parsed.body.toLowerCase().includes(rawText.toLowerCase());

    if (isCopy) throw new Error("AI copied input");

    return res.json(parsed);
  } catch (err) {
    console.error("[generateRequest]", err.message);
    return res.json(_generateFallback(req.body.type, req.body.rawText));
  }
};


export const validateRequest = async (req, res) => {
  try {
    const { subject, reason, hasDocument = false } = req.body;

    const prompt = `
Validate this request.

Subject: "${subject}"
Reason: "${reason}"
Document: ${hasDocument ? "YES" : "NO"}

Return JSON:
{
  "validity": "Valid | Needs Improvement | Suspicious",
  "issues": [],
  "suggestions": [],
  "improvedVersion": {
    "subject": "",
    "reason": ""
  }
}
`;

    const parsed = await callAIWithFallback(prompt);

    return res.json(parsed);
  } catch {
    return res.json(_validateFallback(req.body.reason));
  }
};


export const approvalSuggestion = async (req, res) => {
  try {
    const { reason, duration, hasDocument } = req.body;

    const prompt = `
Decide approval.

Reason: "${reason}"
Duration: ${duration}
Document: ${hasDocument ? "YES" : "NO"}

Return JSON:
{
  "decision": "Approve | Reject | Review",
  "confidence": "High | Medium | Low",
  "reasoning": ""
}
`;

    const parsed = await callAIWithFallback(prompt);

    return res.json(parsed);
  } catch {
    return res.json(_approvalFallback());
  }
};



export const fraudDetection = async (req, res) => {
  try {
    const { studentId } = req.query;

    const leaves = await LeaveModel.find({ studentId });

    const total = leaves.length;

    // ⚡ RULE-BASED (FAST + FREE)
    if (total > 7) {
      return res.json({
        riskLevel: "High",
        flagReason: "Too many leave requests",
      });
    }

    if (total < 2) {
      return res.json({
        riskLevel: "Low",
        flagReason: "Normal behavior",
      });
    }

    // 🤖 AI only if needed
    const prompt = `
Analyze leave pattern count: ${total}

Return JSON:
{
  "riskLevel": "Low | Medium | High",
  "flagReason": ""
}
`;

    const parsed = await callAIWithFallback(prompt);

    return res.json(parsed);
  } catch {
    return res.json(_fraudFallback({}));
  }
};


export const systemInsights = async (req, res) => {
  try {
    const stats = {
      leaves: await LeaveModel.countDocuments(),
      certificates: await Certificate.countDocuments(),
    };

    const prompt = `
Analyze system:

Leaves: ${stats.leaves}
Certificates: ${stats.certificates}

Return JSON:
{
  "trends": [],
  "alerts": [],
  "suggestions": []
}
`;

    const parsed = await callAIWithFallback(prompt);

    return res.json({
      ...parsed,
      stats,
    });
  } catch {
    return res.json(_insightsFallback({}));
  }
};