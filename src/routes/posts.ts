import { NextFunction, Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { checkSchema, validationResult } from "express-validator";
import { Document, isValidObjectId } from "mongoose";
import multer, { MulterError } from "multer";
import { verifyTokenAndGetUser } from "../helper/token";
import Post, { IPost } from "../models/Post";
import { getPostValidation } from "./validators";
import Img, { Image } from "../models/Image";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5242880 }, // 5mb
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else {
      const error = new MulterError("LIMIT_UNEXPECTED_FILE", "pfp");
      error.message = "File format should be an image";
      cb(error);
    }
  },
});
const uploadImg = upload.single("image");

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    // possibly can use pagination/infinite scrolling in the future
    const posts = await Post.find().populate("author").exec();
    res.json(posts);
  })
);

// --- CREATE POST ROUTE --- //

router.post("/create", [
  verifyTokenAndGetUser,

  // upload pfp using multer and handle errors if present
  async (req: Request, res: Response, next: NextFunction) => {
    uploadImg(req, res, async (err) => {
      // if is not a multer error
      if (!(err instanceof MulterError)) {
        next(err);
        return;
      }

      // Map multer error to express-validator error
      await checkSchema({
        image: { custom: { errorMessage: err.message } },
      }).run(req);
      next();
    });
  },

  ...getPostValidation(),

  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { title, description, blogContents, topics } = req.body;

    let img;
    if (req.file) {
      img = new Img<Image>({
        data: req.file.buffer,
        contentType: req.file.mimetype,
      });
    }

    const post = new Post({
      author: req.user._id,
      title,
      description,
      blogContents,
      topics,
      image: img?.id,
    });

    await Promise.all([img?.save(), post.save()]);
    res.json(post);
  }),
]);

// --- EDIT POST ROUTE --- //

router.post(
  "/:postId/edit",
  // checks that jwt token is authenticated and sets req.user
  verifyTokenAndGetUser,

  ...getPostValidation(),
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      res.status(400).send("Invalid post id");
      return;
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const post = await Post.findById<IPost & Document>(postId, "author").exec();

    if (post == null) res.status(404).send("404: Post not found");
    else if (!post.author.equals(req.user._id)) res.sendStatus(403);
    else {
      const { title, description, blogContents, topics, isPublished } =
        req.body;

      post.set({
        author: req.user._id,
        title,
        description,
        blogContents,
        topics,
        isPublished,
      });

      await post.save();
      res.json(post);
    }
  })
);

// --- DELETE POST ROUTE --- //

router.delete(
  "/:postId/delete",
  verifyTokenAndGetUser,

  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await Post.findById<IPost>(postId, "author").exec();

    if (!isValidObjectId(postId)) res.status(400).send("Invalid post id");
    else if (post == null) res.status(404).send("404: Post not found");
    else if (!post.author.equals(req.user._id)) res.sendStatus(403);
    else {
      await Post.findByIdAndDelete(postId).exec();
      res.json(post);
    }
  })
);

// --- GET POST ROUTE --- //

router.get(
  "/:postId",
  asyncHandler(async (req: Request, res: Response) => {
    if (!isValidObjectId(req.params.postId)) {
      res.status(400).send("Invalid post id");
    } else {
      const post = await Post.findById(req.params.postId).exec();
      res.json(post);
    }
  })
);

export default router;
