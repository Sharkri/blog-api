import bcrypt from "bcrypt";
import { InternalRequest } from "express-validator/src/base";
import { validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";
import { IUser, User } from "../models/User";

const { body } = require("express-validator");

function handleValidationResult(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  } else {
    next();
  }
}

const validatePostBody = () => [
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
    .custom((topics: any) =>
      topics.every((topic: any) => typeof topic === "string")
    )
    .withMessage("All topics must be strings")
    // set as `topics: any` since we do not know what the user inputs in
    .custom((topics: any) => topics.length <= 5)
    .withMessage("Maximum 5 topics"),
  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean"),

  handleValidationResult,
];

const validateRegisterBody = () => [
  // the secret password required to create an account
  body("secretPassword").custom(
    (pass: any) => pass === process.env.SECRET_REGISTER_PASSWORD
  ),
  body("email")
    .toLowerCase()
    .isEmail()
    .withMessage("Invalid email")
    .custom(async (email: string) => {
      const emailTaken = await User.exists({ email }).exec();
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

  handleValidationResult,
];

const validateLoginAndGetUser = () => [
  body("email")
    .toLowerCase()
    .isEmail()
    .withMessage("Invalid email")
    // check if user exists
    .custom(async (email: string, { req }: { req: InternalRequest }) => {
      const user = await User.findOne<IUser>({ email }).exec();

      if (!user) return Promise.reject();
      // user exists, set req.user = user
      req.user = user;

      return true;
    })
    .withMessage("User with the specified email does not exist."),
  // check if correct password entered
  body("password")
    .isString()
    .custom(async (password: string, { req }: { req: InternalRequest }) => {
      // since no user found, we already know the password is invalid
      if (!req.user) return true;

      const isSamePass = await bcrypt.compare(password, req.user.password);
      if (!isSamePass) return Promise.reject();
      return true;
    })
    .withMessage("Incorrect password"),

  handleValidationResult,
];

const validateCommentBody = () => [
  body("name")
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage("Name must be between 1-50 characters long"),
  body("text")
    .isString()
    .isLength({ min: 1, max: 1500 })
    .withMessage("Text must be between 1-1500 characters long"),

  handleValidationResult,
];

export {
  validatePostBody,
  validateRegisterBody,
  validateLoginAndGetUser,
  validateCommentBody,
};
