import mongoose from "mongoose";
const flowerschmea=new mongoose.Schema({
    productNames:{type:String},
    productCategory:{type:String},
    productPrices:{type:String},
    productUnits:{ type:String},
    image:{type:String},
    Date:{type:Date,Default:Date.now},
    seller:{type:mongoose.Schema.Types.ObjectId,ref:"seller"}
})
const flowerModel=mongoose.model("flower",flowerschmea);
export default flowerModel;