import mongoose from "mongoose";

const { Schema } = mongoose;

interface Comment {
  name: string;
  text: string;
  replies?: mongoose.Types.ObjectId[];
  clientIp?: string;
}

const CommentSchema = new Schema<Comment>(
  {
    name: { type: String, required: true, maxLength: 30 },
    text: { type: String, required: true, maxLength: 1000 },
    replies: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    clientIp: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const CommentModel = mongoose.model("Comment", CommentSchema);
export { CommentModel as Comment, Comment as IComment };
