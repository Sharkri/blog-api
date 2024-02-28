import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import postsRoute from "./routes/posts";
import userRoute from "./routes/user";

mongoose.connect(process.env.DATABASE_URI || "your_db_uri");
mongoose.connection.on(
  "error",
  console.error.bind(console, "mongo connection error")
);

const app = express();

const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS
  ? JSON.parse(process.env.ALLOWED_ORIGINS)
  : [];

const options: cors.CorsOptions = {
  origin: allowedOrigins,
};

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 500, // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(options));

app.use("/api/posts", postsRoute);
app.use("/api/users", userRoute);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}!`)
);
