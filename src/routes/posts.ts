import { NextFunction, Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { Document, isValidObjectId } from "mongoose";
import { getUser } from "../helper/token";
import { Post, IPost } from "../models/Post";
import { validateCommentBody, validatePostBody } from "./validators";
import { Comment, IComment } from "../models/Comment";
import generateUsername from "../helper/random-username";

const router = Router();

const onlyAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") res.sendStatus(403);
  else next();
};

router.get(
  "/",
  getUser,
  asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user && req.user.role === "admin";
    const query = isAdmin ? {} : { isPublished: true };

    // possibly can use pagination/infinite scrolling in the future
    const posts = await Post.find(query)
      .sort({ createdAt: "desc" })
      .populate("author", "-password");
    res.json(posts);
  })
);

// --- CREATE POST ROUTE --- //

router.post("/", [
  getUser,
  onlyAdmin,

  ...validatePostBody(),

  asyncHandler(async (req: Request, res: Response) => {
    const { title, blogContents, topics } = req.body;

    const post = new Post({
      author: req.user._id,
      title,
      blogContents,
      topics,
    });

    await post.save();
    res.json(post);
  }),
]);

// --- CREATE COMMENT ROUTE --- //

router.post(
  "/:postId/comments",
  ...validateCommentBody(),
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      res.status(400).send("Invalid post id");
      return;
    }

    const post = await Post.findById<IPost & Document>(postId).exec();

    if (!post) res.sendStatus(404);
    else {
      const { text } = req.body;
      const { clientIp } = req;

      let name;
      const clientIpComment = await Comment.findOne({ clientIp }, "name");
      if (clientIpComment) name = clientIpComment.name;
      else name = generateUsername();

      const comment = new Comment<IComment>({
        name,
        text,
        clientIp,
      });

      post.comments.push(comment.id);
      await Promise.all([comment.save(), post.save()]);
      res.json(comment);
    }
  })
);

// --- DELETE COMMENT ROUTE --- //

router.delete(
  "/:postId/comments/:commentId",
  asyncHandler(async (req, res) => {
    const { postId, commentId } = req.params;
    if (!isValidObjectId(postId) || !isValidObjectId(commentId)) {
      res.status(400).send("Invalid post/comment id");
      return;
    }
    const post = await Post.findById<IPost & Document>(postId);
    if (!post) {
      res.sendStatus(404);
      return;
    }

    const comment = await Comment.findById<IComment & Document>(commentId);
    if (!comment) res.sendStatus(404);
    else {
      const isSameIp = comment.clientIp === req.clientIp;
      if (!isSameIp) res.sendStatus(403);

      // delete comment from db and remove reference to comment from post
      post.comments = post.comments.filter((c) => c.id === comment.id);
      await Promise.all([post.save(), comment.deleteOne()]);
      res.json(comment);
    }
  })
);

// --- CREATE REPLY ROUTE --- //

router.post(
  "/:postId/comments/:commentId/reply",
  ...validateCommentBody(),

  asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
      res.status(400).send("Invalid post id");
      return;
    }

    const comment = await Comment.findById<IComment & Document>(commentId);

    if (!comment) res.sendStatus(404);
    else {
      const { text } = req.body;
      const { clientIp } = req;
      let name;
      const clientIpComment = await Comment.findOne({ clientIp }, "name");
      if (clientIpComment) name = clientIpComment.name;
      else name = generateUsername();

      const reply = new Comment<IComment>({ name, text, clientIp });

      if (!comment.replies) comment.replies = [];
      comment.replies.push(reply.id);

      await Promise.all([comment.save(), reply.save()]);
      res.json(reply);
    }
  })
);

// --- EDIT POST ROUTE --- //

router.put(
  "/:postId",
  // checks that jwt token is authenticated and sets req.user
  getUser,
  onlyAdmin,
  ...validatePostBody(),

  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) {
      res.status(400).send("Invalid post id");
      return;
    }

    const post = await Post.findById<IPost & Document>(postId);
    if (post == null) res.status(404).send("404: Post not found");
    else {
      const { title, blogContents, topics, isPublished } = req.body;
      post.set({ title, blogContents, topics, isPublished });
      await post.save();
      res.json(post);
    }
  })
);

// --- DELETE POST ROUTE --- //

router.delete(
  "/:postId",
  getUser,
  onlyAdmin,

  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await Post.findById<IPost>(postId, "author").exec();

    if (!isValidObjectId(postId)) res.status(400).send("Invalid post id");
    else if (post == null) res.status(404).send("404: Post not found");
    else {
      await Post.findByIdAndDelete(postId).exec();
      res.json(post);
    }
  })
);

// --- GET SINGLE POST ROUTE --- //

// Note: It is important that this is the last route, or else it may override other routes e.g. "/:postId/comments"
router.get(
  "/:postId",
  getUser,
  asyncHandler(async (req: Request, res: Response) => {
    if (!isValidObjectId(req.params.postId)) {
      res.status(400).send("Invalid post id");
    } else {
      const post = await Post.findById<IPost>(req.params.postId)
        .populate("author", "-password")
        .populate({
          path: "comments",
          options: { sort: { createdAt: "desc" } },
        });
      const isUnpublished = post && !post.isPublished;
      // only allow admin to see unpublished
      if (isUnpublished && req.user?.role !== "admin") res.sendStatus(403);
      else res.json(post);
    }
  })
);

export default router;
