import mongoose from "mongoose";
const sellerSchema=new mongoose.Schema({
  email:{type:String,unique:true,required:true},
   password:{type:String},
    phoneNumber:{type:String},
    category:{type:String },
    address:{type:String},
    companyName:{type:String},
    name:{type:String}

})
const sellerModel=mongoose.model("seller",sellerSchema);
export default sellerModel;