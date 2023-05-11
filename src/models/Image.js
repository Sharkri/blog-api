import mongoose from "mongoose";

const { Schema } = mongoose;

const ImageSchema = new Schema({
  image: { data: Buffer, contentType: String },
});

ImageSchema.virtual("imageUrl").get(function getImageUrl() {
  if (!this.image.data) return "";

  return `data:${
    this.image.contentType
  };base64,${this.image.data.toString("base64")}`;
});

export default mongoose.model("Image", ImageSchema);
