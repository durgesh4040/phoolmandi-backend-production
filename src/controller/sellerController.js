import sellerModel from "../model/sellerModel.js";
import bcrypt, { hash } from "bcrypt";
import { generateToken } from "../utility/util.js";


export const sellerRegistration = async (req, res) => {

    const { email, name, password, companyName, address, phoneNumber } = req.body;
    const selleruser = await sellerModel.findOne({ email });
    if (selleruser) {
        res.status(400).json({
            msg: "seller already exists"
        })
    }
    try {
        const hashpassword = await bcrypt.hash(password, 10);
        const user = await sellerModel.create({
            email: email,
            password: hashpassword,
            phoneNumber: phoneNumber,
            address: address,
            name: name,
            companyName: companyName
        })
        const token = generateToken(user._id)
        res.json({
            msg: "seller successful created",
            token: token,
            sellerId: user._id
        })
    } catch (error) {
        res.json({
            msg: "Server Error",
        })
    }
}