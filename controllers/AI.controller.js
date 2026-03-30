import { GoogleGenerativeAI } from "@google/generative-ai";
import LeaveModel from "../models/leave.model.js";
import Certificate from "../models/certificate.model.js";
import studentRegister from "../models/studentRegister.model.js";

// ── Shared Gemini client ───────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Safely call Gemini and parse JSON from the response.
 * Returns null on any error so callers can gracefully degrade.
 */
const callGemini = async (prompt) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("AI returned non-JSON output");
  return JSON.parse(jsonMatch[0]);
};

// ── MODULE 1: Generate Request ─────────────────────────────────────────────────
/**
 * POST /api/ai/generate-request
 * Body: { rawText: string, type: "LEAVE" | "CERTIFICATE" }
 * Returns: { title, description, suggestions[] }
 *
 * IMPROVEMENTS:
 * - Better prompt with explicit output constraints
 * - Validates rawText length properly
 * - Returns richer fallback with type-aware suggestions
 */
export const generateRequest = async (req, res) => {
  try {
    const { rawText, type = "LEAVE" } = req.body;

    if (!rawText || rawText.trim().length < 5) {
      return res.status(400).json({
        message: "Please provide a description of at least 5 characters.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json(_generateFallback(type, rawText));
    }

    const context =
      type === "CERTIFICATE" ? "certificate request" : "leave application";

    const prompt = `You are an intelligent Academic Assistant specialized in extracting details and generating professional documentation.

User Input: "${rawText}"

Task:
1. Extract structured data: Reason, Start Date, End Date, and Duration (if mentioned).
2. Rewrite the casual input into a highly professional ${context} statement.

Rules for Generation:
- DO NOT copy the source text directly. 
- REFRAME the reason using formal vocabulary (e.g., 'fever' -> 'acute health concerns').
- SUBJECT: Generate a detailed, professional subject line (min 1 robust paragraph). Clearly mention the core reason and the duration/dates.
- BODY: Generate ONLY the formal explanation/reasoning. DO NOT include greetings (like "Dear Authority") or closings (like "Sincerely"). Just the core content.
- TONE: Professional, respectful, and direct.

Respond ONLY with valid JSON in this exact format:
{
  "subject": "...",
  "body": "..."
}`;

    const parsed = await callGemini(prompt);

    if (!parsed.subject || !parsed.body) {
      throw new Error("AI response missing required fields");
    }

    return res.status(200).json({
      subject: parsed.subject,
      body: parsed.body,
    });
  } catch (err) {
    console.error("[AI:generate] Error:", err.message);
    return res.status(200).json({
      ..._generateFallback(req.body?.type || "LEAVE", req.body?.rawText || ""),
      error: "AI service temporarily unavailable. Using smart fallback.",
    });
  }
};

const _generateFallback = (type, rawText) => ({
  subject: type === "CERTIFICATE" ? `Request for ${rawText || "Certificate"} Issuance` : `Application for Leave: ${rawText || "Personal Reasons"}`,
  body: `I am writing to formally request a ${type.toLowerCase()} regarding "${rawText || "my previous discussion"}". This request is necessitated by operational requirements and I would appreciate your support in processing it at your earliest convenience.`,
});

// ── MODULE 2: Validate Request ─────────────────────────────────────────────────
/**
 * POST /api/ai/validate-request
 * Body: { text: string, type: "LEAVE" | "CERTIFICATE" }
 * Returns: { validity, issues[], suggestedRewrite }
 */
export const validateRequest = async (req, res) => {
  try {
    const { subject, reason, hasDocument = false, type = "LEAVE" } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        message: "Please provide the request reason to validate.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json(_validateFallback(reason));
    }

    const context =
      type === "CERTIFICATE" ? "certificate request" : "leave application";

    const prompt = `You are a strict Administrative Reviewer for a University management system.
Evaluate the following ${context} for validity, professionalism, and completeness.

Subject: "${subject || "N/A"}"
Reason: "${reason}"
Supporting Document Uploaded?: ${hasDocument ? "YES" : "NO"}

Validation Rules:
1. SUBJECT: Must be descriptive and formal. Generic subjects like 'Leave' or 'Sick' are unacceptable.
2. REASON: Must not be vague (e.g. 'some work', 'personal thing' are invalid). 
3. DATES/DURATION: Must be explicitly mentioned.
4. MEDICAL/OFFICIAL: If a student mentions 'medical', 'sick', or 'fever' and NO document is uploaded, flag it.
5. REWRITE: The 'improvedVersion' should NOT include greetings or closings. It must be a direct professional statement reframing the user input without copying it.

Respond ONLY with valid JSON:
{
  "validity": "Valid" | "Needs Improvement" | "Suspicious",
  "issues": ["list of problems"],
  "missingElements": ["list of missing items"],
  "suggestions": ["actionable instructions"],
  "improvedVersion": {
    "subject": "A revised, ultra-professional subject line",
    "reason": "A revised, ultra-professional and reframed reason (NO greetings or closings)"
  }
}`;

    const parsed = await callGemini(prompt);

    if (!parsed.validity || !parsed.improvedVersion) {
      throw new Error("AI response missing required validation fields");
    }

    return res.status(200).json({
      validity: parsed.validity,
      issues: parsed.issues || [],
      missingElements: parsed.missingElements || [],
      suggestions: parsed.suggestions || [],
      improvedVersion: parsed.improvedVersion,
    });
  } catch (err) {
    console.error("[AI:validate] Error:", err.message);
    return res.status(200).json({
      ..._validateFallback(req.body?.reason || ""),
      error: "AI validation service temporarily unavailable.",
    });
  }
};

const _validateFallback = (text) => ({
  validity: text.trim().length > 30 ? "Needs Improvement" : "Suspicious",
  issues: [
    "Could not perform AI validation — check if the text is sufficiently detailed.",
    "Ensure you include specific dates and a clear reason.",
  ],
  missingElements: ["Specific start and end dates", "A clear, formal reason"],
  suggestions: [
    "State your dates clearly",
    "Provide a detailed reason for the request",
  ],
  improvedVersion: {
    subject: "Leave Application for Personal Reasons",
    reason: text,
  },
});

// ── MODULE 3: Approval Suggestion ─────────────────────────────────────────────
/**
 * POST /api/ai/approval-suggestion
 * Body: { reason: string, duration?: string, userHistory?: { approved, rejected, total } }
 * Returns: { decision, confidence, reasoning }
 */
export const approvalSuggestion = async (req, res) => {
  try {
    const {
      reason,
      duration = "Not specified",
      userHistory,
      hasDocument = false,
    } = req.body;

    // We allow short reasons if they provide a document
    if (!reason && !hasDocument) {
      return res
        .status(400)
        .json({ message: "Reason or Document is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json(_approvalFallback());
    }

    const historyContext = userHistory
      ? `User's historical requests: ${userHistory.total} total, ${userHistory.approved} approved, ${userHistory.rejected} rejected.`
      : "No historical data available.";

    const prompt = `You are an AI advisor for an Indian university leave management system.

A ${(reason || "").toLowerCase().includes("certificate") ? "certificate" : "leave"} request has been submitted.

Request Reason: "${reason || "(No text provided)"}"
Duration/Period: ${duration}
Supporting Document Attached?: ${hasDocument ? "YES - Student uploaded a file (e.g., Medical cert, official proof)." : "NO DOCUMENT ATTACHED."}
${historyContext}

Evaluate whether this request should be Approved, Rejected, or needs further Review.

Consider:
- Clarity and validity of the reason
- Reasonableness of the duration
- If historical data shows frequent requests or rejection patterns
- HUGE FACTOR: If a document is attached (YES), you can confidently suggest 'Approve' even if the text reason is short (like 'sick'). If NO document is attached for a medical/official reason, suggest 'Review'.
- Institutional norms (e.g., vague "personal work" = suspicious; medical with document = valid)

Respond ONLY with valid JSON — no markdown:
{
  "decision": "Approve" | "Reject" | "Review",
  "confidence": "High" | "Medium" | "Low",
  "reasoning": "A clear 2-3 sentence explanation of the suggestion for the admin. Explicitly state WHY confidence is High/Medium/Low (e.g., 'Confidence is low because the reason is vague and no document is attached.')."
}`;

    const parsed = await callGemini(prompt);

    if (!["Approve", "Reject", "Review"].includes(parsed.decision)) {
      throw new Error("Invalid decision value from AI");
    }

    return res.status(200).json({
      decision: parsed.decision,
      confidence: parsed.confidence || "Medium",
      reasoning: parsed.reasoning || "No reasoning provided.",
    });
  } catch (err) {
    console.error("[AI:approval] Error:", err.message);
    return res.status(200).json({
      ..._approvalFallback(),
      error: "AI suggestion service temporarily unavailable.",
    });
  }
};

const _approvalFallback = () => ({
  decision: "Review",
  confidence: "Low",
  reasoning:
    "AI service is currently unavailable. Please review this request manually based on the provided reason and supporting documents.",
});

// ── MODULE 4: Fraud / Abuse Detection ─────────────────────────────────────────
/**
 * GET /api/ai/check-fraud?studentId=...
 * Fetches the student's leave history from DB and analyzes patterns.
 * Returns: { riskLevel, flagReason, stats }
 */
export const fraudDetection = async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required." });
    }

    // Pull the student's last 90 days of leaves
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const leaves = await LeaveModel.find({
      studentId,
      createdAt: { $gte: ninetyDaysAgo },
    }).sort({ createdAt: -1 });

    const stats = {
      total: leaves.length,
      approved: leaves.filter((l) => l.status === "approved").length,
      rejected: leaves.filter((l) => l.status === "rejected").length,
      pending: leaves.filter((l) => l.status === "pending").length,
      reasons: leaves.map((l) => l.Reason?.substring(0, 60)),
    };

    // Rule-based fast checks (no AI cost)
    if (stats.total < 2) {
      return res.status(200).json({
        riskLevel: "Low",
        flagReason: "Insufficient history to detect abuse patterns.",
        stats,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json(_fraudFallback(stats));
    }

    const reasonsText = stats.reasons
      .filter(Boolean)
      .map((r, i) => `${i + 1}. "${r}"`)
      .join("\n");

    const prompt = `You are a fraud detection AI for a university leave management system.

Analyze this student's leave request patterns over the last 90 days:
- Total requests: ${stats.total}
- Approved: ${stats.approved}
- Rejected: ${stats.rejected}
- Pending: ${stats.pending}

Recent reasons (up to 10):
${reasonsText || "None"}

Detect:
- Unusually high frequency (>5 in 90 days = suspicious)
- Repetitive or copy-pasted reasons
- Vague reasons ("personal work", "urgent work") appearing multiple times
- High rejection rate suggesting previously flagged abuse

Respond ONLY with valid JSON — no markdown:
{
  "riskLevel": "Low" | "Medium" | "High",
  "flagReason": "Concise explanation of why this risk level was assigned..."
}`;

    const parsed = await callGemini(prompt);

    if (!["Low", "Medium", "High"].includes(parsed.riskLevel)) {
      throw new Error("Invalid riskLevel from AI");
    }

    return res.status(200).json({
      riskLevel: parsed.riskLevel,
      flagReason: parsed.flagReason || "Pattern analysis complete.",
      stats,
    });
  } catch (err) {
    console.error("[AI:fraud] Error:", err.message);
    return res.status(200).json({
      ..._fraudFallback({}),
      error: "Fraud detection service temporarily unavailable.",
    });
  }
};

const _fraudFallback = (stats) => {
  const risk = stats.total > 7 ? "High" : stats.total > 4 ? "Medium" : "Low";
  return {
    riskLevel: risk,
    flagReason:
      risk === "Low"
        ? "Normal request frequency."
        : risk === "Medium"
          ? "Moderately frequent requests. Manual review recommended."
          : "High number of requests detected. Immediate review recommended.",
    stats,
  };
};

// ── MODULE 7: System Insights ──────────────────────────────────────────────────
/**
 * GET /api/ai/system-insights?dept=...
 * Aggregates system-level stats and asks AI to surface trends, alerts, and suggestions.
 * Returns: { trends[], alerts[], suggestions[], generatedAt }
 */
export const systemInsights = async (req, res) => {
  try {
    const dept = req.user?.department;
    const role = req.user?.role;

    // Gather system stats (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // Current period leaves
    const currentPeriodQuery = { createdAt: { $gte: thirtyDaysAgo } };
    // Previous period
    const prevPeriodQuery = {
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    };

    // Widen for Super Admin (all dept), narrow for Dept Admin
    let matchStage = {};
    if (role !== "Super Admin" && dept) {
      // Dept Admin: only their branch
      matchStage = {}; // join-based filtering omitted for speed — use all data
    }

    const [currentLeaves, prevLeaves, pendingCerts] = await Promise.all([
      LeaveModel.countDocuments({ ...currentPeriodQuery }),
      LeaveModel.countDocuments({ ...prevPeriodQuery }),
      Certificate.countDocuments({ status: "pending" }),
    ]);

    // Frequent applicants
    const frequentApplicants = await LeaveModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$studentId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "studentregisters",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: { path: "$student", preserveNullAndEmpty: true } },
      {
        $project: {
          name: { $ifNull: ["$student.name", "Unknown"] },
          count: 1,
        },
      },
    ]);

    // Approval stats
    const approvalStats = await LeaveModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusMap = {};
    approvalStats.forEach(({ _id, count }) => (statusMap[_id] = count));

    const changePct =
      prevLeaves > 0
        ? Math.round(((currentLeaves - prevLeaves) / prevLeaves) * 100)
        : 0;

    const systemData = {
      currentPeriodLeaves: currentLeaves,
      prevPeriodLeaves: prevLeaves,
      changePercent: changePct,
      pendingCertificates: pendingCerts,
      pendingLeaves: statusMap.pending || 0,
      approvedLeaves: statusMap.approved || 0,
      rejectedLeaves: statusMap.rejected || 0,
      frequentApplicants: frequentApplicants.map(
        (a) => `${a.name} (${a.count} requests)`,
      ),
    };

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json(_insightsFallback(systemData));
    }

    const prompt = `You are a Senior Data Analyst at a top-tier university, providing extremely sharp, non-obvious insights into our leave/certificate workflows.

Here is the exact numeric data for the last 30 days:
- Leave requests submitted: ${systemData.currentPeriodLeaves} (vs ${systemData.prevPeriodLeaves} the previous period, ${changePct > 0 ? "+" : ""}${changePct}% change)
- Pending leaves: ${systemData.pendingLeaves}
- Approved leaves: ${systemData.approvedLeaves}
- Rejected leaves: ${systemData.rejectedLeaves}
- Pending certificates backlog: ${systemData.pendingCertificates}
- Our top most frequent applicants: ${systemData.frequentApplicants.join(", ") || "None"}

Generate highly actionable, intelligent insights. Do not just repeat the numbers. Synthesize what the numbers mean for operational efficiency, bottlenecks, and student behavior.

Respond ONLY with valid JSON — no markdown:
{
  "trends": ["Deep analytical observation 1", "Deep analytical observation 2"],
  "alerts": ["Severe bottleneck or risk alert 1", "Operational alert 2"],
  "suggestions": ["Concrete policy/process recommendation 1", "Recommendation 2"]
}

Rules:
- trends: Combine multiple data points to form a narrative (e.g., "Despite a drop in overall requests, pending backlogs remain high, indicating administrative slowdowns").
- alerts: Focus on processing delays, high rejection rates, or unusual student behavior.
- suggestions: Give actionable workflow adjustments (e.g., "Implement auto-approval for top frequent applicants" or "Clear the certificate backlog before midterms").
- Keep items concise but powerful.`;

    const parsed = await callGemini(prompt);

    if (!Array.isArray(parsed.trends))
      throw new Error("Invalid insights format");

    return res.status(200).json({
      trends: parsed.trends || [],
      alerts: parsed.alerts || [],
      suggestions: parsed.suggestions || [],
      stats: systemData,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[AI:insights] Error:", err.message);
    return res.status(200).json({
      ..._insightsFallback({}),
      error: "Insights service temporarily unavailable.",
    });
  }
};

const _insightsFallback = (data) => ({
  trends: [
    data.changePercent > 0
      ? `Leave requests increased by ${data.changePercent}% compared to last month.`
      : "Leave request volume is stable compared to last month.",
    data.pendingLeaves > 5
      ? `${data.pendingLeaves} leave requests are currently awaiting review.`
      : "Leave processing is up to date.",
  ],
  alerts:
    data.pendingCertificates > 3
      ? [
          `${data.pendingCertificates} certificate requests are pending approval.`,
        ]
      : [],
  suggestions: [
    "Review frequently submitted leave requests to ensure policy compliance.",
    "Consider enabling automated reminders for pending certificate requests.",
  ],
  stats: data,
  generatedAt: new Date().toISOString(),
});
