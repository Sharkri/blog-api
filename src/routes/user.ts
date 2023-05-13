import { NextFunction, Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { validationResult, checkSchema } from "express-validator";
import asyncHandler from "express-async-handler";
import multer, { MulterError } from "multer";
import { isValidObjectId } from "mongoose";
import { IUser, User } from "../models/User";
import { Image, IImage } from "../models/Image";
import { signToken } from "../helper/token";
import {
  getLoginValidationAndUser,
  getUserRegisterValidation,
} from "./validators";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 4194304 }, // 4mb
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

// --- REGISTER USER ROUTE --- //

router.post("/register", [
  // upload pfp using multer and handle errors if present
  async function uploadPfp(req: Request, res: Response, next: NextFunction) {
    const uploadFn = upload.single("pfp");

    uploadFn(req, res, async (err) => {
      if (!(err instanceof MulterError)) {
        next(err);
        return;
      }

      // Map multer error to express-validator error
      await checkSchema({
        pfp: {
          custom: { errorMessage: err.message },
        },
      }).run(req);
      next();
    });
  },

  ...getUserRegisterValidation(),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    const { email, displayName, password } = req.body;

    // if there are any errors
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const pfp = req.file
      ? new Image<IImage>({
          data: req.file.buffer,
          contentType: req.file.mimetype,
        })
      : undefined;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User<IUser>({
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

// --- LOGIN ROUTE --- //

router.post(
  "/login",

  [
    ...getLoginValidationAndUser(),

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

// --- GET USER BY ID ROUTE --- //

router.get(
  "/:userId",
  asyncHandler(async (req, res) => {
    if (!isValidObjectId(req.params.userId)) {
      res.status(400).send({ message: "Invalid user id" });
      return;
    }

    const user = await User.findById<IUser>(req.params.userId).exec();

    if (!user) {
      res.status(400).send({ message: "User not found" });
    } else {
      res.json(user);
    }
  })
);

export default router;
