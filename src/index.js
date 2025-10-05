import express from 'express';
import dotenv from 'dotenv';
dotenv.config()
import connection from './dbconnection/db.js';
import { generateToken } from './utility/util.js';
import bcrypt, { hash } from "bcrypt";
import sellerModel from './model/sellerModel.js';
import auth from './middleware/auth.js';
import cors from 'cors';
import { sendEmail } from './utility/emailService.js'; 
import user from './router/user.js';
import NodeCache from 'node-cache';
import flowerModel from './model/flowerModel.js';
import upload from './utility/storage.js';
import { uploadImage } from './configuration/cloudinary.js';
import seller from './router/seller.js';
import liveModel from './model/liveModel.js';
const app=express();
app.use(express.json());
app.use(cors());
app.use("/api",user);
app.use("/api",seller);
const otpCache = new NodeCache({ stdTTL: 300 }); 
app.post("/seller/registration",async(req,res)=>{
    const {email,name,password,companyName,address,phoneNumber}=req.body;
    const selleruser=await sellerModel.findOne({email});
    if(selleruser){
        res.status(400).json({
            msg:"seller already exists"
        })
    }
    const hashpassword=await bcrypt.hash(password,10);
    const user=await sellerModel.create({
        email:email,
        password:hashpassword,
        phoneNumber:phoneNumber,
        address:address,
        name:name,
        companyName:companyName
})
const token=generateToken(user._id)
res.json({
    msg:"seller successful created",
    token:token
})
})
app.post("/seller/login",async(req,res)=>{
    const {email,password}=req.body;
    try{
    const user=await sellerModel.findOne({email});
    console.log(user);
    const compare=await bcrypt.compare(password,user.password);
   const   token=generateToken(user._id);
    if(!user){
        res.status(400).json({
            msg:"seller not exists"
            
        })
    }
    if(compare){
        res.status(200).json({
            msg: "successful login",
            token:token,
            user:user
        })
    }
    else {
        res.status(400).json({
            msg:"password is incorrect"
        })
    }
}
catch(error){
    console.log(error)
    res.status(500).json({
        msg:"server error"
    })
}
})
app.get("/auth",auth,async (req,res)=>{
res.json({
    message:"json logo verify useful"
})
})
app.post("/public/sendOtp",async(req,res)=>{
    const {email}=req.query;
    let otp=Math.floor(100000+Math.random()*900000);
    console.log(otp)
    console.log(email)
   const  subject="OTP send to phoolmandi"
   const  text=`OTP SENT ${otp}`;
   otpCache.set(email,otp);
   await  sendEmail(email,subject,text);
    res.status(200).json({
        message:"send successful"
    })
})

app.post("/public/verifyOtp",async(req,res)=>{
    const {email,otp}=req.query;
    const cachedOtp=otpCache.get(email);
    if(!cachedOtp){
        return res.status(400).json({message:"OTP expired or not found"})
    }

    if(parseInt(otp)===cachedOtp){
        otpCache.del(email);
        return res.status(200).json({message:"OTP verified successful"})
    }
    else{
        return res.status(400).json({message:"Invalid OTP"})
    }
})
app.get("/public/allSeller",async (req,res)=>{
   
    try{
    const email=req.params.email;
    const response =await sellerModel.find();
    res.json(response);
    } catch(error){
        res.status(500).json({
            message:"server error"
        })
    }
})

app.post("/saveProduct/:sellerId",upload.single('image'),async(req,res)=>{
    const {productNames,productPrices,productUnits,productCategory}=req.body;
    console.log(productCategory,productNames,productPrices,productUnits);
    const sellerId=req.params.sellerId;
    try{
       if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }
    const imagePath=req.file.path;
    const result=await uploadImage(imagePath);
    const response=await flowerModel.create({
        productNames:productNames,
        productPrices:productPrices,
        productUnits:productUnits,
        productCategory:productCategory,
        image:result,   
        seller:sellerId     
})
res.json({
        message:"data save successful"
    })
}catch(error){
    console.log(response)
}
})

app.delete("/productDelete/:id",async (req,res)=>{
    const id=req.params.id;
      if (!id) {
    return res.status(400).json({ msg: "No id provided" });
  }
    try{
 const response=await flowerModel.deleteOne({_id:id})
 console.log(response);
 res.json({
    msg:"product successfully delete"
 })
}catch(error){
    res.json({
        msg:"Unsuccessful product not delete"
    })
}
})

app.patch("/productUpdate/:id",async (req,res)=>{
     const {productName,category,price,unit,image}=req.body;
     const response=await flowerModel.updateOne({_id:id},{$set:update});
    
})

app.get("/getProduct/:sellerId",async (req,res)=>{
    const sellerId=req.params.sellerId;
    console.log(sellerId);
    const product=await flowerModel.find({seller:sellerId});
    res.json({
        product:product
    })
})

app.post("/live/save",upload.single("image"),async (req,res)=>{
    const {name,category,unit,price}=req.body;
    const imagePath=req.file.path;
    const result=await uploadImage(imagePath);
    try{
        const live=await liveModel.create({
            name:name,
            category:category,
            unit:unit,
            price:price,
            imageUrl:result,
            date:Date.now()
 })
 res.json({
    message:"Live flower price is updated"
 })
    }catch(error){
        res.json({
            message:"Server error"
        })
    }
})
app.get("/live/get", async (req, res) => {
    let page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
      let search = (req.query.search || "").trim();
        search = search.replace(/^['"]+|['"]+$/g, "");
        console.log(search);
  try{
       const query = search ? { name: { $regex: search, $options: "i" } } : {};
 const total = await liveModel.countDocuments(query);
  
      const totalPages=Math.ceil(total/limit); 
      if(page>totalPages && totalPages>0) page=totalPages;
        const skip = (page - 1) * limit;
      const live = await liveModel.find(query).skip(skip).limit(limit);
        res.json({
            message: "Get all live Price of flower",
            page,
            totalPages:totalPages,
            totalItem: total,
            live: live
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(`${process.env.PORT}`,async ()=>{
 await  connection()
    console.log(`server port start ${process.env.PORT} `)
})