import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import { verifyTokenAndGetUser } from "../helper/token";
import Post from "../models/Post";

const router = Router();

router.get("/", (req, res) => res.send("NOT IMPLEMENTED YET"));

router.post("/create", [
  verifyTokenAndGetUser,

  body("title")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Title is required"),
  body("description")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Description is required"),
  body("blogContents")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Blog contents are required"),
  body("topics")
    .optional()
    .isArray()
    .withMessage("Topics must be an array")
    .custom((topics) => topics.length <= 5)
    .withMessage("Maximum 5 topics")
    .custom((topics) => topics.every((topic: any) => typeof topic === "string"))
    .withMessage("All topics must be strings"),
  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),

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
