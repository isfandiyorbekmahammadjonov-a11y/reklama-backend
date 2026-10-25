const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const Announcement = require("../models/Announcement");

// Multer vaqtincha lokal papkaga saqlab turishi uchun (keyin ImgBB'ga yuboriladi)
const upload = multer({ dest: "uploads/" });

// 1. Yangi e'lon qo'shish (POST)
router.post("/create", upload.array("images", 10), async (req, res) => {
  try {
    const { title, category, location, description } = req.body;
    const imageUrls = [];

    // Agar rasmlar yuklangan bo'lsa, ularni ImgBB'ga birma-bir yuboramiz
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const formData = new FormData();
        formData.append("image", fs.createReadStream(file.path));

        // ImgBB APIga so'rov yuborish (IMGBB_API_KEY ni .env ga yozasiz)
        const imgbbResponse = await axios.post(
          `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
          },
        );

        // ImgBB bergan doimiy rasm havolasini olamiz
        imageUrls.push(imgbbResponse.data.data.url);

        // Vaqtincha saqlangan lokal faylni o'chirib yuboramiz (serverni toza saqlash uchun)
        fs.unlinkSync(file.path);
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
    console.error("Xatolik:", error.response?.data || error.message);
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
