import mongoose from "mongoose";
async function connection (){
await mongoose.connect(process.env.MONGO_URI)
}
export default connection;