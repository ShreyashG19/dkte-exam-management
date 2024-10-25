const Admin = require("../models/Admin.models");
const College = require("../models/College.models");
const City = require("../models/City.models");

const Joi = require("joi");
const jwt = require("jsonwebtoken");

const adminAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isApproved) {
      return res.status(403).json({ message: "You do not have admin access" });
    }

    // (Optional) Check if session has expired (if session management implemented)
    const sessionExpiry = admin.sessionExpiry; // Assuming there's a sessionExpiry field in Admin model
    if (sessionExpiry && new Date() > sessionExpiry) {
      return res
        .status(403)
        .json({ message: "Session has expired. Please log in again." });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: "Server error during authentication",
      error: error.message,
    });
  }
};

const collgeSchema = Joi.object({
  name: Joi.string().required(),
  city: Joi.string().required(),
});

const collegeAuth = async (req, res, next) => {
  try {
    const { error } = collgeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }
    const { college, city } = await College.findOne({
      name: req.body.name,
      city: req.body.city,
    });
    if (college || city) {
      return res.status(400).json({
        message: `${college} already exists at ${city}`,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: "Server error during authentication",
      error: error.message,
    });
  }
};

const citySchema = Joi.object({
  cityName: Joi.string().required(),
});

const cityAuth = async (req, res, next) => {
  try {
    const { error } = citySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }
    const city = await City.findOne({ cityName: req.body.cityName });
    if (city) {
      return res.status(400).json({
        message: "City already exists",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: "Server error during authentication",
      error: error.message,
    });
  }
};

const adminSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const registerValidation = (req, res, next) => {
  const { error } = adminSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  next();
};

const loginValidation = (req, res, next) => {
  const { email, password } = req.body;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate({ email, password });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  next();
};

const authenticateSuperAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isSuperAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    req.user = admin; // Attach the admin to the request
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// ExamConfig validation schema
const examConfigSchema = Joi.object({
    examTitle: Joi.string().required(),
    examDate: Joi.date().required(),
    description: Joi.string().optional(),
});

// Announcement validation schema
const announcementSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    examDate: Joi.date().required(),
});

const validateExamConfig = (req, res, next) => {
    const { error } = examConfigSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

const validateAnnouncement = (req, res, next) => {
  const { error } = announcementSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = {
  adminAuth,
  cityAuth,
  collegeAuth,
  registerValidation,
  authenticateSuperAdmin,
  validateAnnouncement,
  validateExamConfig,
  loginValidation
};
