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
  "confidence": number,
  "detectedType": "Medical | Casual | Emergency | Academic | Other",
  "duration": number or null,
  "issues": ["list of specific failures"],
  "documentAnalysis": {
    "required": true,
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
  "explainDecision": ["Step 1 Reasoning", "Step 2 Reasoning", "Step 3 Reasoning"],
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
As an Expert Institutional Administrative Assistant and Policy Consultant, analyze this ${type} request and advise the administrator.

Request Details:
Type: ${type}
Reason/Description: "${reason}"
Duration: ${duration}
Supporting Document Attached: ${hasDocument ? "YES" : "NO"}

STRICT ADMINISTRATIVE RULES:
1. DOCUMENTATION:
   - If Type is CERTIFICATE and Sub-type is Bonafide/Character/Transfer and Document is NO: You MUST suggest REJECT and the Remark must ask for a Student ID Card or relevant proof.
   - If Type is LEAVE and Duration > 3 days and Document is NO: You MUST suggest REJECT and ask for a Medical/Official Certificate.
2. REASONING: Explain clearly and logically to the ADMIN the "Why" behind the suggestion based on institutional policy.
3. FUTURE GUIDANCE: Provide a suggested remark for the requester for future references (e.g. what to attach next time).

Return STRICT JSON:
{
  "decision": "Approve | Reject | Review",
  "confidence": "High | Medium | Low",
  "policySummary": "Brief summary of the AI's understanding on why it thinks approval/rejection is needed based on institutional rules.",
  "reasoning": "Detailed logical explanation for the administrator",
  "futureGuidance": "Direct advice for the student on how to improve future applications of this type.",
  "suggestedRemark": "A professional, polite, and direct message for the student explaining the decision and guidance."
}
`;

    const parsed = await callAIWithFallback(prompt);
    return res.json(parsed);
  } catch (err) {
    console.error("[approvalSuggestion] Error:", err.message);
    return res.json(_approvalFallback());
  }
};


/**
 * @description Intelligence Layer: Interprets raw analytics into actionable insights.
 * Upgraded into a Role-Based Decision Intelligence Engine.
 */
export const systemInsights = async (req, res) => {
  try {
    const { role, department } = req.user;
    const { analyticsData } = req.body; 

    if (!analyticsData) {
      return res.status(400).json({ message: "No analytics data provided for AI interpretation." });
    }

    const roleContexts = {
      "Faculty": `
        ROLE: FACULTY
        INTELLIGENCE FOCUS:
        - Only student leave insights
        - Most common leave types
        - Peak leave dates
        - Delay patterns
      `,
      "Departmental Admin": `
        ROLE: DEPARTMENT_ADMIN
        INTELLIGENCE FOCUS:
        - Student + faculty comparison
        - Approval vs rejection patterns
        - Department-level anomalies
      `,
      "Super Admin": `
        ROLE: SUPER_ADMIN
        INTELLIGENCE FOCUS:
        - Institution-wide insights
        - Certificate demand trends
        - Average decision time
        - Cross-department performance
        - Admin efficiency comparison
      `
    };

    const prompt = `
      You are a DATA INTERPRETATION + DECISION INTELLIGENCE SYSTEM for Requesta, an institutional workflow platform.
      This is NOT a chatbot. You must provide realistic, numerical, and actionable insights with mandatory "WHY" explanations.

      CURRENT ROLE: ${role}
      DEPARTMENT: ${department || "Institution-Wide"}
      ${roleContexts[role] || "Strategic institutional oversight."}

      INPUT DATA (RAW AGGREGATIONS):
      ${JSON.stringify(analyticsData)}

      STRICT REALISM & INTELLIGENCE RULES:
      1. NO generic text. NO vague insights.
      2. REALISTIC VALUES: NEVER use extreme values like 0% or 100% unless absolutely true. Use realistic percentages (40-80%). Avoid vague statements.
      3. NUMBERS REQUIRED: EVERY trend, alert, and suggestion MUST include numbers (count, percentage, or duration) to reflect actual data patterns.
      4. THE "WHY" FACTOR: Every single insight MUST include reasoning. Add "WHY" to everything based on institutional cycles.
         - Bad: "Casual leaves are high"
         - Good: "Casual leaves account for 52%, likely due to increased personal commitments during this period"
      5. SYSTEM ALERTS (URGENT + ACTIONABLE): Alerts must indicate the problem clearly, include numbers, and state urgency (e.g., "7 requests pending for more than 72 hours (SLA breach)", "Rejection rate increased by 25% this week"). Avoid generic alerts.
      6. ACTIONABLE STRATEGY: Suggestions must directly relate to data and be practically implementable (e.g., "Introduce a 48-hour SLA to reduce pending requests").
      7. ROLE ADAPTATION: STRICTLY adapt outputs based on the ROLE defined above.

      FINAL OUTPUT FORMAT (STRICT JSON ONLY):
      {
        "executiveSummary": {
          "systemHealth": "GOOD | MODERATE | CRITICAL",
          "summary": "2-3 lines explaining system condition, must reflect actual data patterns and include numbers.",
          "keyRisk": "Most critical issue identified.",
          "immediateAction": "What should be done right now."
        },
        "trends": ["Format: Insight + Number/Stat + WHY Reasoning"],
        "alerts": ["Format: High-priority numerical alert + Urgency + Explanation"],
        "suggestions": ["Specific, data-backed practical recommendation"],
        "advancedAnalytics": {
          "topLeaveReasons": [{"reason": "string", "count": number}],
          "averageDecisionTime": "string (in days or hours)",
          "approvalRate": "string (percentage)",
          "rejectionRate": "string (percentage)",
          "peakDates": [{"date": "string", "requests": number}],
          "adminPerformance": [{"admin": "string", "avgTime": "string", "approvalRate": "string"}],
          "anomalies": ["Nuanced numerical and analytical anomalies"]
        }
      }
    `;

    const aiRaw = await callAIWithFallback(prompt);

    // Ensure all critical fields exist for frontend stability
    const finalInsights = {
      executiveSummary: aiRaw.executiveSummary || {
        systemHealth: "MODERATE",
        summary: "Intelligence engine initializing...",
        keyRisk: "Limited historical data",
        immediateAction: "Continue monitoring request volume"
      },
      trends: Array.isArray(aiRaw.trends) ? aiRaw.trends : [],
      alerts: Array.isArray(aiRaw.alerts) ? aiRaw.alerts : [],
      suggestions: Array.isArray(aiRaw.suggestions) ? aiRaw.suggestions : [],
      advancedAnalytics: aiRaw.advancedAnalytics || {}
    };

    return res.json(finalInsights);
  } catch (err) {
    console.error("[getAIInsights] Intelligence Error:", err);
    return res.json({
      trends: ["Data interpretation temporarily offline."],
      alerts: ["Security/Performance monitoring active (Internal)."],
      suggestions: ["Check raw metrics or retry insights in 2 minutes."],
      advancedAnalytics: {}
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