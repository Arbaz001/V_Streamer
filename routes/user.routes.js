import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User authentication and management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - channelName
 *         - email
 *         - password
 *         - phone
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated user ID
 *         channelName:
 *           type: string
 *           example: "MyChannel"
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *         phone:
 *           type: string
 *           example: "9876543210"
 *         logoUrl:
 *           type: string
 *           example: "https://res.cloudinary.com/example/image/upload/v12345/logo.jpg"
 *         logoId:
 *           type: string
 *           example: "image/upload/v12345/logo"
 *         subscribers:
 *           type: array
 *           items:
 *             type: string
 *         subscribedChannels:
 *           type: array
 *           items:
 *             type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         channelName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         logoId:
 *           type: string
 *         logoUrl:
 *           type: string
 *         token:
 *           type: string
 *         subscribers:
 *           type: array
 *           items:
 *             type: string
 *         subscribedChannels:
 *           type: array
 *           items:
 *             type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/v1/user/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - channelName
 *               - email
 *               - password
 *               - phone
 *               - logoUrl
 *             properties:
 *               channelName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 */
router.post("/signup", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const uploadImage = await cloudinary.uploader.upload(
      req.files.logoUrl.tempFilePath
    );


    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      channelName: req.body.channelName,
      email: req.body.email,
      password: hashedPassword,
      phone: req.body.phone,
      logoUrl: uploadImage.secure_url,
      logoId: uploadImage.public_id,
    });

    let user = await newUser.save();
    res.status(201).json({
      user,
    });
    console.log("user signup succesfully");
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something is wrong", message: error.message });
  }
});

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     summary: Authenticate user and get token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       404:
 *         description: User not found
 *       500:
 *         description: Invalid credentials or server error
 */
router.post("/login", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });

    if (!existingUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const isValid = await bcrypt.compare(
      req.body.password,
      existingUser.password
    );

    if (!isValid) {
      return res.status(500).json({ message: "Inavalid Credentials" });
    }

    const token = jwt.sign(
      {
        _id: existingUser._id,
        channelName: existingUser.channelName,
        email: existingUser.email,
        phone: existingUser.phone,
        logoId: existingUser.logoId,
      },
      process.env.JWT_TOKEN,
      { expiresIn: "10d" }
    );

    res.status(200).json({
         _id: existingUser._id,
        channelName: existingUser.channelName,
        email: existingUser.email,
        phone: existingUser.phone,
        logoId: existingUser.logoId,
        logoUrl:existingUser.logoUrl,
        token:token,
        subscribers:existingUser.subscribers,
        subscribedChannels:existingUser.subscribedChannels
    })
    console.log("login succsfully")
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "something is wrong", message: error.message });
  }
});

export default router;
