import { NextFunction, Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import { checkSchema } from "express-validator";
import asyncHandler from "express-async-handler";
import multer, { MulterError } from "multer";
import { IUser, User } from "../models/User";
import { Image, IImage } from "../models/Image";
import { signToken, getUser } from "../helper/token";
import {
  validateLoginAndGetUser,
  validateRegisterBody,
  validateUpdateUserBody,
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

async function uploadPfp(req: Request, res: Response, next: NextFunction) {
  const uploadFn = upload.single("pfp");
  uploadFn(req, res, async (err) => {
    if (!(err instanceof MulterError)) next(err);
    else {
      await checkSchema({
        pfp: { custom: { errorMessage: err.message } },
      }).run(req);
      next();
    }
  });
}

// --- REGISTER USER ROUTE --- //

router.post("/register", [
  uploadPfp,
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

// --- UPDATE USER ROUTE --- //

router.put("/", [
  getUser,
  // if no user then send unauthorized status
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) res.sendStatus(403);
    else next();
  },

  uploadPfp,
  ...validateUpdateUserBody(),
  asyncHandler(async (req, res) => {
    const { displayName, oldPassword, newPassword } = req.body;
    const pfp = req.file
      ? new Image<IImage>({
          data: req.file.buffer,
          contentType: req.file.mimetype,
        })
      : undefined;

    const newUserData: Partial<IUser> = {};
    // conditionally add updated values if they are present
    if (displayName) newUserData.displayName = displayName;
    if (oldPassword && newPassword) {
      // Note: we already checked if passwords match in the validation middleware
      newUserData.password = await bcrypt.hash(newPassword, 10);
    }
    if (pfp) newUserData.pfp = pfp.id;
    // if req.file was explicity set to null, then remove pfp
    else if (req.body.pfp === "null") newUserData.pfp = undefined;

    req.user.set(newUserData);

    await Promise.all([pfp?.save(), req.user.save()]);

    res.sendStatus(200);
  }),
]);

// --- GET USER BY TOKEN ROUTE --- //
router.get("/", [
  getUser,
  asyncHandler(async (req, res) => {
    res.json({ ...req.user.toJSON(), password: "" });
  }),
]);

export default router;
