const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const { loginLimiter } = require("../middleware/rateLimit.middleware");

const { userRegisterController } = require("../controllers/auth.controller");
const { userLoginController } = require("../controllers/auth.controller");
const {userLogoutController} =  require("../controllers/auth.controller");

/* Post /api/auth/regidter */


/* Post /api/auth/login */
router.post("/register", userRegisterController);

/* Post /api/auth/logout */
router.post("/logout",userLogoutController);

router.post("/login", loginLimiter, userLoginController);

module.exports = router;