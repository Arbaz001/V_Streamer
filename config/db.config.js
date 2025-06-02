import mongoose from "mongoose";


export const ConnectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log(`DataBase Connect Succesfully On ${process.env.MONGO_URI}`)
    } catch (error) {
        console.log((error.message))
        throw new Error("Something is Wrong",error)
    }
}