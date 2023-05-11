import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";

import postsRoute from "./routes/posts";
import userRoute from "./routes/user";
import commentsRoute from "./routes/comments";

mongoose.connect(process.env.DATABASE_URI || "your_db_uri");
mongoose.connection.on(
  "error",
  console.error.bind(console, "mongo connection error")
);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/posts", postsRoute);
app.use("/api/users", userRoute);
app.use("/api/comments", commentsRoute);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}!`)
);
