import mongoose, { Schema, Types } from "mongoose";

interface User {
  email: string;
  password: string;
  displayName: string;
  pfp: Types.ObjectId;
}

const UserSchema = new Schema<User>({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  pfp: { type: Schema.Types.ObjectId, ref: "Image" },
});

const UserModel = mongoose.model("User", UserSchema);
export { UserModel as User, User as IUser };
