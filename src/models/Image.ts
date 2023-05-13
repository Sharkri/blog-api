import mongoose from "mongoose";

const { Schema } = mongoose;

interface Image {
  data: Buffer;
  contentType: string;
}

const ImageSchema = new Schema<Image>({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
});

ImageSchema.virtual("imageUrl").get(function getImageUrl() {
  return `data:${this.contentType};base64,${this.data.toString("base64")}`;
});

export default mongoose.model("Image", ImageSchema);
export { Image };
