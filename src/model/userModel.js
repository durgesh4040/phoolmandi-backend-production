import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      trim: true
    },
    lastName:{
     type:String,
     trim :true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    otpCode:{
      type:String,
    },
    otpExpire:{
      type:String
    },
    token:{
      type:String
    },
    status:{
      type:String,
      default:"Active"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true ,
    versionKey:false
  }
);
const userModel = mongoose.model("user", userSchema);
export default userModel;