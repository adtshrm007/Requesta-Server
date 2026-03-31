import LeaveModel from "../models/leave.model.js";
import LeaveAdminModel from "../models/LeaveAdmins.model.js";
import Certificate from "../models/certificate.model.js";
import AuditLog from "../models/AuditLog.model.js";
import studentRegister from "../models/studentRegister.model.js";

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
        { $unwind: "$studentInfo" },
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

    const monthMap = {};
    monthlyTrend.forEach(({ _id, count }) => {
      if (!monthMap[_id.month]) {
        monthMap[_id.month] = { month: _id.month, approved: 0, rejected: 0, pending: 0, forwarded: 0 };
      }
      if (_id.status) {
        const statusKey = _id.status.toLowerCase();
        if (monthMap[_id.month].hasOwnProperty(statusKey)) {
          monthMap[_id.month][statusKey] = count;
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
