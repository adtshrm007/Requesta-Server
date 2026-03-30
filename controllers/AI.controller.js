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


/**
 * @description REDESIGNED: Data-First System Insights
 * Computes REAL role-based analytics and uses AI exclusively for interpretation.
 */
export const systemInsights = async (req, res) => {
  try {
    const { role, department } = req.user;
    const isSuperAdmin = role === "Super Admin";
    const adminDeptMatch = isSuperAdmin ? {} : { department: department };

    // ── 1. AGGREGATION PIPELINES ─────────────────────────────────────────────
    
    // A. Leave Type Distribution (Faculty/Admin)
    const leaveTypeDist = await LeaveAdminModel.aggregate([
      { $match: adminDeptMatch },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // B. Student vs Faculty Distribution (Volume)
    // For students, we filter by branch (department) via lookup
    const studentVol = await LeaveModel.aggregate([
      {
        $lookup: {
          from: "studentregisters",
          localField: "studentId",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      { $unwind: "$studentInfo" },
      { $match: isSuperAdmin ? {} : { "studentInfo.branch": department } },
      { $count: "total" }
    ]);

    const facultyVol = await LeaveAdminModel.countDocuments(adminDeptMatch);

    // C. Department-wise Leave Counts (Branch Distribution)
    const branchDist = await LeaveModel.aggregate([
      {
        $lookup: {
          from: "studentregisters",
          localField: "studentId",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      { $unwind: "$studentInfo" },
      { $match: isSuperAdmin ? {} : { "studentInfo.branch": department } },
      { $group: { _id: "$studentInfo.branch", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // D. Certificate Request Trends
    const certTrends = await Certificate.aggregate([
      {
        $lookup: {
          from: "studentregisters",
          localField: "student",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      { $unwind: "$studentInfo" },
      { $match: isSuperAdmin ? {} : { "studentInfo.branch": department } },
      { $group: { _id: "$CertificateType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // E. Approval vs Rejection Rates
    const [studentStatus, facultyStatus] = await Promise.all([
      LeaveModel.aggregate([
        {
          $lookup: { from: "studentregisters", localField: "studentId", foreignField: "_id", as: "si" }
        },
        { $unwind: "$si" },
        { $match: isSuperAdmin ? {} : { "si.branch": department } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      LeaveAdminModel.aggregate([
        { $match: adminDeptMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);

    // F. Average Leave Duration (Faculty)
    const avgDuration = await LeaveAdminModel.aggregate([
      { $match: adminDeptMatch },
      {
        $project: {
          duration: {
            $divide: [
              { $subtract: ["$toDate", "$fromDate"] },
              1000 * 60 * 60 * 24 // Convert ms to days
            ]
          }
        }
      },
      { $group: { _id: null, avgDays: { $avg: "$duration" } } }
    ]);

    // ── 2. PREPARE DATA FOR AI ───────────────────────────────────────────────
    const stats = {
      role,
      department: department || "All",
      totalStudentLeaves: studentVol[0]?.total || 0,
      totalFacultyLeaves: facultyVol,
      leaveTypeDistribution: leaveTypeDist,
      branchDistribution: branchDist,
      certificateTrends: certTrends,
      statusBreakdown: {
        students: studentStatus,
        faculty: facultyStatus
      },
      averageFacultyDuration: avgDuration[0]?.avgDays?.toFixed(1) || 0,
      timestamp: new Date().toISOString()
    };

    // ── 3. AI INTERPRETATION LAYER ───────────────────────────────────────────
    const prompt = `
Analyze institutional request metrics for a ${role} in ${department || "the entire system"}.
DATA: ${JSON.stringify(stats)}

STRICT REQUIREMENTS:
- Reference actual numbers (e.g., "Medical leaves represent X%").
- No generic AI fluff.
- Identify bottlenecks (e.g., "Dept A has Y pending requests").
- Actionable suggestions for a ${role}.
- IMPORTANT: ALL items in "trends", "alerts", and "suggestions" MUST be simple strings. DO NOT return objects.

RETURN JSON:
{
  "trends": ["string"],
  "alerts": ["string"],
  "suggestions": ["string"]
}
`;

    const aiRaw = await callAIWithFallback(prompt);

    // 🛡️ Safety check: Ensure no objects leak into the arrays (prevents React Error #31)
    const sanitize = (arr) => (Array.isArray(arr) ? arr.map(item => (typeof item === 'object' ? JSON.stringify(item) : String(item))) : []);
    
    const aiResponse = {
      trends: sanitize(aiRaw.trends),
      alerts: sanitize(aiRaw.alerts),
      suggestions: sanitize(aiRaw.suggestions)
    };

    return res.json({
      ...aiResponse,
      stats,
    });
  } catch (err) {
    console.error("[systemInsights] Redesign Error:", err);
    return res.json({
      trends: ["Data analysis currently unavailable."],
      alerts: ["System is experiencing high load during aggregation."],
      suggestions: ["Try again in a few minutes."],
      stats: { error: true }
    });
  }
};