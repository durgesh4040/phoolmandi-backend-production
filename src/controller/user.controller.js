import userModel from "../model/userModel.js";
import bcrypt, { hash } from "bcrypt";
import { createAccesstoken } from "../utility/util.js";
import { globalMailService } from "../service/globalMailService.js";
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
  globalMailService(
    {
      to: user.email,
      subject: "Registration Created Successfully",
    },
    {
      isRegistationByAdmin: true,
      firstname: user.firstname,
      email: user.email,
      password:req.body.password,
    },
    "en-mail-template.html"
  );
  const token = createAccesstoken(user);
  res.status(201).send({
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
//======================> Verify Otp <================
export async function verifyOtp(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const otp = req.body.otp.trim();
    let userStored = await userModel.findOne({
      email_address: email,
      status: "Active",
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
      userModel.updateOne(
        { _id: userStored._id },
        { $set: { isEmailVerified: true } }
      )
      res.status(200).send({
        status: "success",
        message: res.__("users.verify"),
        accessToken: createAccesstoken(userStored),
        user: {
          id: userStored.id,
          user_id: userStored.user_id,
          firstname: userStored.first_name,
          lastName: userStored.last_name,
          email: userStored.email_address,
          phone: userStored.phone_number,
        },
      });
    }
  } catch (error) {
    next(error);
  }
}
export async function changePassword(req, res, next) {
  try {
    let newUser = await userModel.updateOne(
      {
        _id: req.user.id
      },
      {
        $set: { password: req.body.newPassword }
      }
    );
    let dbData = await userModel.findOne({
      id: req.user.id,
    });
    const emailData = {
      to: dbData.email,
      subject: "Password Changed Successfully",
    };
    const newInfo = {
      firstName: dbData.first_name,
      lastName: dbData.email_address,
      email: req.body.newPassword,
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
export async function forgetPassword(req, res, next) {
  try {
    const params = req.body;
    const otp = params.otp.trim();
    const email = params.email.trim().toLowerCase();
    const newPassword = params.newPassword.trim();
    let userStored = await userModel.findOne({
      email: email,
      otpCode: otp,
      status: "Active",
    }
    );
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
      const data = userModel.updateOne(
        { $set: { user_password: newPassword } },
        { email_address: email },
      );
      let dbData = await userModel.findOne(
        {
          email: req?.body?.email,
        });
      const emailData = {
        to: dbData.email_address,
        subject: "Password Reset Successfully !",
      };
      const newInfo = {
        firstname: dbData.first_name,
        email: dbData.email_address,
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