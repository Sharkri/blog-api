import { Request, Router } from "express";
import bcrypt from "bcrypt";
import { body, validationResult, checkSchema } from "express-validator";
import asyncHandler from "express-async-handler";
import multer, { MulterError } from "multer";
import { isValidObjectId } from "mongoose";
import UserModel, { User } from "../models/User";
import Img from "../models/Image";
import { signToken } from "../helper/token";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5242880 }, // 5mb
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      const error = new MulterError("LIMIT_UNEXPECTED_FILE", "pfp");
      error.message = "File format should be an image";

      cb(error);
    }
  },
});

const uploadPfp = upload.single("pfp");

router.post("/register", [
  // upload pfp using multer
  asyncHandler((req: Request, res, next) => {
    uploadPfp(req, res, async (err) => {
      // Map multer error to express-validator error
      if (err instanceof MulterError) {
        await checkSchema({
          pfp: {
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
      const emailTaken = await UserModel.exists({ email }).exec();
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

    // if there are any errors
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const pfp = req.file
      ? new Img({
          image: { data: req.file.buffer, contentType: req.file.mimetype },
        })
      : undefined;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel<User>({
      email,
      displayName,
      password: hashedPassword,
      pfp: pfp?.id,
    });

    // since order does not matter, do all at once.
    const [token] = await Promise.all([
      signToken(user.toJSON()),
      pfp?.save(),
      user.save(),
    ]);

    res.json(token);
  }),
]);

router.post(
  "/login",

  [
    body("email")
      .toLowerCase()
      .isEmail()
      .withMessage("Invalid email")
      // check if user exists
      .custom(async (email, { req }) => {
        const user = await UserModel.findOne({ email }).exec();

        if (!user) return Promise.reject();
        // user exists, set req.user = user
        req.user = user;

        return true;
      })
      .withMessage("User with the specified email does not exist."),
    // check if correct password entered
    body("password")
      .custom(async (password, { req }) => {
        // since no user found, we already know the password is invalid
        if (!req.user) return true;

        const isSamePass = await bcrypt.compare(password, req.user.password);
        if (!isSamePass) return Promise.reject();
        return true;
      })
      .withMessage("Incorrect password"),

    asyncHandler(async (req, res) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
      } else {
        const token = await signToken(req.user.toJSON());
        res.json(token);
      }
    }),
  ]
);

router.get(
  "/:userId",
  asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.userId)) {
      res.status(400).send({ message: "Invalid user id" });
      return;
    }

    const user = await UserModel.findById(req.params.userId).exec();

    if (!user) {
      res.status(400).send({ message: "User not found" });
    } else {
      res.json(user);
    }
  })
);

export default router;
