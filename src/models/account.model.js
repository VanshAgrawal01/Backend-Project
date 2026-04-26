const mongoose = require('mongoose');
const ledgerModel = require("./ledger.model");

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: [true, "User reference is required"],
    index: true// we will frequently query accounts by user ID, so we add an index for faster lookups or humnay user field ko index banaya hai taki jab bhi hum user ID se accounts ko query karenge to wo fast ho jaye. Indexing se database ko pata chal jata hai ki kis field par search karna hai aur wo us field ke values ko sorted order me store karta hai, jisse search performance improve hoti hai. Isse hume apne API endpoints me user ke accounts ko efficiently retrieve karne me madad milegi, especially jab hum user ke multiple accounts ko fetch karenge.
  },
  status: {
    type: String,
    enum:{
      values: ["ACTIVE", "FROZEN", "CLOSED"],
      message: "Status must be either ACTIVE, FROZEN or CLOSED",
    },
     default: "ACTIVE"
  },
  currency: {
    type: String,
    required: [true, "Currency is required"],default: "INR"
    },
  },{
  timestamps: true
  });
 

  //it is called compound index because it is an index on multiple fields. Isse hume apne API endpoints me user ke accounts ko efficiently retrieve karne me madad milegi, especially jab hum user ke multiple accounts ko fetch karenge aur unhe status ke basis par filter karenge. Compound index se database ko pata chal jata hai ki kis combination of fields par search karna hai aur wo us combination ke values ko sorted order me store karta hai, jisse search performance improve hoti hai.


  accountSchema.index({ user: 1, status: 1 });//user aur status par compound index banaya hai taki jab bhi hum user ke accounts ko status ke basis par filter karenge to wo fast ho jaye. Isse hume apne API endpoints me user ke accounts ko efficiently retrieve karne me madad milegi, especially jab hum user ke multiple accounts ko fetch karenge aur unhe status ke basis par filter karenge.

    accountSchema.methods.getBalance = async function() {


      const balanceData = await ledgerModel.aggregate([  
        {$match: {account: this._id}},//ledger collection me se sirf us account ke entries ko match karenge jiska balance nikalna hai. Isse hume apne API endpoints me user ke accounts ke balance ko efficiently calculate karne me madad milegi, especially jab hum user ke multiple accounts ke balance ko fetch karenge. Match stage se database ko pata chal jata hai ki kis field par filter karna hai aur wo us field ke values ko match karta hai, jisse aggregation performance improve hoti hai.
        {
          $group: {
            _id: null,
             totalDebit: {
              $sum: {
                $cond: [
                  {$eq: ["$type", "DEBIT"]},
                  "$amount",
                  0
                ]
              }
            },
            totalCredit: {
              $sum: {
                $cond: [
                  {$eq: ["$type", "CREDIT"]},
                  "$amount",
                  0
                ]
              }
          }
         }
        },
        {
          $project: {
            _id: 0,
            balance: {
              $subtract: ["$totalCredit", "$totalDebit"]
            }
          }
        }
      ])
      if (balanceData.length === 0) {
        return 0; // Agar account ke liye koi ledger entry nahi hai to balance 0 hoga
      }
      return balanceData[0].balance; }//balanceData ek array hai jisme sirf ek object hoga jisme balance field hoga, to us balance field ko return karenge. Isse hume apne API endpoints me user ke accounts ke balance ko efficiently calculate karne me madad milegi, especially jab hum user ke multiple accounts ke balance ko fetch karenge. Project stage se database ko pata chal jata hai ki kis field ko output me include karna hai aur kis field ko exclude karna hai, jisse aggregation performance improve hoti hai.
    
  

const accountModel = mongoose.model('account', accountSchema);

module.exports = accountModel;  