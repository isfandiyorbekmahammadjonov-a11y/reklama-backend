const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    images: [{ type: String }],
    isLiked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
