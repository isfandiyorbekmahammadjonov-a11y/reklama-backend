const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const announcementRoutes = require("./routes/announcementRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/announcements", announcementRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/reklama_uz";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB-ga ulanish muvaffaqiyatli bo'ldi!");
    app.listen(PORT, () => {
      console.log(`Server ${PORT}-portda ishlamoqda...`);
    });
  })
  .catch((err) => console.log("MongoDB ulanish xatosi:", err));
