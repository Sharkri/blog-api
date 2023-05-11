import mongoose from "mongoose";

const { Schema } = mongoose;

interface Comment {
  name: string;
  text: string;
  createdAt: string;
}

const CommentSchema = new Schema<Comment>(
  {
    name: { type: String, required: true, maxLength: 30 },
    text: { type: String, required: true, maxLength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Comment", CommentSchema);
