import AuditLog from "../models/AuditLog.model.js";

/**
 * Creates an audit log entry.
 * @param {Object} params
 * @param {string} params.requestId
 * @param {string} params.requestType  - "LEAVE" | "ADMIN_LEAVE" | "CERTIFICATE"
 * @param {string} params.action       - "REQUEST_CREATED" | "REQUEST_FORWARDED" | "REQUEST_APPROVED" | "REQUEST_REJECTED"
 * @param {string} params.performedBy  - ObjectId of actor
 * @param {string} params.performedByName
 * @param {string} params.role         - role of actor
 * @param {string} [params.remarks]
 */
export const createLog = async ({
  requestId,
  requestType,
  action,
  performedBy,
  performedByName,
  role,
  remarks = null,
}) => {
  try {
    const log = new AuditLog({
      requestId,
      requestType,
      action,
      performedBy,
      performedByName,
      role,
      remarks,
    });
    await log.save();
    return log;
  } catch (err) {
    // Audit log failures should not break the main request flow
    console.error("[AuditLog] Failed to create log:", err.message);
    return null;
  }
};

/**
 * Retrieves all audit logs for a request, sorted chronologically.
 * @param {string} requestId
 */
export const getLogsForRequest = async (requestId) => {
  return AuditLog.find({ requestId }).sort({ createdAt: 1 });
};
