// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import express from "express";
import { User } from "../../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: Record<User>;
      token?: Record<string>;
    }
  }
}
