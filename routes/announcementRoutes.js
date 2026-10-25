const express = require("express");
const router = express.Router();
const multer = require("multer");
const Announcement = require("../models/Announcement");

// Multer orqali rasmni vaqtincha xotirada saqlaymiz
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 1. Yangi e'lon qo'shish (POST)
router.post("/create", upload.array("images", 10), async (req, res) => {
  try {
    const { title, category, location, description } = req.body;
    const imageUrls = [];

    // Agar rasmlar yuklangan bo'lsa
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Base64 va URLSearchParams o'rniga FormData va Blob ishlatamiz
        const formData = new FormData();
        formData.append("key", process.env.IMGBB_API_KEY);

        // Buffer'ni Blob ko'rinishiga o'tkazib, fayl sifatida qo'shamiz
        const blob = new Blob([file.buffer], { type: file.mimetype });
        formData.append("image", blob, file.originalname);

        // ImgBB API ga fetch orqali yuboramiz
        const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: formData, // FormData avtomatik ravishda multipart/form-data qiladi
        });

        const imgbbData = await imgbbRes.json();

        if (imgbbData.success) {
          imageUrls.push(imgbbData.data.url);
        } else {
          console.error("ImgBB xatosi:", imgbbData);
        }
      }
    }

    const newAnnouncement = new Announcement({
      title,
      category,
      location,
      description,
      images: imageUrls,
    });

    await newAnnouncement.save();

    res.status(201).json({
      message: "E'lon muvaffaqiyatli joylandi!",
      data: newAnnouncement,
    });
  } catch (error) {
    console.error("Server xatosi:", error.message);
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
