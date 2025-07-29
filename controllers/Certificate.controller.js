import Certificate from "../models/certificate.model";

const handleCertificates = async (req, res) => {
  try {
    const { StudentName, CertificateType, Status, RequiredDocuments } =
      req.body;

    const newCertificate = new Certificate({
      StudentName,
      CertificateType,
      Status,
      RequiredDocuments,
    });
    await newCertificate.save();

    res
      .status(201)
      .json({ message: "Certificate Application Send", data: newCertificate });
  } catch (err) {

     res.status(500).json({ error: err.message });
    
  }
};

export default handleCertificates
