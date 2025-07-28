import { Schema, model } from "mongoose";
import User from "./user.model";

const messageSchema = new Schema({
  chatId: { type: String, required: true },
  id: { type: Number, required: true, unique: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Message = model('Message', messageSchema);

export default Message;