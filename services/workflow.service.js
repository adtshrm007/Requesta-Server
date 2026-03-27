/**
 * Workflow Service — enforces RBAC transitions for all request types.
 *
 * Student leave workflow:
 *   PENDING  → Faculty can FORWARD or REJECT → FORWARDED / REJECTED
 *   PENDING or FORWARDED → DeptAdmin can APPROVE or REJECT directly
 *   SuperAdmin: BLOCKED on student leaves entirely
 *
 * Admin leave workflow:
 *   Faculty leave   → DeptAdmin can APPROVE/REJECT
 *   DeptAdmin leave → SuperAdmin can APPROVE/REJECT
 *
 * Certificate workflow:
 *   SuperAdmin only can APPROVE/REJECT
 */

// ─── Student Leave Workflow ───────────────────────────────────────────────────

/**
 * Returns { allowed: bool, reason: string } for a student leave action.
 * @param {string} actorRole    - "Faculty" | "Departmental Admin" | "Super Admin"
 * @param {string} targetStatus - the status actor wants to set
 * @param {string} currentStatus - current status of the leave
 */
export function canActOnStudentLeave(actorRole, targetStatus, currentStatus) {
  // Block actions on already-completed requests
  if (currentStatus === "approved" || currentStatus === "rejected") {
    return { allowed: false, reason: "This request has already been completed and cannot be modified." };
  }

  if (actorRole === "Super Admin") {
    return { allowed: false, reason: "Super Admin cannot act on student leave requests." };
  }

  if (actorRole === "Faculty") {
    // Faculty can ONLY forward or reject — NOT approve
    if (targetStatus === "approved") {
      return { allowed: false, reason: "Faculty cannot approve student leave requests. You may only forward or reject." };
    }
    if (!["forwarded", "rejected"].includes(targetStatus)) {
      return { allowed: false, reason: "Faculty can only forward or reject student leave requests." };
    }
    if (currentStatus !== "pending") {
      return { allowed: false, reason: "Faculty can only act on leaves that are currently pending." };
    }
    return { allowed: true };
  }

  if (actorRole === "Departmental Admin") {
    // DeptAdmin can approve or reject at any point (pending or forwarded)
    if (!["approved", "rejected"].includes(targetStatus)) {
      return { allowed: false, reason: "Departmental Admin can only approve or reject student leave requests." };
    }
    // Allow both pending (direct) and forwarded (after faculty)
    if (!["pending", "forwarded"].includes(currentStatus)) {
      return { allowed: false, reason: "Departmental Admin can only act on pending or forwarded leaves." };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Unknown or unauthorized role." };
}

// ─── Admin Leave Workflow ─────────────────────────────────────────────────────

/**
 * Returns { allowed: bool, reason: string } for an admin leave action.
 * @param {string} actorRole     - role of the person taking action
 * @param {string} submitterRole - role of the person who submitted the leave
 * @param {string} targetStatus  - status actor wants to set
 * @param {string} currentStatus - current leave status
 */
export function canActOnAdminLeave(actorRole, submitterRole, targetStatus, currentStatus) {
  // Block actions on already-completed requests
  if (currentStatus === "approved" || currentStatus === "rejected") {
    return { allowed: false, reason: "This leave has already been processed and cannot be modified." };
  }

  if (!["approved", "rejected"].includes(targetStatus)) {
    return { allowed: false, reason: "Only approve or reject are valid actions for admin leaves." };
  }

  // Faculty leave → Departmental Admin is authority
  if (submitterRole === "Faculty") {
    if (actorRole !== "Departmental Admin") {
      return {
        allowed: false,
        reason: `Only Departmental Admin can approve/reject Faculty leave. You are ${actorRole}.`,
      };
    }
    return { allowed: true };
  }

  // Departmental Admin leave → Super Admin is authority
  if (submitterRole === "Departmental Admin") {
    if (actorRole !== "Super Admin") {
      return {
        allowed: false,
        reason: `Only Super Admin can approve/reject Departmental Admin leave. You are ${actorRole}.`,
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Unknown submitter role." };
}

// ─── Certificate Workflow ─────────────────────────────────────────────────────

/**
 * Returns { allowed: bool, reason: string } for certificate actions.
 * Only Super Admin can approve/reject certificates.
 * @param {string} actorRole
 * @param {string} currentStatus
 */
export function canActOnCertificate(actorRole, currentStatus) {
  if (actorRole !== "Super Admin") {
    return {
      allowed: false,
      reason: "Only Super Admin can approve or reject certificate requests.",
    };
  }
  if (currentStatus === "approved" || currentStatus === "rejected") {
    return { allowed: false, reason: "This certificate has already been processed." };
  }
  return { allowed: true };
}

/**
 * Can a given role VIEW certificates?
 * @param {string} role
 */
export function canViewCertificates(role) {
  if (role !== "Super Admin") {
    return { allowed: false, reason: "Only Super Admin can view certificate requests." };
  }
  return { allowed: true };
}
