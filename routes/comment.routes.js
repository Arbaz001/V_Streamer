import express from "express";
import mongoose from "mongoose";
import Comment from "../models/comment.model.js";
import { checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Video comment management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         video_id:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         commentText:
 *           type: string
 *           example: "This video is great!"
 *         user_id:
 *           type: string
 *           example: "507f1f77bcf86cd799439013"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CommentWithUser:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         video_id:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         commentText:
 *           type: string
 *           example: "This video is great!"
 *         user_id:
 *           type: object
 *           properties:
 *             channelName:
 *               type: string
 *               example: "MyChannel"
 *             logoUrl:
 *               type: string
 *               example: "https://example.com/logo.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/comments/new:
 *   post:
 *     summary: Add a new comment to a video
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - video_id
 *               - commentText
 *             properties:
 *               video_id:
 *                 type: string
 *                 description: ID of the video being commented on
 *                 example: "507f1f77bcf86cd799439011"
 *               commentText:
 *                 type: string
 *                 description: The comment text
 *                 example: "This video is amazing!"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment Added Successfully"
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - user not authenticated
 *       500:
 *         description: Server error
 */
router.post("/new", checkAuth, async (req, res) => {
  try {
    const { video_id, commentText } = req.body;

    if (!video_id || !commentText) {
      return res
        .status(400)
        .json({ error: "Video ID and Comment Text are required" });
    }

    const newComment = new Comment({
      _id: new mongoose.Types.ObjectId(),
      video_id,
      commentText,
      user_id: req.user._id,
    });

    await newComment.save();

    res.status(201).json({
      message: "Comment Added Successfully",
      comment: newComment,
    });
    console.log("new comments posted");
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something went wrong", message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment Deleted Successfully"
 *       403:
 *         description: Forbidden - user doesn't own the comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.delete("/:commentId", checkAuth, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.user_id.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: "Comment Deleted Successfully" });
    console.log("comment deleted by user");
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something went wrong", message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commentText
 *             properties:
 *               commentText:
 *                 type: string
 *                 description: Updated comment text
 *                 example: "Updated comment text"
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment updated successfully"
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user doesn't own the comment
 *       500:
 *         description: Server error
 */
router.put("/:commentId", checkAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { commentText } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(401).json({ error: "Comment not found" });
    }

    if (comment.user_id.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this comment" });
    }

    comment.commentText = commentText;
    await comment.save();
    res.status(200).json({ message: "Comment updated successfully", comment });
    console.log("comment Updated succesfully");
  } catch (error) {
    res
      .status(500)
      .json({ error: "something went wrong", message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/comments/{videoId}:
 *   get:
 *     summary: Get all comments for a video
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: videoId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video to get comments for
 *     responses:
 *       200:
 *         description: List of comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommentWithUser'
 *       500:
 *         description: Server error
 */
router.get("/:videoId", checkAuth, async (req, res) => {
  try {
    const { videoId } = req.params;

    const comments = await Comment.find({ video_id: videoId })
      .populate("user_id", "channelName logoUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({ comments });
    console.log("get comments");
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something went wrong", message: error.message });
  }
});

export default router;
