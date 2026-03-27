import LeaveModel from "../models/leave.model.js";

/**
 * Returns { warnings: [], errors: [] } for a student leave submission.
 * errors are blocking, warnings are informational.
 */
export const validateStudentLeaveSubmission = async ({
  studentId,
  subject,
  Reason,
}) => {
  const errors = [];
  const warnings = [];

  // Required field checks
  if (!subject || subject.trim().length < 3) {
    errors.push("Subject is required and must be at least 3 characters.");
  }
  if (!Reason || Reason.trim().length < 10) {
    errors.push("Reason is required and must be at least 10 characters.");
  }

  // Check for too many pending requests
  try {
    const pendingCount = await LeaveModel.countDocuments({
      studentId,
      status: "pending",
    });
    if (pendingCount >= 3) {
      warnings.push(
        `You already have ${pendingCount} pending leave request(s). Consider waiting for them to be processed.`
      );
    }
  } catch (err) {
    console.error("[Validation] Failed pending count check:", err.message);
  }

  // Check leaves submitted in last 24 hours (spam guard)
  try {
    const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await LeaveModel.countDocuments({
      studentId,
      createdAt: { $gte: recentCutoff },
    });
    if (recentCount >= 2) {
      warnings.push("You have submitted multiple leave requests in the past 24 hours.");
    }
  } catch (err) {
    console.error("[Validation] Failed recent count check:", err.message);
  }

  return { errors, warnings };
};
