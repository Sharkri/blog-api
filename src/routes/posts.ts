import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import { isValidObjectId } from "mongoose";
import { verifyTokenAndGetUser } from "../helper/token";
import Post, { IPost } from "../models/Post";
import { getPostValidation } from "./validators";

const router = Router();

router.get("/", (req, res) => res.send("NOT IMPLEMENTED YET"));

router.post("/create", [
  verifyTokenAndGetUser,

  ...getPostValidation(),

  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { title, description, blogContents, topics } = req.body;

    const post = new Post({
      author: req.user._id,
      title,
      description,
      blogContents,
      topics,
    });

    await post.save();
    res.json(post);
  }),
]);

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

    const post = await Post.findById<IPost>(postId, "author").exec();

    if (post == null) res.status(404).send("Post not found");
    else if (!post.author.equals(req.user._id)) res.sendStatus(403);
    else {
      const { title, description, blogContents, topics, isPublished } =
        req.body;

      const updatedPost = new Post<IPost>({
        author: req.user._id,
        title,
        description,
        blogContents,
        topics,
        isPublished,
        _id: post._id, // required or else post will be assigned a new _id
      });

      await Post.findByIdAndUpdate(postId, updatedPost).exec();
      res.json(updatedPost);
    }
  })
);

router.post(
  "/:postId/delete",
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

    const post = await Post.findById<IPost>(postId, "author").exec();

    if (post == null) res.status(404).send("Post not found");
    else if (!post.author.equals(req.user._id)) res.sendStatus(403);
    else {
      const { title, description, blogContents, topics, isPublished } =
        req.body;

      const updatedPost = new Post<IPost>({
        author: req.user._id,
        title,
        description,
        blogContents,
        topics,
        isPublished,
        _id: post._id, // required or else post will be assigned a new _id
      });

      await Post.findByIdAndUpdate(postId, updatedPost).exec();
      res.json(updatedPost);
    }
  })
);

export default router;
