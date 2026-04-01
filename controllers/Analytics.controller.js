import LeaveModel from "../models/leave.model.js";
import LeaveAdminModel from "../models/LeaveAdmins.model.js";
import Certificate from "../models/certificate.model.js";
import AuditLog from "../models/AuditLog.model.js";
import studentRegister from "../models/studentRegister.model.js";
import mongoose from "mongoose";

/**
 * GET /api/analytics/summary
 * Returns aggregated stats for admin dashboard.
 * Accessible by: Departmental Admin, Super Admin
 *
 * IMPROVEMENTS:
 * - Removed department filter for Super Admin (they see all)
 * - Fixed approval/rejection rate calculation (was always 0 for missing statuses)
 * - Added forwarded count to response
 */
export const getSummary = async (req, res) => {
  try {
    const dept = req.user.department;
    const role = req.user.role;
    const isSuperAdmin = role === "Super Admin";

    // ── Student Leaves ────────────────────────────────────────────────────
    const studentLeaveMatch = isSuperAdmin
      ? {} // Super Admin sees all
      : {
          $lookup: {
            from: "studentregisters",
            localField: "studentId",
            foreignField: "_id",
            as: "studentInfo",
          },
        };

    let leaveAgg;
    if (isSuperAdmin) {
      leaveAgg = await LeaveModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
    } else {
      leaveAgg = await LeaveModel.aggregate([
        {
          $lookup: {
            from: "studentregisters",
            localField: "studentId",
            foreignField: "_id",
            as: "studentInfo",
          },
        },
        { $unwind: "$studentInfo" },
        { $match: { "studentInfo.branch": dept } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
    }

    const leaveStats = { total: 0, pending: 0, forwarded: 0, approved: 0, rejected: 0 };
    leaveAgg.forEach(({ _id, count }) => {
      if (_id) leaveStats[_id.toLowerCase()] = count;
      leaveStats.total += count;
    });

    // ── Admin Leaves ──────────────────────────────────────────────────────
    let adminLeaveAgg;
    if (isSuperAdmin) {
      adminLeaveAgg = await LeaveAdminModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
    } else {
      adminLeaveAgg = await LeaveAdminModel.aggregate([
        {
          $lookup: {
            from: "adminregisters",
            localField: "admin",
            foreignField: "_id",
            as: "adminInfo",
          },
        },
        { $unwind: "$adminInfo" },
        { $match: { "adminInfo.department": dept } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
    }

    const adminLeaveStats = { total: 0, pending: 0, approved: 0, rejected: 0 };
    adminLeaveAgg.forEach(({ _id, count }) => {
      if (_id) adminLeaveStats[_id.toLowerCase()] = count;
      adminLeaveStats.total += count;
    });

    // ── Certificates ───────────────────────────────────────────────────────
    let certStats = { total: 0, pending: 0, approved: 0, rejected: 0 };
    if (isSuperAdmin) {
      const certAgg = await Certificate.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      certAgg.forEach(({ _id, count }) => {
        if (_id) certStats[_id.toLowerCase()] = count;
        certStats.total += count;
      });
    }

    // ── Requests over last 30 days (student leaves) ───────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let requestsOverTime;
    if (isSuperAdmin) {
      requestsOverTime = await LeaveModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    } else {
      requestsOverTime = await LeaveModel.aggregate([
        {
          $lookup: {
            from: "studentregisters",
            localField: "studentId",
            foreignField: "_id",
            as: "studentInfo",
          },
        },
        { $unwind: "$studentInfo" },
        {
          $match: {
            "studentInfo.branch": dept,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    }

    // ── Combined totals ───────────────────────────────────────────────────
    const totalRequests = leaveStats.total + adminLeaveStats.total + certStats.total;
    const totalPending = leaveStats.pending + adminLeaveStats.pending + certStats.pending;
    const totalApproved = leaveStats.approved + adminLeaveStats.approved + certStats.approved;
    const totalRejected = leaveStats.rejected + adminLeaveStats.rejected + certStats.rejected;
    const processed = totalApproved + totalRejected;
    const approvalRate = processed > 0 ? Math.round((totalApproved / processed) * 100) : 0;
    const rejectionRate = processed > 0 ? Math.round((totalRejected / processed) * 100) : 0;

    return res.status(200).json({
      totalRequests,
      pendingRequests: totalPending,
      approvedRequests: totalApproved,
      rejectedRequests: totalRejected,
      approvalRate,
      rejectionRate,
      leaveStats,
      adminLeaveStats,
      certStats,
      requestsOverTime,
    });
  } catch (err) {
    console.error("[Analytics:summary] Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * GET /api/analytics/advanced
 * Extended analytics: frequent applicants, leave reasons, department breakdown.
 * Accessible by: Departmental Admin, Super Admin
 */
export const getAdvancedAnalytics = async (req, res) => {
  try {
    const dept = req.user.department;
    const role = req.user.role;
    const isSuperAdmin = role === "Super Admin";

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

    // ── Helper: Branch Match Pipeline ─────────────────────────────────────────
    const getBranchMatch = (studentField) => {
      if (isSuperAdmin) return [];
      return [
        {
          $lookup: {
            from: "studentregisters",
            localField: studentField,
            foreignField: "_id",
            as: "studentInfo",
          },
        },
        { $unwind: { path: "$studentInfo", preserveNullAndEmpty: true } },
        { $match: { "studentInfo.branch": dept } },
      ];
    };

    // ── 1. Top 5 Frequent Applicants (last 30 days) ──────────────────────────
    const frequentApplicants = await LeaveModel.aggregate([
      ...getBranchMatch("studentId"),
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
          regNumber: { $ifNull: ["$student.registrationNumber", "N/A"] },
          branch: { $ifNull: ["$student.branch", "N/A"] },
          count: 1,
        },
      },
    ]);

    // ── 2. Most Common Leave Reasons (keyword extraction via aggregation) ─────
    const reasonGroups = await LeaveModel.aggregate([
      ...getBranchMatch("studentId"),
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $addFields: {
          // 🛡️ Safety Check: Prevent crash if Reason is null or not a string
          safeReason: { $toLower: { $ifNull: ["$Reason", ""] } }
        }
      },
      {
        $addFields: {
          category: {
            $switch: {
              branches: [
                {
                  case: { $regexMatch: { input: "$safeReason", regex: "medical|health|sick|hospital|fever|ill|doctor|surgery|treatment" } },
                  then: "Medical / Health",
                },
                {
                  case: { $regexMatch: { input: "$safeReason", regex: "family|relative|marriage|wedding|death|funeral|emergency" } },
                  then: "Family Emergency",
                },
                {
                  case: { $regexMatch: { input: "$safeReason", regex: "exam|study|test|assignment|project|submission|academic" } },
                  then: "Academic",
                },
                {
                  case: { $regexMatch: { input: "$safeReason", regex: "travel|trip|tour|station|native|hometown|outstation" } },
                  then: "Travel",
                },
                {
                  case: { $regexMatch: { input: "$safeReason", regex: "festival|holiday|celebration|puja|eid|diwali|christmas" } },
                  then: "Festival / Holiday",
                },
                {
                  case: { $regexMatch: { input: "$safeReason", regex: "internship|placement|interview|job|company|corporate" } },
                  then: "Placement / Internship",
                },
              ],
              default: "Other / Personal",
            },
          },
        },
      },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── 3. Approval Trend by Month (last 6 months) ────────────────────────────
    const monthlyTrend = await LeaveModel.aggregate([
      ...getBranchMatch("studentId"),
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: "%Y-%m", date: { $ifNull: ["$createdAt", new Date()] } } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    monthlyTrend.forEach(({ _id, count }) => {
      const mKey = String(_id.month || "Unknown");
      if (!monthMap[mKey]) {
        monthMap[mKey] = { month: mKey, approved: 0, rejected: 0, pending: 0, forwarded: 0 };
      }
      if (_id.status) {
        const statusKey = String(_id.status).toLowerCase();
        if (monthMap[mKey].hasOwnProperty(statusKey)) {
          monthMap[mKey][statusKey] = count;
        }
      }
    });

    // ── 4. Department-wise Distribution (for Super Admin only) ────────────────
    let deptDistribution = [];
    if (isSuperAdmin) {
      deptDistribution = await LeaveModel.aggregate([
        {
          $lookup: {
            from: "studentregisters",
            localField: "studentId",
            foreignField: "_id",
            as: "students",
          },
        },
        { $unwind: { path: "$students", preserveNullAndEmpty: true } },
        {
          $group: {
            _id: { $ifNull: ["$students.branch", "Unknown"] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $project: { department: "$_id", count: 1, _id: 0 } },
      ]);
    }

    // ── 5. Certificate by Type (with isolation) ──────────────────────────────
    const certByType = await Certificate.aggregate([
      ...getBranchMatch("student"),
      { $group: { _id: "$CertificateType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      frequentApplicants,
      leaveReasons: reasonGroups.map(({ _id, count }) => ({ reason: _id, count })),
      monthlyTrend: Object.values(monthMap),
      deptDistribution,
      certByType: certByType.map(({ _id, count }) => ({ type: _id || "Other", count })),
    });
  } catch (err) {
    console.error("[Analytics:advanced] Logic Error:", err);
    return res.status(500).json({ 
      message: "Server error during data aggregation", 
      error: err.message 
    });
  }
};
/**
 * GET /api/analytics/decision-intelligence
 * Production-level data layer providing role-based metrics for the AI Engine.
 */
export const getDecisionIntelligence = async (req, res) => {
  try {
    const { timeRange = "30d" } = req.query;
    const { id, role, department } = req.user;
    const isSuperAdmin = role === "Super Admin";
    const isDeptAdmin = role === "Departmental Admin";
    const isFaculty = role === "Faculty";

    const now = new Date();
    const rangeDate = timeRange === "30d" 
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) 
      : new Date(0); // All time

    const baseMatch = { createdAt: { $gte: rangeDate } };
    
    // ── 1. Aggregation Pipelines ───────────────────────────────────────────
    
    // Helper: Match by Department if not Super Admin
    const getDeptMatch = () => {
      if (isSuperAdmin) return {};
      return { "si.branch": department };
    };

    // a. Leave Requests (Recent Summary)
    const leaveRequests = await LeaveModel.aggregate([
      { $match: baseMatch },
      {
        $lookup: {
          from: "studentregisters",
          localField: "studentId",
          foreignField: "_id",
          as: "si",
        },
      },
      { $unwind: "$si" },
      { $match: getDeptMatch() },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      { $project: { type: 1, status: 1, Reason: 1, createdAt: 1, days: 1 } }
    ]);

    // b. Certificate Requests (Recent Summary)
    const certificateRequests = await Certificate.aggregate([
      { $match: baseMatch },
      {
        $lookup: {
          from: "studentregisters",
          localField: "student",
          foreignField: "_id",
          as: "si",
        },
      },
      { $unwind: "$si" },
      { $match: getDeptMatch() },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      { $project: { CertificateType: 1, status: 1, purpose: 1, createdAt: 1 } }
    ]);

    // c. Approval Stats
    const approvalStatsAgg = await LeaveModel.aggregate([
      { $match: baseMatch },
      {
        $lookup: {
          from: "studentregisters",
          localField: "studentId",
          foreignField: "_id",
          as: "si",
        },
      },
      { $unwind: "$si" },
      { $match: getDeptMatch() },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const approvalStats = { approved: 0, rejected: 0, pending: 0 };
    approvalStatsAgg.forEach(s => {
      if (s._id === "approved") approvalStats.approved = s.count;
      if (s._id === "rejected") approvalStats.rejected = s.count;
      if (s._id === "pending") approvalStats.pending = s.count;
    });

    // d. Requests By Date (30-day time series)
    const requestsByDate = await LeaveModel.aggregate([
      { $match: baseMatch },
      {
        $lookup: {
          from: "studentregisters",
          localField: "studentId",
          foreignField: "_id",
          as: "si",
        },
      },
      { $unwind: "$si" },
      { $match: getDeptMatch() },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          requests: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // e. Leave Types & Top Reasons
    const leaveTypesAgg = await LeaveModel.aggregate([
      { $match: baseMatch },
      {
        $lookup: {
          from: "studentregisters",
          localField: "studentId",
          foreignField: "_id",
          as: "si",
        },
      },
      { $unwind: "$si" },
      { $match: getDeptMatch() },
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    const leaveTypes = leaveTypesAgg.map(lt => ({ type: lt._id, count: lt.count }));

    const topReasons = await LeaveModel.aggregate([
      { $match: baseMatch },
      {
        $lookup: {
          from: "studentregisters",
          localField: "studentId",
          foreignField: "_id",
          as: "si",
        },
      },
      { $unwind: "$si" },
      { $match: getDeptMatch() },
      { $group: { _id: "$Reason", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { reason: "$_id", count: 1, _id: 0 } }
    ]);

    // f. Processing Times (Calculating SLA)
    const processingTimesAgg = await AuditLog.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: "$requestId",
          created: { $min: { $cond: [{ $eq: ["$action", "REQUEST_CREATED"] }, "$createdAt", null] } },
          resolved: { $max: { $cond: [{ $in: ["$action", ["REQUEST_APPROVED", "REQUEST_REJECTED", "REQUEST_FORWARDED"]] }, "$createdAt", null] } }
        }
      },
      { $project: { duration: { $subtract: ["$resolved", "$created"] } } },
      { $match: { duration: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$duration" } } }
    ]);
    const avgResponseTimeHours = processingTimesAgg[0]?.avg ? (processingTimesAgg[0].avg / (1000 * 60 * 60)).toFixed(1) : "0";

    // g. Admin Actions (Performance Comparison)
    const adminActions = await AuditLog.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: "$performedBy",
          admin: { $first: "$performedByName" },
          totalActions: { $sum: 1 },
          approvals: { $sum: { $cond: [{ $eq: ["$action", "REQUEST_APPROVED"] }, 1, 0] } },
          rejections: { $sum: { $cond: [{ $eq: ["$action", "REQUEST_REJECTED"] }, 1, 0] } },
        }
      },
      { $project: {
          admin: 1,
          totalActions: 1,
          approvalRate: { $concat: [{ $toString: { $round: [{ $multiply: [{ $divide: ["$approvals", "$totalActions"] }, 100] }, 1] } }, "%"] }
        }
      }
    ]);

    // Combine everything into the user-specified INPUT structure
    const analyticsData = {
      role,
      data: {
        leaveRequests,
        certificateRequests,
        approvalStats,
        requestsByDate,
        leaveTypes,
        topReasons,
        processingTimes: [{ type: "LEAVE", avgTime: `${avgResponseTimeHours}h` }], // Simplified for AI interpretation
        adminActions
      }
    };

    return res.status(200).json({ role, timeRange, data: analyticsData });
  } catch (err) {
    console.error("[getDecisionIntelligence] Error:", err);
    return res.status(500).json({ message: "Analytics Error", error: err.message });
  }
};
