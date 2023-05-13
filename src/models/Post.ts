import mongoose from "mongoose";

const { Schema } = mongoose;

interface Post {
  author: mongoose.Types.ObjectId;
  title: string;
  description: string;
  blogContents: string;
  topics?: string[];
  comments?: mongoose.Types.ObjectId[];
  isPublished?: boolean;
  image: mongoose.Types.ObjectId;
  _id: mongoose.Types.ObjectId;
}

const PostSchema = new Schema<Post>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    blogContents: { type: String, required: true },
    topics: {
      type: [{ type: String }],
      validate: [
        (val: string[]) => val.length <= 5,
        "Topics array exceeds the limit of 5",
      ],
    },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    isPublished: { type: Boolean, default: "false" },
    image: { type: Schema.Types.ObjectId, ref: "Image" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PostSchema.virtual("url").get(function getPostUrl() {
  return `posts/${this.id}`;
});

const PostModel = mongoose.model("Post", PostSchema);

export { PostModel as Post, Post as IPost };
