const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account',
    required: [true,"Transaction must be associate with a from account"],
    index: true
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account',
    required: [true, "Transaction must be associated with a to account"],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ["PENDING", "COMPLETED", "FAILED","REVERSAL"],
      message: "Status must be either PENDING, COMPLETED, FAILED or REVERSAL",
    },
    default: "PENDING"
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0.01, "Amount must be at least 0.01"]
  },  
  idempotencyKey: {
    type: String,
    required: [true, "Idempotency key is required"],
    unique: true
  }
},{
  timestamps: true
});

const transactionModel = mongoose.model('transaction', transactionSchema);

module.exports = transactionModel;