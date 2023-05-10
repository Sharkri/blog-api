import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { body, validationResult, checkSchema } from "express-validator";
import asyncHandler from "express-async-handler";
import multer, { MulterError } from "multer";
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
      const error = new MulterError(400, "pfp");
      error.message = "File format should be an image";

      cb(error);
    }
  },
});

const signToken = async (payload) =>
  new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
      (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      }
    );
  });

const uploadPfp = upload.single("pfp");

router.post("/register", [
  // upload pfp using multer
  asyncHandler((req, res, next) => {
    uploadPfp(req, res, async (err) => {
      // Map multer errors to express-validator errors
      if (err instanceof MulterError) {
        await checkSchema({
          [err.field]: {
            custom: { errorMessage: err.message },
          },
        }).run(req);

        next();
      } else {
        // unknown error
        next(err);
      }
    });
  }),

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

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const { email, displayName, password } = req.body;
    const pfp = req.file;

    // if there are any errors
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      displayName,
      password: hashedPassword,
      pfp: pfp
        ? { data: req.file.buffer, contentType: req.file.mimetype }
        : undefined,
    });

    await user.save();

    const token = await signToken({ user });
    res.json(token);
  }),
]);

export default router;
