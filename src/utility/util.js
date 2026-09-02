import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.JWT_SECRET || "qwerty";
const EXPIRE_IN = Math.floor(new Date().getTime() / 1000) + 24 * 24 * 60 * 60;
export function createAccesstoken(user) {
  return jwt.sign(
    {
      id: user._id,
      email_address: user.email,
      user_role: user.userRole,
      expiresIn: EXPIRE_IN,
    },
    SECRET_KEY
  ); // DO NOT KEEP YOUR SECRET IN THE CODE!
}

export function decodeToken(token) {
  return jwt.verify(token, SECRET_KEY);
}
