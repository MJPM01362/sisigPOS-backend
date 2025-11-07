import Setting from "../models/SettingModel.js";

export const getBackground = async (req, res) => {
  try {
    const setting = await Setting.findOne();
    res.json({ loginPageBackground: setting?.loginPageBackground || "" });
  } catch (err) {
    console.error("getBackground error:", err);
    res.status(500).json({ message: "Failed to fetch background" });
  }
};

export const updateBackground = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { loginPageBackground } = req.body;

    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting();
    }

    setting.loginPageBackground = loginPageBackground;
    await setting.save();

    res.json({ message: "Background updated successfully" });
  } catch (err) {
    console.error("updateBackground error:", err);
    res.status(500).json({ message: "Failed to update background" });
  }
};