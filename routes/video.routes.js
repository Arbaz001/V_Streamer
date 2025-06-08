import express from "express";
import mongoose from "mongoose";

import User from "../models/user.model.js";
import Video from "../models/video.model.js";
import cloudinary from "../config/cloudinary.js";
import { checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Video management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - user_id
 *         - videoUrl
 *         - thumbnailUrl
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated video ID
 *         title:
 *           type: string
 *           example: "My Awesome Video"
 *         description:
 *           type: string
 *           example: "This is a description of my video"
 *         user_id:
 *           type: string
 *           description: ID of the user who uploaded the video
 *         videoUrl:
 *           type: string
 *           format: uri
 *           example: "https://res.cloudinary.com/example/video/upload/v12345/video.mp4"
 *         videoId:
 *           type: string
 *           example: "videos/video_12345"
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *           example: "https://res.cloudinary.com/example/image/upload/v12345/thumbnail.jpg"
 *         thumbnailId:
 *           type: string
 *           example: "thumbnails/thumbnail_12345"
 *         category:
 *           type: string
 *           example: "Gaming"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["action", "adventure"]
 *         likes:
 *           type: number
 *           example: 100
 *         dislikes:
 *           type: number
 *           example: 5
 *         viewedBy:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who viewed the video
 *         createdAt:
 *           type: string
 *           format: date-time
 *     VideoUpload:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *         - video
 *         - thumbnail
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         tags:
 *           type: string
 *           description: Comma-separated list of tags
 *         video:
 *           type: string
 *           format: binary
 *         thumbnail:
 *           type: string
 *           format: binary
 */

/**
 * @swagger
 * /api/v1/video/upload:
 *   post:
 *     summary: Upload a new video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/VideoUpload'
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       400:
 *         description: Video and thumbnail are required
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/video/update/{id}:
 *   put:
 *     summary: Update a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/video/delete/{id}:
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/video/all:
 *   get:
 *     summary: Get all videos (Public)
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: List of all videos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Video'
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/video/my-videos:
 *   get:
 *     summary: Get current user's videos (Private)
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's videos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Video'
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/video/{id}:
 *   get:
 *     summary: Get video by ID and track view (Private)
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", checkAuth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user._id;

    const video = await Video.findByIdAndUpdate(
      videoId,
      { $addToSet: { viewedBy: userId } },
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

/**
 * @swagger
 * /api/v1/video/category/{category}:
 *   get:
 *     summary: Get videos by category (Public)
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: Video category
 *     responses:
 *       200:
 *         description: List of videos in category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Video'
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/video/tags/{tag}:
 *   get:
 *     summary: Get videos by tag (Public)
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: tag
 *         schema:
 *           type: string
 *         required: true
 *         description: Video tag
 *     responses:
 *       200:
 *         description: List of videos with tag
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Video'
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/video/like:
 *   post:
 *     summary: Like a video (number based)
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoId
 *             properties:
 *               videoId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video liked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 likes:
 *                   type: number
 *                 dislikes:
 *                   type: number
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/v1/video/dislike:
 *   post:
 *     summary: Dislike a video (number based)
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoId
 *             properties:
 *               videoId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video disliked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 likes:
 *                   type: number
 *                 dislikes:
 *                   type: number
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
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
