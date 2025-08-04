import jwt from "jsonwebtoken";
import Student from "../models/studentRegister.model.js";

export const verifyAccessToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const student = await Student.findOne({ registrationNumber: decoded.registrationNumber });

    if (!student) {
      return res.status(403).json({ message: "Student not found" });
    }

    req.user = {
      id: student._id,
      registrationNumber: student.registrationNumber,
      name: student.name,
      branch: student.branch,
      year: student.year,
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
