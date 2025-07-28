import { Schema, model } from "mongoose";

const userSchema = new Schema({
  id: { type: Number, required: true },  
  tg_id: { type: Number, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: { type: String, required: true },
});

const User = model("User", userSchema);

export default User;
