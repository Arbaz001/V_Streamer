import express from "express";
import mongoose from "mongoose";

import User from "../models/user.model.js";
import Video from "../models/video.model.js";
import cloudinary from "../config/cloudinary.js";
import { checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

//Upload video Endpoint
router.post("/upload", checkAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    if (!req.files || !req.files.video || !req.files.thumbnail) {
      return res
        .status(400)
        .json({ error: "video and thumbnail are required" });
    }
    const videoUpload = await cloudinary.uploader.upload(
      req.files.video.tempFilePath,
      {
        resource_type: "video",
        folder: "videos",
      }
    );
    const thumbnailUpload = await cloudinary.uploader.upload(
      req.files.thumbnail.tempFilePath,
      {
        folder: "thumbnail",
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

    res
      .status(200)
      .json({ message: "video Uploaded Succesfully", video: newVideo });
    console.log("video Uploded");
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something is wrong", message: error.message });
  }
});

//Update video Endpoints {no video- title, description, category, tags and like  meta data}
router.put("/update/:id", checkAuth, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    const videoId = req.params.id;

    //find Video by Id
    let video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: "videos not found" });
    }
    if (video.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "unauthorized" });
    }
    if (req.files && req.files.thumbnail) {
      await cloudinary.uploader.destroy(video.thumbnailId);

      const thumbnailUpload = await cloudinary.uploader.upload(
        req.files.thumbnail.tempFilePath,
        {
          folder: "thumbnail",
        }
      );
      video.thumbnailUrl = thumbnailUpload.secure_url;
      video.thumbnailId = thumbnailUpload.public_id;
    }
    video.title = title || video.title;
    video.description = description || video.description;
    video.category = category || video.category;
    video.tags = tags || video.tags;

    await video.save();
    res.status(200).json({ message: "Video updated succesfully", video });
    console.log("video updated succefully");
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something is wrong", message: error.message });
  }
});

//delete video Endpoint

export default router;
