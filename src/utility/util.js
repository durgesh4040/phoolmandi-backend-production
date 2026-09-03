import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.JWT_SECRET || "qwerty";
export function createAccesstoken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      userRole: user.userRole,
    },
    SECRET_KEY,
    { expiresIn: "24h" }
  ); 
}

export function decodeToken(token) {
  return jwt.verify(token, SECRET_KEY);
}
