import express from "express";
import mongoose from "mongoose";

import User from "../models/user.model.js";
import Video from "../models/video.model.js";
import cloudinary from "../config/cloudinary.js";
import { checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Upload Video Endpoint
router.post("/upload", checkAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    if (!req.files || !req.files.video || !req.files.thumbnail) {
      return res.status(400).json({ error: "Video and thumbnail are required" });
    }

    const videoUpload = await cloudinary.uploader.upload(
      req.files.video.tempFilePath,
      {
        resource_type: "video",
        folder: "videos",
        public_id: `video_${Date.now()}`,
      }
    );

    const thumbnailUpload = await cloudinary.uploader.upload(
      req.files.thumbnail.tempFilePath,
      {
        folder: "thumbnails",
        public_id: `thumbnail_${Date.now()}`,
      }
    );

    const newVideo = new Video({
      _id: new mongoose.Types.ObjectId(),
      title,
      description,
      user_id: req.user._id,
      videoUrl: videoUpload.secure_url,
      videoId: videoUpload.public_id,
      thumbnailUrl: thumbnailUpload.secure_url,
      thumbnailId: thumbnailUpload.public_id,
      category,
      tags: tags ? tags.split(",") : [],
    });

    await newVideo.save();

    res.status(200).json({ message: "Video uploaded successfully", video: newVideo });
    console.log("Video uploaded");
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Something went wrong", message: error.message });
  }
});

// Update Video Endpoint
router.put("/update/:id", checkAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    const videoId = req.params.id;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    if (video.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (req.files && req.files.thumbnail) {
      if (video.thumbnailId) {
        await cloudinary.uploader.destroy(video.thumbnailId);
      }

      const thumbnailUpload = await cloudinary.uploader.upload(
        req.files.thumbnail.tempFilePath,
        {
          folder: "thumbnails",
          public_id: `thumbnail_${Date.now()}`,
        }
      );

      video.thumbnailUrl = thumbnailUpload.secure_url;
      video.thumbnailId = thumbnailUpload.public_id;
    }

    video.title = title || video.title;
    video.description = description || video.description;
    video.category = category || video.category;
    video.tags = tags ? tags.split(",") : video.tags;

    await video.save();

    res.status(200).json({ message: "Video updated successfully", video });
    console.log("Video updated");
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Something went wrong", message: error.message });
  }
});

// Delete Video Endpoint
router.delete("/delete/:id", checkAuth, async (req, res) => {
  try {
    const videoId = req.params.id;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    if (video.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete from Cloudinary
    if (video.videoId) {
      await cloudinary.uploader.destroy(video.videoId, {
        resource_type: "video",
      });
    }

    if (video.thumbnailId) {
      await cloudinary.uploader.destroy(video.thumbnailId);
    }

    await Video.findByIdAndDelete(videoId);

    res.status(200).json({ message: "Video deleted successfully" });
    console.log("Video deleted");
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Something went wrong", message: error.message });
  }
});

// GET All Videos (Public)
router.get("/all", async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.status(200).json(videos);
    console.log("(Public)Get All Videos")
  } catch (error) {
    console.error("All Videos Error:", error);
    res.status(500).json({ error: "Something went wrong", message: error.message });
  }
});

// GET My Videos (Private)
router.get("/my-videos", checkAuth, async (req, res) => {
  try {
    const videos = await Video.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(videos);
    console.log("Get My(User) Videos")
  } catch (error) {
    console.error("My Videos Error:", error);
    res.status(500).json({ error: "Something went wrong", message: error.message });
  }
});

//  GET Video By ID (also track view) (Private)
router.get("/:id", checkAuth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user._id;

    const video = await Video.findByIdAndUpdate(
      videoId,
      { $addToSet: { viewedBy: userId } }, // Avoid duplicate views
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.status(200).json(video);
    console.log("Get videos by _id");
  } catch (error) {
    console.error("Get Video By ID Error:", error);
    res.status(500).json({ error: "Something went wrong", message: error.message });
  }
});

// GET Videos By Category (Public)
router.get("/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const videos = await Video.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(videos);
    console.log("(Public)Get Video By Category");
  } catch (error) {
    console.error("Category Videos Error:", error);
    res.status(500).json({ error: "Something went wrong", message: error.message });
  }
});


// Get Videos by Tag
router.get("/tags/:tag", async (req, res) => {
  try {
    const tag = req.params.tag;
    const videos = await Video.find({ tags: tag }).sort({ createdAt: -1 });

    res.status(200).json(videos);
    console.log("(Public) Get Videos By Tag")
  } catch (error) {
    console.error("Tag Fetch Error:", error);
    res.status(500).json({ error: "Something went wrong", message: error.message });
  }
});

// Like a Video (number based)
router.post("/like", checkAuth, async (req, res) => {
  try {
    const { videoId } = req.body;

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    video.likes += 1;
    if (video.dislikes > 0) {
      video.dislikes -= 1;
    }

    await video.save();

    res.status(200).json({ message: "Video liked", likes: video.likes, dislikes: video.dislikes });
    console.log("video Like")
  } catch (error) {
    console.error("Like Error:", error);
    res.status(500).json({ error: "Something went wrong", message: error.message });
  }
});

// Dislike a Video (number based)
router.post("/dislike", checkAuth, async (req, res) => {
  try {
    const { videoId } = req.body;

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    video.dislikes += 1;
    if (video.likes > 0) {
      video.likes -= 1;
    }

    await video.save();

    res.status(200).json({ message: "Video disliked", likes: video.likes, dislikes: video.dislikes });
    console.log("Video Dislike")
  } catch (error) {
    console.error("Dislike Error:", error);
    res.status(500).json({ error: "Something went wrong", message: error.message });
  }
});





export default router;
