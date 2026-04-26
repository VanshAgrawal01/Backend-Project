const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account',
    required: [true, "Ledger entry must be associated with an account"],
    index: true,
    immutable: true
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    min: [0.01, "Amount must be at least 0.01"],
    immutable: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transaction',
    required: [true, "Ledger entry must be associated with a transaction"],
    index: true,
    immutable: true
  },
  type: {
    type: String,
    enum: {
      values: ["DEBIT", "CREDIT"],
      message: "Type must be either DEBIT or CREDIT",
    },
    required: [true, "Type is required"],
    immutable: true
  }
},{
  timestamps: true
})

function preventLedgerModification(){
  throw new Error("Ledger entries are immutable and cannot be modified or deleted");
}

// Ledger entries are immutable, so we add pre hooks to prevent any updates or deletions. This ensures the integrity of our financial records and prevents any accidental or malicious modifications to the ledger entries. By throwing an error in these hooks, we can ensure that any attempt to modify or delete a ledger entry will be blocked and an appropriate error message will be returned to the client. This is crucial for maintaining the accuracy and reliability of our financial data.
ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndRemove', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);
ledgerSchema.pre('replaceOne', preventLedgerModification);
ledgerSchema.pre('update', preventLedgerModification);



const ledgerModel = mongoose.model('ledger', ledgerSchema);

module.exports = ledgerModel;