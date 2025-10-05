import mongoose from "mongoose";
const liveSchema=mongoose.Schema({
name:{type:String},
category:{type:String},
unit:{type:String},
price:{type:Number},
imageUrl:{type:String},
date:{type:Date,Default:Date.now()}
})
const liveModel=mongoose.model("live",liveSchema);
export default liveModel;