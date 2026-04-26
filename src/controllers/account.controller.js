const accountModel = require("../models/account.model"); 


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
module.exports = {
  createAccountController,
  getUserAccountsController,
  getAccountsBalanceController
};