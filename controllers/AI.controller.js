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
    const { 
      subject, 
      reason, 
      hasDocument = false, 
      type = "LEAVE", 
      startDate = null, 
      endDate = null,
      userHistory = { pastLeaves: 0, recentLeaves: 0, rejections: 0 }
    } = req.body;

    const prompt = `
As a STRICT POLICY-DRIVEN DECISION ENGINE for an institutional portal, audit this ${type} request and provide a final verdict.
This is NOT a chatbot. Every decision MUST be based on institutional rules and logical reasoning.

INPUT:
Subject: "${subject}"
Reason: "${reason}"
Document Attached: ${hasDocument ? "YES" : "NO"}
Dates: ${startDate} to ${endDate}
Student History: ${userHistory.pastLeaves} past leaves, ${userHistory.recentLeaves} recent (30 days), ${userHistory.rejections} rejections.

DECISION LOGIC:
1. SUBJECT AUDIT: Must be professional, detailed (min 1 paragraph if formal). Generic subjects like "Leave Application" are POOR QUALITY.
2. REASON AUDIT: Reject vague phrases ("personal work", "not feeling well"). Must be specific and formal.
3. TYPE DETECTION: (Medical, Casual, Emergency, Academic, or Other).
4. DURATION CALCULATION: Use dates if provided. Calculate logic: Leave > 3 days requires document.
5. DOCUMENT RULES:
   - Medical -> REQUIRED.
   - Duration > 3 days -> REQUIRED.
   - Emergency -> OPTIONAL but recommended.
   - Casual (1-2 days) -> NOT required.
6. RISK ANALYSIS (0-100 Score):
   - Increase risk if: vague reason (+30), missing required document (+50), frequent leaves or high rejections (+20).
   - Rating: LOW (0-30), MEDIUM (31-70), HIGH (71-100).
7. VERDICT (APPROVE | REVIEW | REJECT):
   - APPROVE: Clear input + clear reason + low risk + document status OK.
   - REVIEW: Minor issues or moderate risk.
   - REJECT: Vague input OR missing required document OR high risk (>70).

RETURN ONLY JSON:
{
  "decision": "APPROVE | REVIEW | REJECT",
  "confidence": number (0-100),
  "detectedType": "Medical | Casual | Emergency | Academic | Other",
  "duration": "number of days or null",
  "issues": ["list of specific failures"],
  "documentAnalysis": {
    "required": true | false,
    "status": "MISSING | PROVIDED | NOT_REQUIRED",
    "reason": "Explain policy logic"
  },
  "riskAnalysis": {
    "score": number,
    "level": "LOW | MEDIUM | HIGH",
    "factors": ["list why score is high/low"]
  },
  "keyFactors": ["key positive/negative highlights"],
  "finalSummary": "Clear verdict summary",
  "explainDecision": ["Step-by-step reasoning logic"],
  "improvedVersion": {
    "subject": "Professional replacement for subject",
    "reason": "Professional replacement for reason"
  },
  "suggestions": ["actionable steps for the student"]
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
  decision: reason.length > 20 ? "REVIEW" : "REJECT",
  confidence: 60,
  detectedType: "Casual",
  duration: null,
  issues: reason.length <= 20 ? ["Reason is too short for formal review."] : [],
  documentAnalysis: {
    required: false,
    status: "NOT_REQUIRED",
    reason: "Fallback analysis cannot determine specific documentary requirements."
  },
  riskAnalysis: {
    score: 50,
    level: "MEDIUM",
    factors: ["Manual fallback check due to AI being offline"]
  },
  keyFactors: ["Structural check applied"],
  finalSummary: "AI validation is temporarily offline. Basic structural check applied.",
  explainDecision: ["Analyzing message length", "Evaluating quality of reason"],
  improvedVersion: {
    subject: "Consolidated Request",
    reason: reason
  },
  suggestions: ["Ensure all mandatory fields are filled accurately."]
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