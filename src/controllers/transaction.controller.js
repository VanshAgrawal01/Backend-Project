const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");
const { v4: uuid } = require('uuid');

/**
 * create new transaction controller
 * POST /api/transactions
 * the 10-steps Transfer Flow:
 * 1-validate request body
 * 2 . validate idempotency key
 * 3. check account stratus
 * 4 check sending account balance from ledger
 * 5. create transaction (with pending status)
 * 6. create debit entry in ledger for sending account
 * 7. create credit entry in ledger for receiving account
 * 8. mark transaction as completed
 * 9. commit mongoDB session
 * 10. send email notifications in background
 */
async function checkDailyLimitLogic(userId, amount) {

  const DAILY_LIMIT = 50000;

  const accounts = await accountModel.find({ user: userId }).select("_id");
  const accountIds = accounts.map(acc => acc._id);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const txns = await transactionModel.find({
    fromAccount: { $in: accountIds },
    createdAt: { $gte: startOfDay },
    status: "COMPLETED"
  });

  const totalSpent = txns.reduce((sum, txn) => sum + txn.amount, 0);

  if (totalSpent + amount > DAILY_LIMIT)  {
    throw new Error("Daily limit exceeded");
  }
}


async function createTransaction(req, res) {

  /**
   * 1. validate request body
   */
  const {fromAccount, toAccount, amount, idempotencyKey} = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({    
      success: false,
      message: "fromAccount, toAccount, amount and idempotencyKey are required"
    });
  }  
  
  const fromUserAccount = await accountModel.findOne(
    {_id: fromAccount}
  );
  const toUserAccount = await accountModel.findOne(
    {_id: toAccount}
  );

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      success: false,
      message: "fromAccount or toAccount not found"
    });
  }


  /**
   * 2. validate idempotency key
   */
  
  const isTransacttonAlreadyExists = await transactionModel.findOne({
    //check if transaction with the same idempotency key already exists
    idempotencyKey:idempotencyKey
  })
  // if transaction with the same idempotency key already exists, return error
  if (isTransacttonAlreadyExists) {
   if (isTransacttonAlreadyExists.status === "COMPLETED") {
   return res.status(200).json({
      success: true,
      message: "transaction already completed",
      transaction: isTransacttonAlreadyExists
    });
   }

   if (isTransacttonAlreadyExists.status === "PENDING") {
    return res.status(200).json({
      success: true,
      message: "transaction is pending",
    });
   }

   if (isTransacttonAlreadyExists.status === "FAILED") {
    return res.status(500).json({
      success: false,
      message: "transaction failed, please try again",
    });
   }

   if (isTransacttonAlreadyExists.status === "REVERSAL") {
    return res.status(500).json({
      success: true,
      message: "transaction already reversed",
    });
   }



  }

  /**
   * 3. check account status
   */

  //here we check from account and to account status is active or not, if not active return error means it is frozen or closed account
  if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
    return res.status(400).json({
      success: false,
      message: " Both fromAccount or toAccount must be active to process the transaction"
    });
  }
   try {
    await checkDailyLimitLogic(req.user._id, Number(amount));
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
     });
  }
  
  /**
   * 4. check sending account balance from ledger
   */ 
   const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance in fromAccount . Current balance is ${balance} ,required balance is ${amount}`
      });
    }
     
    let transaction;
    try {

    
    /**
     * 5. create transaction (with pending status)
      */
    const session = await mongoose.startSession(); //MongoDB bol rahamain ek isolated context bana raha hoon
    session.startTransaction(); //startTansaction is a built-in method of mongooswe if all operation are successful then we will commit otherwise if any one operation can fail it will be automatically rollback

    transaction = (await transactionModel.create([{
    fromAccount,
    toAccount,
    amount, //how much money we want to transfer
    idempotencyKey, //to make sure that if the same request is sent multiple times, it will only be processed once
    status: "PENDING"
    }],{session})) [0]//pass session to all the operations that we want to be part of the transaction)
  
  const debitLedgerEntry = await ledgerModel.create([{
    account: fromAccount,
    transaction: transaction._id,
    amount: amount,
    type: "DEBIT"
  }],{session})

   
 await (() =>{
   return new Promise((resolve) => setTimeout(resolve, 10 * 1000)); //simulate some delay in processing the transaction
  })()

  const creditLedgerEntry = await ledgerModel.create([{
    account: toAccount,
    transaction: transaction._id,
    amount: amount,
    type: "CREDIT"
  }],{session})
 

   await transactionModel.findByIdAndUpdate({_id: transaction._id} ,
    {status: "COMPLETED"}, 
    {session}) 


    
  await session.commitTransaction(); //if all operation are successful then we will commit the transaction
  session.endSession(); //end the session
   } catch(error){
    return res.status(400).json({
      message:"Transaction is pending due to some issue ,please try again after some time"
    })
      
   }
   

  /**
   * 10. send email notifications in background
   * 
   */

  await emailService.sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    toAccount._id
  )

  return res.status(201).json({
    success: true,
    message: "Transaction completed successfully",
    transaction: transaction
  });

}

async function createInitialFundsTransaction(req, res){
  const {toAccount, amount, idempotencyKey} = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({    
      success: false,
      message: "toAccount, amount and idempotencyKey are required"
    });
  }

  const toUserAccount = await accountModel.findOne(
    {_id: toAccount}
  );
  if (!toUserAccount) {
    return res.status(400).json({
      success: false,
      message: "toAccount not found"
    });
   }
  
   //
   const fromUserAccount = await accountModel.findOne({
    user : req.user._id //system user account ko find kar rahe hai jiska user id current logged in user ke id ke barabar hai, isse hum ensure kar rahe hai ki system user account sirf admin user ke paas hi ho aur koi bhi normal user system user account create nahi kar sakta hai
    })

    if (!fromUserAccount) {
    return res.status(400).json({
      success: false,
      message: "System user account not found for the current user"
    });
   }

   const session = await mongoose.startSession(); //MongoDB bol rahamain ek isolated context bana raha hoon
   session.startTransaction(); 
try{
   const transaction = await transactionModel.create([{
  fromAccount: fromUserAccount._id,
  toAccount,
  amount,
  idempotencyKey,
  status: "PENDING"
}], { session });


    const debitLedgerEntry = await ledgerModel.create([{
  account: fromUserAccount._id,
  transaction: transaction[0]._id,  // .create() returns array in session mode
  amount,
  type: "DEBIT"
}], { session });

    const creditLedgerEntry = await ledgerModel.create([{
      account: toAccount,
      transaction: transaction[0]._id,  // .create() returns array in session mode
      amount: amount,
      type: "CREDIT"
    }],{session})

   transaction[0].status = "COMPLETED";
await transaction[0].save({ session });

await session.commitTransaction();
session.endSession();

return res.status(201).json({
  success: true,
  message: "Initial funds transaction completed successfully",
  transaction: transaction[0] 
});
}
catch (error) {
  await session.abortTransaction(); 
  return res.status(500).json({ success: false, message: error.message });

} finally {
  session.endSession(); 
}
}


async function getTransactions(req, res) {

  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const userAccounts = await accountModel.find({ user: userId }).select("_id");

  const accountIds = userAccounts.map(acc => acc._id);

  const transactions = await transactionModel.find({
    $or: [
      { fromAccount: { $in: accountIds } },
      { toAccount: { $in: accountIds } }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(Number(limit))

  .populate({
    path: "fromAccount",
    populate: { path: "user", select: "name email" }
  })
  .populate({
    path: "toAccount",
    populate: { path: "user", select: "name email" }
  });

  const formattedTransactions = transactions.map(txn => {

  const isDebit =
    txn.fromAccount?.user?._id.toString() === userId.toString();

  return {
    id: txn._id,
    amount: txn.amount,
    currency: "INR",
    type: isDebit ? "DEBIT" : "CREDIT",
    label: txn.fromAccount ? "Transfer" : "Initial Funding", 
    from: txn.fromAccount?.user?.name || "SYSTEM",
    to: txn.toAccount?.user?.name,
    date: new Date(txn.createdAt).toLocaleString(), // 🥈\\
    status: txn.status
  };
});

  const total = await transactionModel.countDocuments({
    $or: [
      { fromAccount: { $in: accountIds } },
      { toAccount: { $in: accountIds } }
    ]
  });
  return res.status(200).json({
    success: true,
    total,
    page: Number(page),
    limit: Number(limit),
    transactions: formattedTransactions 
  });
}

async function getLedger(req, res) {
  try {
    const userId = req.user._id;
    const { accountId } = req.params;

    const account = await accountModel.findOne({
      _id: accountId,
      user: userId
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    const ledger = await ledgerModel.find({
      account: accountId
    }).sort({ createdAt: -1 });

    const formattedLedger = ledger.map(entry => ({
      id: entry._id,
      amount: entry.amount,
      type: entry.type,
      date: new Date(entry.createdAt).toLocaleString(),
      transactionId: entry.transaction
    }));

    return res.status(200).json({
      success: true,
      total: formattedLedger.length,
      ledger: formattedLedger
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
async function reverseTransaction(req, res) {
  const { transactionId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const originalTxn = await transactionModel
      .findById(transactionId)
      .populate({
        path: "fromAccount",
        populate: { path: "user", select: "name email" }
      })
      .populate({
        path: "toAccount",
        populate: { path: "user", select: "name email" }
      });

    if (!originalTxn) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    const alreadyReversed = await transactionModel.findOne({
      idempotencyKey: "REV-" + transactionId
    });

    if (alreadyReversed) {
      return res.status(400).json({
        success: false,
        message: "Transaction already reversed"
      });
    }

    const reverseTxn = new transactionModel({
      fromAccount: originalTxn.toAccount._id,
      toAccount: originalTxn.fromAccount._id,
      amount: originalTxn.amount,
      status: "REVERSAL",
      idempotencyKey: "REV-" + transactionId
    });

    await reverseTxn.save({ session });

    await ledgerModel.create([
      {
        account: reverseTxn.fromAccount,
        amount: reverseTxn.amount,
        transaction: reverseTxn._id,
        type: "DEBIT"
      },
      {
        account: reverseTxn.toAccount,
        amount: reverseTxn.amount,
        transaction: reverseTxn._id,
        type: "CREDIT"
      }
    ], { session, ordered: true });

   
    await session.commitTransaction();
    session.endSession();

    setImmediate(() => {
      emailService.sendReverseEmail(
        originalTxn.fromAccount?.user?.email,
        originalTxn.fromAccount?.user?.name,
        originalTxn.amount
      ).catch(err => console.error("Email failed:", err.message));
    });

    return res.status(200).json({
      success: true,
      message: "Transaction reversed successfully",
      reverseTransaction: reverseTxn
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


module.exports = {
  createTransaction,
  createInitialFundsTransaction,
  getTransactions ,
  getLedger,
  reverseTransaction

}


