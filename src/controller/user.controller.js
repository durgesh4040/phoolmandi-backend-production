import userModel from "../model/userModel.js";
import bcrypt, { hash } from "bcrypt";
import { generateToken } from "../utility/util.js";
export async function register(req, res, next) {
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

        let sortOption = { createdAt: -1 };

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
        next(error);
    }
}

//================> Users Details Api <===============
export async function getUser(req, res, next) {
    try {
        const data = await userModel.findOne({ _id: req.params.id })
        return res.status(200).send({
            status: "success",
            message: "",
            data: data

        })
    } catch (error) {
        next(error)
    }
}

//===================> Update Listing Api <===========
export async function updateUser(req, res, next) {
    try {
        const data = await userModel.findByIdAndUpdate(
            req.params.id,
            req.body,
          { new: true }
        );
    } catch (error) {
        next(error)
    }
}

export async function verifyOtp(req, res, next) {
  const params = req.body;

  const email = params.email.trim().toLowerCase();
  const otp = params.otp.trim();

  try {
    let userStored = await Users.findOne({
      where: {
        email_address: email,
        status: "Active",
      },
      include: [
        {
          model: Roles,
          attributes: ["id", "departmentID", "roleName", "accessIDs"],
        },
      ],
    });
    if (!userStored) {
      return res.status(404).send({
        status: "error",
        message: res.__("noUser"),
      });
    }
    if (userStored.otp_code != otp) {
      res.status(400).send({
        status: "error",
        message: res.__("users.otpNotMatch"),
      });
    } else if (
      userStored.otp_expire < Math.floor(new Date().getTime() / 1000)
    ) {
      res.status(410).send({
        status: "error",
        message: res.__("users.otpExp"),
      });
    } else {
      Users.update({ email_varified: true }, { where: { id: userStored.id } });
      res.status(200).send({
        status: "success",
        message: res.__("users.verify"),
        accessToken: createAccesstoken(userStored),
        // refreshToken: jwt.createRefreshToken(userStored),
        user: {
          id: userStored.id,
          user_id: userStored.user_id,
          first_name: userStored.first_name,
          last_name: userStored.last_name,
          email_address: userStored.email_address,
          phone_number: userStored.phone_number,
          company_name: userStored.company_name,
          start_date: userStored.start_date,
          end_date: userStored.end_date,
          date_of_birth: userStored.date_of_birth,
          user_role: userStored.user_role,
          user_avatar: userStored.user_avatar,
          Role: userStored.Role,
        },
      });
    }
  } catch (error) {
    next(error);
  }
}
/////// Change Password ///////
export async function changePassword(req, res, next) {
  try {
    let newUser = await Users.update(
      {
        user_password: req.body.newPassword,
      },
      {
        where: { id: req.user.id },
        individualHooks: true,
      }
    );
    let dbData = await Users.findOne({
      where: {
        id: req.user.id,
      },
    });
    const emailData = {
      to: dbData.email_address,
      subject: "Password Changed Successfully",
    };
    const newInfo = {
      first_name: dbData.first_name,
      email_address: dbData.email_address,
      user_password: req.body.newPassword,
      changePassword: true,
    };
    await addToMailQueue({
      emailData,
      replacements: newInfo,
      htmlFileName: "en-mail-template.html",
    });
    delete newUser.user_password;
    delete req.body.newPassword;
    apiInfoLogger(req, `change Password`);
    res.status(200).send({
      status: "success",
      message: res.__("users.changPassword"),
      data: newUser,
    });
  } catch (error) {
    apiErrorLogger(req, `fail to change password ${error}`)
    next(error);
  }
}
/////// Change Password ///////
export async function forgetPassword(req, res, next) {
  const params = req.body;
  const otp = params.otp.trim();
  const email = params.email.trim().toLowerCase();
  const newPassword = params.newPassword.trim();
  try {
    let userStored = await Users.findOne({
      where: {
        email_address: email,
        otp_code: otp,
        status: "Active",
      },
    });
    if (!userStored) {
      apiErrorLogger(req, `Please enter valid email and otp`)
      return res.status(400).send({
        status: "error",
        message: "Please enter valid email and otp",
      });
    }
    if (userStored.otp_expire < Math.floor(new Date().getTime() / 1000)) {
      apiErrorLogger(req, `otp Expire`, req.body)
      res.status(400).send({
        status: "error",
        message: res.__("users.otpExp"),
      });
    } else {
      const data = await Users.update(
        { user_password: newPassword },
        { where: { email_address: email }, individualHooks: true }
      );
      let dbData = await Users.findOne({
        where: {
          email_address: req?.body?.email,
        },
      });
      const emailData = {
        to: dbData.email_address,
        subject: "Password Reset Successfully !",
      };
      const newInfo = {
        first_name: dbData.first_name,
        email_address: dbData.email_address,
        user_password: req.body.newPassword,
        forgetPassword: true,
      };
      await addToMailQueue({
        emailData,
        replacements: newInfo,
        htmlFileName: "en-mail-template.html",
      });
      delete req.body.newPassword;
      apiInfoLogger(req, "password update");
      res.status(200).send({
        status: "success",
        message: res.__("users.passwordUpdate"),
        data,
      });
    }
  } catch (error) {
    next(error);
  }
}