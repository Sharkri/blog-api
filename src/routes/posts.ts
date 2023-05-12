import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import { verifyTokenAndGetUser } from "../helper/token";
import Post from "../models/Post";
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
      // eslint-disable-next-line no-underscore-dangle
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

export default router;
