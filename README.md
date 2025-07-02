# V-Streamer API 🎥

A comprehensive video streaming platform backend built with Node.js, Express, and MongoDB. This API provides complete functionality for user management, video upload/streaming, and social features like comments and likes.

## 🚀 Features

### 👤 User Management
- **User Registration & Authentication**: Secure signup/login with JWT tokens
- **Profile Management**: Channel creation with custom logos
- **Subscription System**: Subscribe to channels and track followers

### 🎬 Video Management
- **Video Upload**: Upload videos with thumbnails to Cloudinary
- **Video Streaming**: Stream videos with view tracking
- **Video Organization**: Categorize videos and add tags
- **CRUD Operations**: Full create, read, update, delete functionality
- **Video Discovery**: Search by category, tags, and get personalized content

### 💬 Social Features
- **Comments System**: Add, edit, delete comments on videos
- **Like/Dislike System**: Engage with content through reactions
- **View Tracking**: Track video views and user engagement

### 📚 API Documentation
- **Swagger Integration**: Complete API documentation at `/api-docs`
- **Interactive Testing**: Test all endpoints directly from the documentation

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary for videos and images
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: bcrypt for password hashing

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account for media storage
- npm or yarn package manager

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Arbaz001/v-streamer-api.git
   cd v-streamer-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```env
   # Server Configuration
   PORT=8080
   
   # Database
   MONGO_URI=mongodb://localhost:27017/v-streamer
   # or for MongoDB Atlas:
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/v-streamer
   
   # JWT Secret
   JWT_TOKEN=your-super-secret-jwt-key-here
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET_KEY=your-cloudinary-api-secret
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Environment Variables

| Variable                    |          Description           | Required |
|-----------------------------|-----------------------------------|-----|
| `PORT`                      | Server port number                | Yes |
| `MONGO_URI`                 | MongoDB connection string         | Yes |
| `JWT_TOKEN`                 | JWT secret key for authentication | Yes |
| `CLOUDINARY_CLOUD_NAME`     | Cloudinary cloud name             | Yes |
| `CLOUDINARY_API_KEY`        | Cloudinary API key                | Yes |
| `CLOUDINARY_API_SECRET_KEY` | Cloudinary API secret             | Yes |

## 📖 API Documentation

Once the server is running, visit `http://localhost:8080/api-docs` to access the interactive Swagger documentation.

### 🔐 Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🛣️ API Endpoints

### 👥 User Routes (`/api/v1/user`)

- `POST /signup` - Register a new user
- `POST /login` - Authenticate user

### 🎥 Video Routes (`/api/v1/video`)

- `POST /upload` - Upload a new video (Auth required)
- `PUT /update/:id` - Update video details (Auth required)
- `DELETE /delete/:id` - Delete a video (Auth required)
- `GET /all` - Get all videos (Public)
- `GET /my-videos` - Get user's videos (Auth required)
- `GET /:id` - Get video by ID with view tracking (Auth required)
- `GET /category/:category` - Get videos by category (Public)
- `GET /tags/:tag` - Get videos by tag (Public)
- `POST /like` - Like a video (Auth required)
- `POST /dislike` - Dislike a video (Auth required)

### 💬 Comment Routes (`/api/v1/comment`)

- `POST /new` - Add a new comment (Auth required)
- `PUT /:commentId` - Update a comment (Auth required)
- `DELETE /:commentId` - Delete a comment (Auth required)
- `GET /:videoId` - Get all comments for a video (Auth required)

## 🗄️ Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  channelName: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  logoUrl: String,
  logoId: String,
  subscribers: Number,
  subscribedChannels: [ObjectId]
}
```

### Video Model
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  user_id: ObjectId (ref: User),
  videoUrl: String,
  thumbnailUrl: String,
  thumbnailId: String,
  category: String,
  tags: [String],
  likes: Number,
  dislikes: Number,
  views: Number,
  likedBy: [ObjectId],
  disLikedBy: [ObjectId],
  viewedBy: [ObjectId]
}
```

### Comment Model
```javascript
{
  _id: ObjectId,
  video_id: ObjectId (ref: Video),
  commentText: String,
  user_id: ObjectId (ref: User)
}
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Mongoose schema validation
- **Authorization**: Route-level access control
- **File Upload Security**: Cloudinary integration with file type validation

## 📱 Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:8080/api/v1/user/signup \
  -F "channelName=MyChannel" \
  -F "email=user@example.com" \
  -F "password=securepassword" \
  -F "phone=1234567890" \
  -F "logoUrl=@/path/to/logo.jpg"
```

### Upload a video
```bash
curl -X POST http://localhost:8080/api/v1/video/upload \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "title=My Video" \
  -F "description=Video description" \
  -F "category=Entertainment" \
  -F "tags=fun,comedy" \
  -F "video=@/path/to/video.mp4" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

### Add a comment
```bash
curl -X POST http://localhost:8080/api/v1/comment/new \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "video_object_id",
    "commentText": "Great video!"
  }'
```


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- File upload size is limited by Cloudinary free tier
- View tracking uses arrays which may impact performance at scale

## 📞 Support

For support, email arbazalisgl@gmail.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- Express.js team for the awesome framework
- MongoDB team for the database
- Cloudinary for media storage solutions

---

**Happy Streaming! 🎬✨**
