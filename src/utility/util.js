import jwt from 'jsonwebtoken';
export const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_PASSWORD,{expiresIn:'30d'})
}
