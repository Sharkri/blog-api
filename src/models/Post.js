import mongoose from "mongoose";

const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    blogContents: { type: String, required: true },
    topics: [
      {
        type: String,
        validate: {
          validator: (val) => val.length <= 5,
          message: "Topics array exceeds the limit of 5",
        },
      },
    ],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    isPublished: { type: Boolean, default: "false" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PostSchema.virtual("url").get(function getPostUrl() {
  return `posts/${this.id}`;
});

export default mongoose.model("Post", PostSchema);
