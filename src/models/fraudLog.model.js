const mongoose = require("mongoose");

const fraudLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account"
  },
  amount: Number,
  riskScore: Number,
  action: {
    type: String,
    enum: ["ALLOW", "VERIFY", "BLOCK", "FREEZE"]
  },
  reason: String
}, { timestamps: true });

module.exports = mongoose.model("fraudLog", fraudLogSchema);