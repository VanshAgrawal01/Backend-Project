const express = require('express');
const authMiddleware = require("../middleware/auth.middleware");
const accountController = require("../controllers/account.controller");


const router = express.Router();



//cretae api
/**
 * -post /api/account
 * -create new account for logged in user
 * -private route(cookies or headers may valid token required)
 */
router.post("/", authMiddleware.authMiddleware,accountController.createAccountController);


/**
 * - GET /api/accounts
 * - Get all accounts of logged in user
 * - protected route / private route(cookies or headers may valid token required)
 */

router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController);

/**
 * -Get /api/accounts/balance/:accountId
  * -Get balance of specific account by accountId
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountsBalanceController);




module.exports = router;