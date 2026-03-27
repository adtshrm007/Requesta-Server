/**
 * Workflow Service — enforces RBAC transitions for all request types.
 *
 * Leave workflow (student):
 *   PENDING  →  Faculty can FORWARD  →  FORWARDED
 *   FORWARDED → DeptAdmin can APPROVE/REJECT
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
 * @param {string} actorRole  - "Faculty" | "Departmental Admin" | "Super Admin"
 * @param {string} targetStatus - the status actor wants to set
 * @param {string} currentStatus - current status of the leave
 */
export function canActOnStudentLeave(actorRole, targetStatus, currentStatus) {
  if (actorRole === "Super Admin") {
    return { allowed: false, reason: "Super Admin cannot act on student leave requests." };
  }

  if (actorRole === "Faculty") {
    if (targetStatus !== "forwarded") {
      return { allowed: false, reason: "Faculty can only forward student leave requests, not approve or reject." };
    }
    if (currentStatus !== "pending") {
      return { allowed: false, reason: "Faculty can only forward leaves that are currently pending." };
    }
    return { allowed: true };
  }

  if (actorRole === "Departmental Admin") {
    if (!["approved", "rejected"].includes(targetStatus)) {
      return { allowed: false, reason: "Departmental Admin can only approve or reject student leave requests." };
    }
    if (!["pending", "forwarded"].includes(currentStatus)) {
      return { allowed: false, reason: "Departmental Admin can only act on pending or forwarded leaves." };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Unknown role." };
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
  if (!["approved", "rejected"].includes(targetStatus)) {
    return { allowed: false, reason: "Only approve or reject are valid actions for admin leaves." };
  }

  if (currentStatus !== "pending") {
    return { allowed: false, reason: "This leave has already been processed." };
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
 */
export function canActOnCertificate(actorRole, currentStatus) {
  if (actorRole !== "Super Admin") {
    return {
      allowed: false,
      reason: "Only Super Admin can approve or reject certificate requests.",
    };
  }
  if (currentStatus !== "pending") {
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
