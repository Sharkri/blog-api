import { NextFunction, Request, Response } from "express";
import jwt, { VerifyErrors } from "jsonwebtoken";

// Verifies token and then sets req.user to the user
function verifyTokenAndGetUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret not found in .env file");
  }

  const bearerHeader = req.headers.authorization;

  if (bearerHeader == null) {
    res.status(403).send("No authorization header provided");
    return;
  }

  // Get the second value from the split string "Bearer <access_token>"
  const [, bearerToken] = bearerHeader.split(" ");

  // Set the token
  req.token = bearerToken;

  // Verify token
  jwt.verify(
    req.token,
    process.env.JWT_SECRET,
    (err: VerifyErrors | null, userData: any) => {
      if (err) {
        res.status(403).json(err);
        return;
      }
      // Set the user object
      req.user = userData;
      next();
    }
  );
}

const signToken = async (payload: object) =>
  new Promise((resolve, reject) => {
    if (typeof process.env.JWT_SECRET !== "string") {
      throw new Error("JWT secret must be specified in .env file");
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    );
  });

export { verifyTokenAndGetUser, signToken };
