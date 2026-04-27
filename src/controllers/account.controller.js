const accountModel = require("../models/account.model"); 
const accountActionModel = require("../models/accountAction.model");



async function createAccountController(req, res) {
  
  const user = req.user; //auth middleware se user ki details request object me attach kar di hai to waha se user ki details le rahe hai

  const account = await accountModel.create({
    user: user._id, //account model me user field hai jisme user ki id store karenge taki account ko us user se link kar sake

  })

  res.status(201).json({
    account,
  })


}

async function getUserAccountsController(req, res) {
  const accounts = await accountModel.find({ user: req.user._id}); //auth middleware se user ki details request object me attach kar di hai to waha se user ki id le rahe hai aur us id ke basis par accounts ko database se fetch kar rahe hai taki user ke accounts ko retrieve kar sake. Isse hume apne API endpoints me user ke accounts ko efficiently retrieve karne me madad milegi, especially jab hum user ke multiple accounts ko fetch karenge.

  res.status(200).json({
    accounts,
  })

}


async function getAccountsBalanceController(req, res) {
  const {accountId} = req.params;

 const account = await accountModel.findOne({_id: accountId,
   user: req.user._id
  }); 
   
  if(!account) {
    return res.status(404).json({
      message: "Account not found"
    })
  }
  
  const balance = await account.getBalance(); 

  res.status(200).json({
    accountId : account._id,
    balance
  })


}

// 🔥 FREEZE ACCOUNT
async function freezeAccount(req, res) {
  const { accountId } = req.params;

  const account = await accountModel.findById(accountId);

  if (!account) {
    return res.status(404).json({
      success: false,
      message: "Account not found"
    });
  }

  if (account.status === "FROZEN") {
    return res.status(400).json({
      success: false,
      message: "Account already frozen"
    });
  }

  account.status = "FROZEN";
  await account.save();

  // 🔥 SAVE IN NEW COLLECTION
  await accountActionModel.create({
    account: accountId,
    action: "FREEZE",
    performedBy: req.user._id,
    reason: "Suspicious activity"
  });

  return res.status(200).json({
    success: true,
    message: "Account frozen successfully"
  });
}

// 🔥 UNFREEZE ACCOUNT
async function unfreezeAccount(req, res) {
  const { accountId } = req.params;

  const account = await accountModel.findById(accountId);

  if (!account) {
    return res.status(404).json({
      success: false,
      message: "Account not found"
    });
  }

  if (account.status === "ACTIVE") {
    return res.status(400).json({
      success: false,
      message: "Account already active"
    });
  }

  account.status = "ACTIVE";
  await account.save();

  // 🔥 SAVE IN NEW COLLECTION
  await accountActionModel.create({
    account: accountId,
    action: "UNFREEZE",
    performedBy: req.user._id,
    reason: "Manual unfreeze"
  });

  return res.status(200).json({
    success: true,
    message: "Account unfrozen successfully"
  });
}

module.exports = {
  createAccountController,
  getUserAccountsController,
  getAccountsBalanceController,
  freezeAccount,   
  unfreezeAccount 

};