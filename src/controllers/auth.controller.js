const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../models/blackList.model")

/**
 * user register controller
 *  POST /api/auth/register
 */
async function userRegisterController(req, res) {
  try {
    // get user data from request body
    const { name, email, password } = req.body;

    // check if user already exists with same email
    const isExist = await userModel.findOne({ email });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    // create new user in database
    const user = await userModel.create({
      name,
      email,
      password
    });

    // generate JWT token for login session
    const token = jwt.sign(
      { userID: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // store token in browser cookie
    res.cookie("token", token);

    // send response immediately for fast API performance
    res.status(201).json({
      user: {
        name: user.name,
        email: user.email,
        _id: user._id
      },
      token,
      success: true
    });
    

    // send welcome email in background after response
    await emailService.sendRegistrationEmail(user.email, user.name);

  } catch (error) {
    // handle server errors
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


/**
 * user login controller
 * POST = /api/auth/login
 */
async function userLoginController(req, res) {
   const { email, password } = req.body;

   const user = await userModel.findOne({ email }).select("+password");

   if (!user) {
      return res.status(400).json({
         success: false,
         message: "Invalid email or password"
      });
   }

   const isValidPassword = await user.comparePassword(password);

   if (!isValidPassword) {
      return res.status(400).json({
         success: false,
         message: "Invalid email or password"
      });
   }

   const token = jwt.sign(
      { userID: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
   );

   res.cookie("token", token);

   return res.status(200).json({
      user: {
         name: user.name,
         email: user.email,
         _id: user._id
      },
      token,
      success: true
   });
}

/**
 * user logout controller
 *  POST /api/auth/logout
 */
async function userLogoutController(req,res){

  const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

  if(!token){
    return res.status(200).json({
       message: "user logged out successfully"
    })
  }

   //token ko clear kardiya 

  //clear karnay kay baad usse blackList bhi kardengay
  await tokenBlackListModel.create({
    token:token
  })
  
  res.clearCookie("token")

  res.status(200).json({
    message:"User logged out Successfully"
  })

}



module.exports = {
  userRegisterController,userLoginController,userLogoutController
};