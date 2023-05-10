import { Router } from "express";
import jwt from "jsonwebtoken";
import { body, validationResult, checkSchema } from "express-validator";
import asyncHandler from "express-async-handler";
import multer from "multer";
import User from "../../models/User";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5242880 }, // 5mb
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("File format should be an image"), false);
    }
  },
});

// Custom middleware function to map multer errors to express-validator errors
const mapMulterErrorToValidationError = async (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    await checkSchema({
      [err.field]: {
        custom: {
          errorMessage: err.message,
        },
      },
    }).run(req);
    next();
  } else {
    next(err);
  }
};

router.post("/register", [
  upload.single("pfp"),
  mapMulterErrorToValidationError,

  body("email")
    .toLowerCase()
    .isEmail()
    .withMessage("Invalid email")
    .custom(async (email) => {
      const emailTaken = await User.exists({ email }).exec();
      if (emailTaken) return Promise.reject();

      return true;
    })
    .withMessage("Email is already taken"),
  body("password")
    .isString()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("displayName")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Display name is required"),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    // if there are errors
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      res.send("you made it!!");
    }
  }),
]);

export default router;
