import { NextFunction, Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { checkSchema } from "express-validator";
import asyncHandler from "express-async-handler";
import multer, { MulterError } from "multer";
import { IUser, User } from "../models/User";
import { Image, IImage } from "../models/Image";
import { signToken, verifyTokenAndGetUser } from "../helper/token";
import { validateLoginAndGetUser, validateRegisterBody } from "./validators";

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

  ...validateRegisterBody(),

  asyncHandler(async (req, res) => {
    const { email, displayName, password } = req.body;

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
      role: "user",
    });

    // since order does not matter, do all at once.
    const [token] = await Promise.all([
      signToken({ id: user.id }),
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
    ...validateLoginAndGetUser(),
    asyncHandler(async (req, res) => {
      const token = await signToken({ id: req.user.id });
      res.json(token);
    }),
  ]
);

// --- GET USER BY TOKEN ROUTE --- //
router.get("/", [verifyTokenAndGetUser, asyncHandler(async (req) => req.user)]);

export default router;
