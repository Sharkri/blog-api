import mongoose from "mongoose";

const { Schema } = mongoose;

const CommentSchema = new Schema(
  {
    name: { type: String, required: true, maxLength: 30 },
    text: { type: String, required: true, maxLength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Comment", CommentSchema);
