import mongoose from "mongoose";

const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    blogContents: { type: String, required: true },
    topics: [{ type: String }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PostSchema.virtual("url").get(function getPostUrl() {
  return `posts/${this.id}`;
});

export default mongoose.model("Post", PostSchema);
