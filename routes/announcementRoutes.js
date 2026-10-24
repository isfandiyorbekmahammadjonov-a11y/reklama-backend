const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Announcement = require("../models/Announcement");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 1. Yangi e'lon qo'shish (POST)
router.post("/create", upload.array("images", 10), async (req, res) => {
  try {
    // req.body ichidan description ham olindi
    const { title, category, location, description } = req.body;

    const imageUrls = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    const newAnnouncement = new Announcement({
      title,
      category,
      location,
      description, // Modelga saqlanmoqda
      images: imageUrls,
    });

    await newAnnouncement.save();

    res.status(201).json({
      message: "E'lon muvaffaqiyatli joylandi!",
      data: newAnnouncement,
    });
  } catch (error) {
    res.status(500).json({
      message: "Serverda xatolik yuz berdi",
      error: error.message,
    });
  }
});

// 2. Barcha e'lonlarni olish (GET)
router.get("/all", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({
      createdAt: -1,
    });

    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({
      message: "Ma'lumotlarni olishda xatolik",
      error: error.message,
    });
  }
});

module.exports = router;
