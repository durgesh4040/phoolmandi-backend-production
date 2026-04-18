import userModel from "../model/userModel.js";
import bcrypt, { hash } from "bcrypt";
import { generateToken } from "../utility/util.js";
export const register = async (req, res) => {
    const { email, password, name, username } = req.body;
    console.log(email, password, name, username);
    const hashpassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
        email: email,
        password: hashpassword,
        name: name,
        username: username
    })
    console.log(user);
    const token = generateToken(user._id);
    res.json({
        msg: user,
        token: token
    })

}
export const login = async (req, res) => {
    // console.log("hi");
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        console.log(user);
        if (!user) {
            res.status(400).json({
                msg: "User not extists"
            })
        }
        const compare = await bcrypt.compare(password, user.password);
        console.log(compare);
        const token = generateToken(user._id);
        if (compare) {
            res.status(200).json({
                token: token
            })
        }
        else {
            res.status(400).json({
                msg: "invalid password"
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            msg: "server error"
        })
    }
}
export const test = async (req, res) => {
    res.json({
        msg: "successful login"
    })
}

//===================> Users Listing Api <===========
export async function getAllUser(req, res, next) {
    try {
        const limit = req.query?.limit || 10;
        if (req.query?.page) {
            page = req.query.page ? page * (limit - 1) : 1
        }
        const data = await userModel.find();
        return res.status(200).send({
            status: "success",
            message: "",
            data: data
        })
    } catch (error) {
        next(error)
    }
}