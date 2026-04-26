const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");

const { userRegisterController } = require("../controllers/auth.controller");
const { userLoginController } = require("../controllers/auth.controller");
const {userLogoutController} =  require("../controllers/auth.controller");

/* Post /api/auth/regidter */
router.post("/login", userLoginController);

/* Post /api/auth/login */
router.post("/register", userRegisterController);

/* Post /api/auth/logout */
router.post("/logout",userLogoutController);





module.exports = router;