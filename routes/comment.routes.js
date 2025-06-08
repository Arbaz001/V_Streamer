import express from "express";
import mongoose from "mongoose";
import Comment from "../models/comment.model.js";
import { checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

//Add Comment Write to Post By User
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
    console.log("new comments posted")
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something went wrong", message: error.message });
  }
});

// Delete Comment By the User
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
    console.log("comment deleted by user")
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something went wrong", message: error.message });
  }
});

// Update and edit Comment By the User
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
    console.log("comment Updated succesfully")
  } catch (error) {
    res
      .status(500)
      .json({ error: "something went wrong", message: error.message });
  }
});

// Get Comments on the specific Videos
router.get("/:videoId", checkAuth, async (req, res) => {
  try {
    const { videoId } = req.params;

    const comments = await Comment.find({ video_id: videoId })
      .populate("user_id", "channelName logoUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({ comments });
    console.log("get comments")
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something went wrong", message: error.message });
  }
});

export default router;
