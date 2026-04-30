const { Router } = require('express');
const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");
const { transactionLimiter } = require("../middleware/rateLimit.middleware");




const transactionRoutes = Router();

/**
 * - POST /api/transactions
 * - Create a new transaction
 */

transactionRoutes.post("/",authMiddleware.authMiddleware, transactionLimiter,transactionController.createTransaction); 

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction); //for testing only, remove in production

transactionRoutes.get(
  "/",
  authMiddleware.authMiddleware,
  transactionController.getTransactions
);

transactionRoutes.get(
  "/accounts/:accountId/ledger",
  authMiddleware.authMiddleware,
  transactionController.getLedger
);

transactionRoutes.post(
  "/:transactionId/reverse",
  authMiddleware.authMiddleware,
  transactionController.reverseTransaction
);




module.exports = transactionRoutes;