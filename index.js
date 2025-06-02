import express from "express";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";

import { ConnectDB } from "./config/db.config.js";
import userRoutes from "./routes/user.routes.js"
import videoRoutes from "./routes/video.routes.js"

dotenv.config(); 

const app= express();
ConnectDB();

app.use(bodyParser.json());

app.use(fileUpload({
    useTempFiles:true,
    tempFileDir:"/tmp/"
}))

app.use("/api/v1/user",userRoutes)
app.use("/api/v1/video",videoRoutes)


app.listen(process.env.PORT,()=>{
    console.log(`Server is running at https://localhost:${process.env.PORT}`)
})
