import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
  loginPageBackground: {
    type: String,
    default: "",
  },
});

export default mongoose.model("Setting", settingSchema);