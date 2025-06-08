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

export default router;
