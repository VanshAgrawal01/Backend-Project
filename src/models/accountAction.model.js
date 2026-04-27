const mongoose = require("mongoose");

const accountActionSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: true
  },
  action: {
    type: String,
    enum: ["FREEZE", "UNFREEZE"],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  reason: {
    type: String,
    default: "Manual action"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("accountAction", accountActionSchema);