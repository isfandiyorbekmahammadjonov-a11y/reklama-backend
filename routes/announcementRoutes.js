const express = require("express");
const router = express.Router();
const multer = require("multer");
const Announcement = require("../models/Announcement");

// Multer orqali rasmni xotirada (memoryStorage) tutib olamiz
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 1. Yangi e'lon qo'shish (POST)
router.post("/create", upload.array("images", 10), async (req, res) => {
  try {
    const { title, category, location, description } = req.body;
    const imageUrls = [];

    // Agar rasmlar req.files orqali kelgan bo'lsa
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Buffer'ni Base64 string shakliga o'tkazamiz
        const base64Image = file.buffer.toString("base64");

        // ImgBB API URLSearchParams qabul qiladi
        const params = new URLSearchParams();
        params.append("key", process.env.IMGBB_API_KEY);
        params.append("image", base64Image);

        // ImgBB API ga POST so'rov yuboramiz
        const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        const imgbbData = await imgbbRes.json();

        if (imgbbData && imgbbData.success) {
          imageUrls.push(imgbbData.data.url);
        } else {
          console.error("ImgBB yuklash xatosi:", imgbbData);
        }
      }
    }

    // Yaratilgan e'lonni bazaga saqlash
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
