import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";
import { users } from "../db/schema/user.js";
import { db } from "../configuration/db.js";
import bcrypt from "bcrypt";
import { createAccesstoken } from "../utility/util.js";
import { globalMailService } from "../service/globalMailService.js";
import { createMessage } from "../utility/smsService.js";
import { generateOtp } from "../utility/generateOtp.js";

//===================> Register User <===========
export async function register(req, res, next) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      isEmailVerified,
      isPhoneVerified,
      createdBy,
      updatedBy,
      userRole
    } = req.body;

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Email already registered"
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        password: hashPassword,
        phone,
        isEmailVerified: isEmailVerified || false,
        isPhoneVerified: isPhoneVerified || false,
        createdBy,
        updatedBy,
        userRole: userRole || "user",
        status: "Active"
      })
      .returning();

    // Send registration email
    globalMailService(
      {
        to: newUser.email,
        subject: "Registration Created Successfully",
      },
      {
        isRegistrationByAdmin: true,
        firstName: newUser.firstName,
        email: newUser.email,
        password: req.body.password,
      },
      "en-mail-template.html"
    );

    const token = createAccesstoken(newUser);

    res.status(201).send({
      status: "success",
      message: res.__("users.create") || "User created successfully",
      data: newUser,
      token: token
    });
  } catch (error) {
    next(error);
  }
}

//===================> Login User <===========
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email.toLowerCase().trim()),
          eq(users.status, "Active")
        )
      )
      .limit(1);

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "User not exists"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        status: "error",
        message: "Invalid password"
      });
    }

    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: "success",
      message: "Login successful",
      token: token,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
}

//===================> Test Route <===========
export async function test(req, res, next) {
  try{
    console.log("hello")
    return res.status(200).send({
      status:"success",
      message:"Health test check successfully"
    })

  }catch(error){
    next(error)
  }
}

//===================> Get All Users (Listing with Pagination, Search, Filter, Sort) <===========
export async function getAllUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query?.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions = [];

    // Search filter
    if (req.query?.search) {
      const searchTerm = `%${req.query.search}%`;
      conditions.push(
        or(
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm),
          like(users.email, searchTerm)
        )
      );
    }

    // Role filter
    if (req.query?.role) {
      conditions.push(eq(users.userRole, req.query.role));
    }

    // Status filter
    if (req.query?.status) {
      conditions.push(eq(users.status, req.query.status));
    }

    // Soft delete filter (exclude deleted users by default)
    if (req.query?.includeDeleted !== "true") {
      conditions.push(sql`${users.deletedAt} IS NULL`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting
    let orderBy = [desc(users.createdAt)];
    if (req.query?.sortBy) {
      const sortColumn = users[req.query.sortBy];
      if (sortColumn) {
        const order = req.query?.order === "asc" ? asc : desc;
        orderBy = [order(sortColumn)];
      }
    }

    // Execute count and query in parallel
    const [usersList, totalCount] = await Promise.all([
      db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          isEmailVerified: users.isEmailVerified,
          isPhoneVerified: users.isPhoneVerified,
          userRole: users.userRole,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          createdBy: users.createdBy,
          updatedBy: users.updatedBy
        })
        .from(users)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(whereClause)
        .then(result => parseInt(result[0].count))
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      status: "success",
      message: usersList.length > 0
        ? "Users retrieved successfully"
        : "No users found",
      data: usersList,
      pagination: {
        currentPage: page,
        limit: limit,
        totalDocs: totalCount,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limit, totalCount)
      }
    });
  } catch (error) {
    next(error);
  }
}

//===================> Get Single User Details <===========
export async function getUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID"
      });
    }

    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        isEmailVerified: users.isEmailVerified,
        isPhoneVerified: users.isPhoneVerified,
        userRole: users.userRole,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        createdBy: users.createdBy,
        updatedBy: users.updatedBy
      })
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          sql`${users.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    return res.status(200).send({
      status: "success",
      message: "User retrieved successfully",
      data: user
    });
  } catch (error) {
    next(error);
  }
}

//===================> Update User <===========
export async function updateUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID"
      });
    }

    const updateData = { ...req.body };

    // Prevent updating sensitive fields directly
    delete updateData.id;
    delete updateData.password;
    delete updateData.createdAt;
    delete updateData.createdBy;

    // Hash password if provided in update
    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    // Set updated timestamp
    updateData.updatedAt = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(
        and(
          eq(users.id, userId),
          sql`${users.deletedAt} IS NULL`
        )
      )
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        isEmailVerified: users.isEmailVerified,
        isPhoneVerified: users.isPhoneVerified,
        userRole: users.userRole,
        status: users.status,
        updatedAt: users.updatedAt
      });

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
}

//===================> Soft Delete User <===========
export async function deleteUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID"
      });
    }

    const [deletedUser] = await db
      .update(users)
      .set({
        deletedAt: new Date(),
        status: "Inactive",
        updatedAt: new Date()
      })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.deletedAt} IS NULL`
        )
      )
      .returning({
        id: users.id,
        email: users.email,
        status: users.status,
        deletedAt: users.deletedAt
      });

    if (!deletedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found or already deleted"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully",
      data: deletedUser
    });
  } catch (error) {
    next(error);
  }
}

//===================> Hard Delete User (Permanent) <===========
export async function hardDeleteUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID"
      });
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email
      });

    if (!deletedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User permanently deleted",
      data: deletedUser
    });
  } catch (error) {
    next(error);
  }
}

//===================> Verify OTP <===========
export async function verifyOtp(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const otp = req.body.otp.trim();

    const [userStored] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.status, "Active"),
          sql`${users.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!userStored) {
      return res.status(404).send({
        status: "error",
        message: res.__("noUser") || "User not found",
      });
    }

    if (userStored.otpCode !== otp) {
      return res.status(400).send({
        status: "error",
        message: res.__("users.otpNotMatch") || "OTP does not match",
      });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const otpExpireTime = parseInt(userStored.otpExpire);

    if (otpExpireTime < currentTime) {
      return res.status(410).send({
        status: "error",
        message: res.__("users.otpExp") || "OTP has expired",
      });
    }

    // Update user as email verified
    await db
      .update(users)
      .set({
        isEmailVerified: true,
        otpCode: null,
        otpExpire: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userStored.id));

    return res.status(200).send({
      status: "success",
      message: res.__("users.verify") || "Email verified successfully",
      accessToken: createAccesstoken(userStored),
      user: {
        id: userStored.id,
        firstName: userStored.firstName,
        lastName: userStored.lastName,
        email: userStored.email,
        phone: userStored.phone,
      },
    });
  } catch (error) {
    next(error);
  }
}

//===================> Change Password <===========
export async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: "error",
        message: "Current password is incorrect"
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Send password changed email
    const emailData = {
      to: user.email,
      subject: "Password Changed Successfully",
    };
    const newInfo = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      changePassword: true,
    };

    // Note: Replace addToMailQueue with your actual mail service
    // await addToMailQueue({
    //   emailData,
    //   replacements: newInfo,
    //   htmlFileName: "en-mail-template.html",
    // });

    globalMailService(emailData, newInfo, "en-mail-template.html");

    return res.status(200).send({
      status: "success",
      message: res.__("users.changPassword") || "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
}

//===================> Forgot Password <===========
export async function forgotPassword(req, res, next) {
  try {
    const { otp, email, newPassword } = req.body;
    const trimmedOtp = otp.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedNewPassword = newPassword.trim();

    const [userStored] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, trimmedEmail),
          eq(users.otpCode, trimmedOtp),
          eq(users.status, "Active"),
          sql`${users.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!userStored) {
      return res.status(400).send({
        status: "error",
        message: "Please enter valid email and OTP",
      });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const otpExpireTime = parseInt(userStored.otpExpire);

    if (otpExpireTime < currentTime) {
      return res.status(400).send({
        status: "error",
        message: res.__("users.otpExp") || "OTP has expired",
      });
    }

    const hashedNewPassword = await bcrypt.hash(trimmedNewPassword, 10);

    await db
      .update(users)
      .set({
        password: hashedNewPassword,
        otpCode: null,
        otpExpire: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userStored.id));

    // Send password reset email
    const emailData = {
      to: userStored.email,
      subject: "Password Reset Successfully!",
    };
    const newInfo = {
      firstName: userStored.firstName,
      email: userStored.email,
      forgetPassword: true,
    };

    // Note: Replace with your actual mail service
    globalMailService(emailData, newInfo, "en-mail-template.html");

    return res.status(200).send({
      status: "success",
      message: res.__("users.passwordUpdate") || "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

//===================> Resend OTP <===========
export async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    const trimmedEmail = email.trim().toLowerCase();

    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, trimmedEmail),
          eq(users.status, "Active"),
          sql`${users.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Math.floor(Date.now() / 1000) + 600; // 10 minutes

    await db
      .update(users)
      .set({
        otpCode: newOtp,
        otpExpire: otpExpire.toString(),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Send OTP email
    const emailData = {
      to: user.email,
      subject: "Your OTP Code",
    };
    const newInfo = {
      firstName: user.firstName,
      otp: newOtp,
    };

    globalMailService(emailData, newInfo, "en-otp-template.html");

    return res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
}

//===================> Get Current User Profile <===========
export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        isEmailVerified: users.isEmailVerified,
        isPhoneVerified: users.isPhoneVerified,
        userRole: users.userRole,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          sql`${users.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Profile retrieved successfully",
      data: user
    });
  } catch (error) {
    next(error);
  }
}

//===================> Update Profile <===========
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone } = req.body;

    const [updatedUser] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        phone,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.deletedAt} IS NULL`
        )
      )
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        updatedAt: users.updatedAt
      });

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
}



//=============================> Send Otp function <================
export async function sendOtp(req,res,next){
  try{
    let otp=generateOtp();
    console.log(otp)
    const data={
      body:`Your Otp is ${otp}`,
      to:"+916394423282"
    }
    const result=await createMessage(data);
    return res.status(200).send({
      status:"success",
      message:res.__("sms.sentSuccessfully")
    })

  }catch{
    next(error);
  }
}