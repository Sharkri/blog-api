import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";

mongoose.connect(process.env.DATABASE_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
mongoose.connection.on(
  "error",
  console.error.bind(console, "mongo connection error")
);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`)
);
