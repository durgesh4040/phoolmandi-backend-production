import jwt from "jsonwebtoken";
const SECRET_KEY = global.envVariable.globalConfig.JWT_SECRET || "qwerty";
const EXPIRE_IN = Math.floor(new Date().getTime() / 1000) + 24 * 24 * 60 * 60;
export function createAccesstoken(user) {
  return jwt.sign(
    {
      id: user.id,
      user_id: user.user_id,
      email_address: user.email_address,
      user_type: user.user_type,
      user_role: user.user_role,
      expiresIn: EXPIRE_IN,
    },
    SECRET_KEY
  ); // DO NOT KEEP YOUR SECRET IN THE CODE!
}

export function decodeToken(token) {
  return jwt.verify(token, SECRET_KEY);
}
