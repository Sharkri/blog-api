import mongoose, { Date, Types } from "mongoose";

const { Schema } = mongoose;

interface Post {
  author: Types.ObjectId;
  title: string;
  description: string;
  blogContents: string;
  topics?: string[];
  comments?: Types.ObjectId[];
  isPublished?: boolean;
  createdAt: Date;
}

const PostSchema = new Schema<Post>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    blogContents: { type: String, required: true },
    topics: [
      {
        type: String,
        validate: {
          validator: (val: string[]) => val.length <= 5,
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
