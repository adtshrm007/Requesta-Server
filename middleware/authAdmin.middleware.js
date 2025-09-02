import jwt from "jsonwebtoken";
import AdminRegister from "../models/adminRegister.model.js";

export const verifyAccessToken1 = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const admin = await AdminRegister.findOne({
      adminID: decoded.adminID,
    });

    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    req.user = {
      id: admin._id,
      adminID: admin.adminID,
      name: admin.name,
      email: admin.email,
      department: admin.department,
      role:admin.role,
      pendingLeaveRequests: admin.pendingLeaveRequests,
      acceptedLeaveRequets: admin.acceptedLeaveRequests,
      rejectedLeaveRequets: admin.rejectedLeaveRequests,
      pendingCertificateRequets: admin.pendingCertificateRequests,
      acceptedCertificateRequets: admin.acceptedCertificateRequests,
      rejectedCertificateRequets: admin.rejectedCertificateRequests,
      refreshToken: admin.refreshToken,
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};


