const express = require("express");
const router = express.Router();
const multer = require("multer");
const Announcement = require("../models/Announcement");

// Multer sozlamalari
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Har bir rasm maksimum 5 MB
    files: 10, // Maksimum 10 ta rasm
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Faqat rasm fayllarini yuklash mumkin!"));
    }
  },
});

// ImgBB ga rasm yuklash funksiyasi
async function uploadImageToImgBB(file) {
  const apiKey = process.env.IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error(
      "IMGBB_API_KEY topilmadi. Render Environment sozlamalarini tekshiring.",
    );
  }

  const base64Image = file.buffer.toString("base64");

  const params = new URLSearchParams();
  params.append("key", apiKey);
  params.append("image", base64Image);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const result = await response.json();

  if (!response.ok || !result.success || !result.data?.url) {
    console.error("ImgBB xatosi:", {
      status: response.status,
      message: result?.error?.message || "Noma'lum xato",
      code: result?.error?.code,
    });

    throw new Error(
      result?.error?.message || "Rasmni ImgBB ga yuklab bo'lmadi.",
    );
  }

  return result.data.url;
}

// E'lon yaratish
router.post("/create", upload.array("images", 10), async (req, res) => {
  try {
    const { title, category, location, description } = req.body;

    // Majburiy maydonlarni tekshirish
    if (!title || !category || !location || !description) {
      return res.status(400).json({
        message: "Barcha maydonlarni to'ldiring!",
      });
    }

    const files = req.files || [];
    const imageUrls = [];

    // Rasmlarni ImgBB ga yuklash
    for (const file of files) {
      const imageUrl = await uploadImageToImgBB(file);
      imageUrls.push(imageUrl);
    }

    // E'lonni MongoDB ga saqlash
    const newAnnouncement = new Announcement({
      title,
      category,
      location,
      description,
      images: imageUrls,
    });

    await newAnnouncement.save();

    return res.status(201).json({
      message: "E'lon muvaffaqiyatli joylandi!",
      data: newAnnouncement,
    });
  } catch (error) {
    console.error("E'lon yaratish xatosi:", error.message);

    return res.status(500).json({
      message: "E'lon yaratishda xatolik yuz berdi.",
      error: error.message,
    });
  }
});

// Barcha e'lonlarni olish
router.get("/all", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({
      createdAt: -1,
    });

    return res.status(200).json(announcements);
  } catch (error) {
    console.error("E'lonlarni olish xatosi:", error.message);

    return res.status(500).json({
      message: "Ma'lumotlarni olishda xatolik.",
    });
  }
});

module.exports = router;
