import { Router } from "express";
import { body, validationResult } from "express-validator";
import { verifyToken } from "../helper/token";

const router = Router();

router.get("/", (req, res) => res.send("NOT IMPLEMENTED YET"));

router.post("/create", [
  verifyToken,

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
    .custom((topics) => topics.every((topic) => typeof topic === "string"))
    .withMessage("All topics must be strings"),

  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      res.send("TODO: Do stuff");
    }
  },
]);

export default router;
