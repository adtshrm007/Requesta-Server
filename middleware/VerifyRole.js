/**
 * RBAC Middleware — supports single role or array of allowed roles.
 * Usage: VerifyRole("Super Admin") or VerifyRole(["Super Admin", "Departmental Admin"])
 */
export const VerifyRole = (requiredRole) => {
  return (req, res, next) => {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: `Access denied. Required role(s): ${allowedRoles.join(", ")}` });
    }
    next();
  };
};
