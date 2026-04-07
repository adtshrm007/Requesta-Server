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
  "body": "detailed formal paragraph (4-6 lines)",
  "extractedStartDate": "YYYY-MM-DD" | null,
  "extractedEndDate": "YYYY-MM-DD" | null
}

Example:
Input: "i am sick for 3 days starting 2023-10-01"
Output:
{
  "subject": "Request for Leave of Absence Due to Medical Reasons",
  "body": "I would like to formally request leave of absence...",
  "extractedStartDate": "2023-10-01",
  "extractedEndDate": "2023-10-03"
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
    const isSuperAdmin = role === "Super Admin";
    const isDeptAdmin = role === "Departmental Admin";

    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // ── Helper: Department scoping for student leaves ────────────────────────
    const getStudentDeptPipeline = () => {
      if (isSuperAdmin) return [];
      return [
        {
          $lookup: {
            from: "studentregisters",
            localField: "studentId",
            foreignField: "_id",
            as: "studentInfo",
          },
        },
        { $unwind: "$studentInfo" },
        { $match: { "studentInfo.branch": department } },
      ];
    };

    // ── 1. Student Leave Reasons (categorized) ──────────────────────────────
    let studentLeaveReasons = [];
    try {
      const reasonGroups = await LeaveModel.aggregate([
        ...getStudentDeptPipeline(),
        {
          $addFields: {
            safeReason: { $toLower: { $ifNull: ["$Reason", ""] } }
          }
        },
        {
          $addFields: {
            category: {
              $switch: {
                branches: [
                  { case: { $regexMatch: { input: "$safeReason", regex: /medical|health|sick|hospital|fever|ill|doctor|surgery|treatment/i } }, then: "Medical / Health" },
                  { case: { $regexMatch: { input: "$safeReason", regex: /family|relative|marriage|wedding|death|funeral|emergency/i } }, then: "Family Emergency" },
                  { case: { $regexMatch: { input: "$safeReason", regex: /exam|study|test|assignment|project|submission|academic/i } }, then: "Academic" },
                  { case: { $regexMatch: { input: "$safeReason", regex: /travel|trip|tour|station|native|hometown|outstation/i } }, then: "Travel" },
                  { case: { $regexMatch: { input: "$safeReason", regex: /festival|holiday|celebration|puja|eid|diwali|christmas/i } }, then: "Festival / Holiday" },
                  { case: { $regexMatch: { input: "$safeReason", regex: /internship|placement|interview|job|company|corporate/i } }, then: "Placement / Internship" },
                  { case: { $regexMatch: { input: "$safeReason", regex: /personal|private|home/i } }, then: "Personal" },
                ],
                default: "Other",
              },
            },
          },
        },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      studentLeaveReasons = reasonGroups.map(({ _id, count }) => ({ reason: _id, count }));
    } catch (e) {
      console.error("[systemInsights] studentLeaveReasons error:", e.message);
    }

    // ── 2. Student Monthly Stats (last 6 months) ────────────────────────────
    let studentMonthlyStats = [];
    try {
      const monthlyAgg = await LeaveModel.aggregate([
        ...getStudentDeptPipeline(),
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              status: "$status",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]);
      const monthMap = {};
      monthlyAgg.forEach(({ _id, count }) => {
        const m = String(_id.month || "Unknown");
        if (!monthMap[m]) monthMap[m] = { month: m, total: 0, approved: 0, rejected: 0, pending: 0 };
        if (_id.status) {
          const k = String(_id.status).toLowerCase();
          if (monthMap[m].hasOwnProperty(k)) monthMap[m][k] = count;
        }
        monthMap[m].total += count;
      });
      studentMonthlyStats = Object.values(monthMap);
    } catch (e) {
      console.error("[systemInsights] studentMonthlyStats error:", e.message);
    }

    // ── 3. Student Status Counts ────────────────────────────────────────────
    let studentStatusStats = { total: 0, approved: 0, rejected: 0, pending: 0 };
    try {
      const statusAgg = await LeaveModel.aggregate([
        ...getStudentDeptPipeline(),
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      statusAgg.forEach(({ _id, count }) => {
        if (_id) studentStatusStats[_id.toLowerCase()] = count;
        studentStatusStats.total += count;
      });
    } catch (e) {
      console.error("[systemInsights] studentStatusStats error:", e.message);
    }

    // ── 4. Faculty/Admin Leave Data (for DeptAdmin + SuperAdmin) ─────────────
    let facultyLeaveData = null;
    if (isDeptAdmin || isSuperAdmin) {
      try {
        const facultyPipeline = isSuperAdmin ? [] : [
          {
            $lookup: {
              from: "adminregisters",
              localField: "admin",
              foreignField: "_id",
              as: "adminInfo",
            },
          },
          { $unwind: "$adminInfo" },
          { $match: { "adminInfo.department": department } },
        ];

        // Faculty leave reasons
        const facultyReasons = await LeaveAdminModel.aggregate([
          ...facultyPipeline,
          { $group: { _id: "$type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]);

        // Faculty leave status
        const facultyStatus = await LeaveAdminModel.aggregate([
          ...facultyPipeline,
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const fStats = { total: 0, approved: 0, rejected: 0, pending: 0 };
        facultyStatus.forEach(({ _id, count }) => {
          if (_id) fStats[_id.toLowerCase()] = count;
          fStats.total += count;
        });

        // Faculty monthly
        const facultyMonthly = await LeaveAdminModel.aggregate([
          ...facultyPipeline,
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: {
                month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                status: "$status",
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.month": 1 } },
        ]);
        const fMonthMap = {};
        facultyMonthly.forEach(({ _id, count }) => {
          const m = String(_id.month || "Unknown");
          if (!fMonthMap[m]) fMonthMap[m] = { month: m, total: 0, approved: 0, rejected: 0, pending: 0 };
          if (_id.status) {
            const k = String(_id.status).toLowerCase();
            if (fMonthMap[m].hasOwnProperty(k)) fMonthMap[m][k] = count;
          }
          fMonthMap[m].total += count;
        });

        facultyLeaveData = {
          leaveTypes: facultyReasons.map(({ _id, count }) => ({ type: _id, count })),
          statusStats: fStats,
          monthlyStats: Object.values(fMonthMap),
        };
      } catch (e) {
        console.error("[systemInsights] facultyLeaveData error:", e.message);
      }
    }

    // ── Build the data summary for AI ────────────────────────────────────────
    const dataForAI = {
      role,
      department: department || "Institution-Wide",
      studentLeaves: {
        reasonBreakdown: studentLeaveReasons,
        statusStats: studentStatusStats,
        monthlyStats: studentMonthlyStats,
      },
    };
    if (facultyLeaveData) {
      dataForAI.facultyAdminLeaves = facultyLeaveData;
    }

    // ── Role context for AI ─────────────────────────────────────────────────
    const roleInstructions = {
      "Faculty": `You are analyzing data ONLY for STUDENTS in the ${department} department. Focus on student leave patterns, which reasons are most common, which months see spikes, and actionable insights for the faculty member managing these students.`,
      "Departmental Admin": `You are analyzing data for BOTH students AND faculty/admin in the ${department} department. Compare student vs faculty leave patterns. Identify if faculty absences correlate with student leave spikes. Provide department-level management insights.`,
      "Super Admin": `You are analyzing institution-wide data across ALL departments. Compare student and faculty/admin leave patterns. Identify institutional trends, departmental anomalies, and provide strategic high-level recommendations.`,
    };

    const prompt = `
You are an AI Leave Intelligence Analyst for Requesta, an institutional leave management platform.
Your job is to interpret REAL leave data and provide meaningful, data-backed insights.

${roleInstructions[role] || "Provide general leave analytics insights."}

ACTUAL DATA FROM DATABASE:
${JSON.stringify(dataForAI, null, 2)}

STRICT RULES:
1. ONLY reference numbers that exist in the data above. Do NOT invent statistics.
2. Every insight MUST include the actual count or percentage from the data.
3. Explain the "WHY" behind patterns — relate it to academic cycles, seasons, festivals, exam periods, etc.
4. Compare months to identify trends (e.g., "March saw 12 leaves vs February's 8 — a 50% increase likely due to end-of-semester exam stress")
5. Identify the TOP leave reason and explain why it dominates.
6. If faculty data is present, compare student vs faculty patterns.
7. Flag any concerning patterns (e.g., high rejection rates, too many pending requests, unusual spikes).

RESPOND IN THIS EXACT JSON FORMAT:
{
  "executiveSummary": {
    "systemHealth": "GOOD | MODERATE | CRITICAL",
    "headline": "One-line data-backed headline about the current leave situation",
    "summary": "2-3 lines with specific numbers from the data explaining the overall state",
    "keyRisk": "The single most concerning finding with numbers",
    "immediateAction": "One concrete action to take right now"
  },
  "leaveReasonInsights": [
    {
      "reason": "Category name from data",
      "count": actual_number,
      "percentage": calculated_percentage,
      "insight": "Why this reason is high/low and what it means — reference academic cycles, seasons, etc."
    }
  ],
  "monthlyInsights": [
    {
      "month": "YYYY-MM",
      "total": actual_number,
      "insight": "What happened this month and why — compare to other months"
    }
  ],
  "alerts": ["Urgent, specific, number-backed alerts about concerning patterns"],
  "recommendations": ["Actionable, specific recommendations based on the data patterns"],
  "facultyComparison": "MUST be a plain STRING (not an object, not an array). If faculty data exists, write a 1-2 sentence comparison of student vs faculty leave patterns with actual numbers. If no faculty data, return null."
}
`;

    const aiRaw = await callAIWithFallback(prompt);

    // Ensure all critical fields exist
    const finalInsights = {
      executiveSummary: aiRaw.executiveSummary || {
        systemHealth: "MODERATE",
        headline: "Leave intelligence initializing...",
        summary: "Collecting institutional data patterns.",
        keyRisk: "Limited data for analysis",
        immediateAction: "Continue monitoring"
      },
      leaveReasonInsights: Array.isArray(aiRaw.leaveReasonInsights) ? aiRaw.leaveReasonInsights : [],
      monthlyInsights: Array.isArray(aiRaw.monthlyInsights) ? aiRaw.monthlyInsights : [],
      alerts: Array.isArray(aiRaw.alerts) ? aiRaw.alerts : [],
      recommendations: Array.isArray(aiRaw.recommendations) ? aiRaw.recommendations : [],
      // Safety coercion: AI occasionally returns an object here — always stringify it.
      // This prevents React error #31 (objects are not valid React children).
      facultyComparison: aiRaw.facultyComparison
        ? typeof aiRaw.facultyComparison === "string"
          ? aiRaw.facultyComparison
          : JSON.stringify(aiRaw.facultyComparison)
        : null,
      // Also pass the raw data so the frontend can show data visualizations
      rawData: dataForAI,
    };

    return res.json(finalInsights);
  } catch (err) {
    console.error("[getAIInsights] Intelligence Error:", err);
    return res.json({
      executiveSummary: { systemHealth: "MODERATE", headline: "AI temporarily unavailable", summary: "Please retry.", keyRisk: "N/A", immediateAction: "Retry" },
      leaveReasonInsights: [],
      monthlyInsights: [],
      alerts: ["AI analysis temporarily offline. Retry in a moment."],
      recommendations: ["Try refreshing the insights panel."],
      facultyComparison: null,
      rawData: null,
    });
  }
};

// ── Fallback Helpers (Internal) ──────────────────────────────────────────────

const _generateFallback = (type, rawText) => ({
  subject: `${type === "CERTIFICATE" ? "Request for Certificate" : "Leave Application"} - ${rawText.slice(0, 20)}...`,
  body: `I am writing to formally submit a request regarding: ${rawText}. Please consider this application for approval.`,
  extractedStartDate: null,
  extractedEndDate: null,
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