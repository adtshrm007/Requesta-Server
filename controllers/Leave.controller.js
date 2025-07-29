import LeaveModel from "../models/leave.model";

const handleLeaves = async (req, res) => {
  try {
    const { StudentName, Reason, status, SupportingDocument } = req.body;

    const newLeaveApplication = new LeaveModel({
      StudentName,
      Reason,
      status,
      SupportingDocument,
    });
    await newLeaveApplication.save();

    res
      .status(201)
      .json({ message: "Leave Application Send", data: newLeaveApplication });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default handleLeaves;
