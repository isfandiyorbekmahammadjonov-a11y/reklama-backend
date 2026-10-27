const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const announcementRoutes = require("./routes/announcementRoutes");

const app = express();

// ✅ CORS ni to'g'ri joyda va aniq domenlar bilan sozlaymiz
app.use(
  cors({
    origin: [
      "https://reklama.uz",
      "https://www.reklama.uz",
      "http://localhost:5173", // Localhost uchun
    ],
    credentials: true,
  }),
);

app.use(express.json());

// 🟢 UptimeRobot va server holatini tekshirish uchun asosiy sahifa (Ping)
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Reklama.uz serveri muvaffaqiyatli ishlamoqda! 🚀",
  });
});

// Uploads papkasi
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// API routelar
app.use("/api/announcements", announcementRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/reklama_uz";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB-ga ulanish muvaffaqiyatli bo'ldi!");
    app.listen(PORT, () => {
      console.log(`Server ${PORT}-portda ishlamoqda...`);
    });
  })
  .catch((err) => console.log("MongoDB ulanish xatosi:", err));
