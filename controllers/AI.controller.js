import { callAIWithFallback } from "../utils/aiClient.js";
import LeaveModel from "../models/leave.model.js";
import LeaveAdminModel from "../models/LeaveAdmins.model.js";
import Certificate from "../models/certificate.model.js";

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
    const { subject, reason, hasDocument = false, type = "LEAVE" } = req.body;

    const prompt = `
As a Strict Administrative Reviewer for an institutional portal, validate this ${type} request.

Subject: "${subject}"
Reason: "${reason}"
Supporting Document Attached: ${hasDocument ? "YES" : "NO"}

CRITICAL EVALUATION:
1. CONSISTENCY: Does the "Reason" logically and professionally justify the "Subject"? Fix any mismatches.
2. QUALITY: Ensure the tone is formal and the information is sufficient for an administrator.
3. DOCUMENTATION: 
   - If Document is NO: If the request is health-related, sensitive, or requires proof (e.g., Medical Leave, Bonafide Proof), you MUST suggest adding a specific supporting document in the "suggestions" array.
   - If Document is YES: Acknowledge that the documentation helps verify the request.

Return STRICT JSON:
{
  "validity": "Valid | Needs Improvement | Suspicious",
  "issues": ["list of items identified, e.g., 'Weak justification', 'Missing medical proof'"],
  "suggestions": ["actionable steps, e.g., 'Attach a scanned copy of your medical certificate'"],
  "improvedVersion": {
    "subject": "Professional improvement of the subject",
    "reason": "Professional improvement of the reason/body"
  }
}
`;

    const parsed = await callAIWithFallback(prompt);
    return res.json(parsed);
  } catch (err) {
    console.error("[validateRequest] Error:", err.message);
    return res.json(_validateFallback(req.body.reason));
  }
};


export const approvalSuggestion = async (req, res) => {
  try {
    const { reason, duration, hasDocument, type = "LEAVE" } = req.body;

    const prompt = `
As an Expert Institutional Administrative Assistant, analyze this ${type} request and advise the administrator.

Request Details:
Type: ${type}
Reason/Description: "${reason}"
Duration: ${duration}
Supporting Document Attached: ${hasDocument ? "YES" : "NO"}

STRICT ADMINISTRATIVE RULES:
1. DOCUMENTATION:
   - If Type is CERTIFICATE and Sub-type is Bonafide/Character/Transfer and Document is NO: You MUST suggest REJECT and the Remark must ask for a Student ID Card or relevant proof.
   - If Type is LEAVE and Duration > 3 days and Document is NO: You MUST suggest REJECT and ask for a Medical/Official Certificate.
2. REASONING: Explain clearly to the ADMIN why this request should be approved or rejected.
3. SUGGESTED REMARK: Provide a professional, ready-to-copy message for the STUDENT.

Return STRICT JSON:
{
  "decision": "Approve | Reject | Review",
  "confidence": "High | Medium | Low",
  "reasoning": "Detailed logical explanation for the administrator",
  "suggestedRemark": "A professional, polite, and direct message for the student explaining the decision or requirement"
}
`;

    const parsed = await callAIWithFallback(prompt);
    return res.json(parsed);
  } catch (err) {
    console.error("[approvalSuggestion] Error:", err.message);
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


/**
 * @description Intelligence Layer: Interprets raw analytics into actionable insights.
 */
export const systemInsights = async (req, res) => {
  try {
    const { role, department } = req.user;
    const { stats } = req.body; // Expecting the raw data from the Data Layer

    if (!stats) {
      return res.status(400).json({ message: "No data provided for AI interpretation." });
    }

    const rolePrompts = {
      "Faculty": `
        Focus on: Personal efficiency, response time bottlenecks, and student request patterns. 
        Alert if: Pending requests are older than 48h or if certain students have high frequency.
      `,
      "Departmental Admin": `
        Focus on: Departmental throughput, faculty leaderboard performance, and common request categories.
        Alert if: Rejection rate is > 30% or if any faculty is slower than the department average.
      `,
      "Super Admin": `
        Focus on: Institution-wide growth, departmental overhead, resource allocation, and security anomalies.
        Alert if: There are unauthorized access attempts or if a department is significantly delayed.
      `
    };

    const prompt = `
      You are an Executive Decision Intelligence Strategist for a premium educational institution.
      
      ROLE: ${role}
      DEPARTMENT: ${department || "Institution-Wide"}
      RAW METRICS: ${JSON.stringify(stats)}
      
      SPECIFIC FOCUS FOR THIS ROLE:
      ${rolePrompts[role] || "General institutional efficiency and data-backed trends."}
      
      STRICT RULES:
      1. NO GENERIC STATEMENTS. Every insight MUST reference a number, percentage, or specific category from the data.
      2. TRENDS: Identify logical patterns (e.g., "Medical leaves increased by 12% in the last 7 days").
      3. ALERTS: Identify urgent issues or anomalies (e.g., "3 Faculty members have avg response times exceeding 48 hours").
      4. SUGGESTIONS: Provide actionable, strategic advice (e.g., "Reallocate staff to Dept A to handle the 25% volume spike").
      5. Include any Security Anomalies if present in Super Admin data.
      
      RETURN STRICT JSON:
      {
        "trends": ["string"],
        "alerts": ["string"],
        "suggestions": ["string"]
      }
    `;

    const aiRaw = await callAIWithFallback(prompt);

    const sanitize = (arr) => (Array.isArray(arr) ? arr.filter(i => typeof i === "string").map(s => s.trim()) : []);

    return res.json({
      trends: sanitize(aiRaw.trends),
      alerts: sanitize(aiRaw.alerts),
      suggestions: sanitize(aiRaw.suggestions),
    });
  } catch (err) {
    console.error("[systemInsights] Intelligence Error:", err);
    return res.json({
      trends: ["Data interpretation temporarily offline."],
      alerts: ["Security/Performance monitoring active (Internal)."],
      suggestions: ["Check raw metrics or retry insights in 2 minutes."]
    });
  }
};

// ── Fallback Helpers (Internal) ──────────────────────────────────────────────

const _generateFallback = (type, rawText) => ({
  subject: `${type === "CERTIFICATE" ? "Request for Certificate" : "Leave Application"} - ${rawText.slice(0, 20)}...`,
  body: `I am writing to formally submit a request regarding: ${rawText}. Please consider this application for approval.`,
  error: "AI Assistant is currently offline. Providing basic formalization."
});

const _validateFallback = (reason) => ({
  validity: reason.length > 20 ? "Valid" : "Needs Improvement",
  issues: reason.length <= 20 ? ["Reason is too short for formal review."] : [],
  suggestions: ["Ensure all mandatory fields are filled accurately."],
  improvedVersion: {
    subject: "Consolidated Request",
    reason: reason
  }
});

const _approvalFallback = () => ({
  decision: "Review",
  confidence: "Low",
  reasoning: "AI engine is unavailable. Manual administrator review required.",
  suggestedRemark: "Please contact the administration office regarding your application."
});

const _fraudFallback = () => ({
  riskLevel: "Medium",
  flagReason: "Automated analysis bypassed due to high system load."
});