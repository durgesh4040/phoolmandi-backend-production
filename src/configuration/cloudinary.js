import {v2 as cloudinary} from 'cloudinary';
export async function uploadImage(imagePath){
cloudinary.config({
    cloud_name:"dqcir5rra",
    secure:true,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})
try{
const response=await cloudinary.uploader.upload(imagePath);
return response.url;
}
catch(error){
    console.log(error);
}
}