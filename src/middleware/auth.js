import jwt from "jsonwebtoken";
const auth= (req,res,next)=>{
    const authheads=req.headers.authorization;
    const token=authheads.split(' ')[1];
    if(!token){
        res.status(401).json({
            message:"Unauthorized token for successful"
        })
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_PASSWORD);
        req.user=decoded;
        next();

    }catch(error){
        res.status(401).json({
            message:"server error"
        })
    }
}
export default auth;