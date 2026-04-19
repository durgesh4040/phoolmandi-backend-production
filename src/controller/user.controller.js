import userModel from "../model/userModel.js";
import bcrypt, { hash } from "bcrypt";
import { generateToken } from "../utility/util.js";
export async function register(req, res,next){
    const {
         firstname,
         lastName,
         email, 
         password, 
         phoneNo,
         isEmailVerified,
         isPhoneVerified,
         createdBy,
         updatedBy
        } = req.body;
    const hashpassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
        email,
        password: hashpassword,
        firstname,
        lastName,
        phoneNo,
        isEmailVerified,
        isPhoneVerified,
        createdBy,
        updatedBy
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
        const page = Math.max(1, parseInt(req.query?.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit) || 10));
        const skip = (page - 1) * limit;
        const filter = {};
        if (req.query?.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        if (req.query?.role) {
            filter.role = req.query.role;
        }
        if (req.query?.status) {
            filter.status = req.query.status;
        }

        // Get sorting
        let sortOption = { createdAt: -1 }; // Default sort
        
        if (req.query?.sortBy) {
            const sortBy = req.query.sortBy;
            const order = req.query?.order === 'asc' ? 1 : -1;
            sortOption = { [sortBy]: order };
        }

        // Execute query and count in parallel
        const [users, total] = await Promise.all([
            userModel
                .find(filter)
                .select('-password -__v -refreshToken')
                .skip(skip)
                .limit(limit)
                .sort(sortOption)
                .lean(),
            userModel.countDocuments(filter)
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return res.status(200).json({
            status: "success",
            message: users.length > 0 
                ? "Users retrieved successfully" 
                : "No users found",
            data: users,
            pagination: {
                currentPage: page,
                limit: limit,
                totalDocs: total,
                totalPages: totalPages,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null,
                startIndex: skip + 1,
                endIndex: Math.min(skip + limit, total)
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        next(error);
    }
}