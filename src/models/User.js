import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  pfp: { type: Schema.Types.ObjectId, ref: "Image" },
});

export default mongoose.model("User", UserSchema);
