const transactionModel = require("../models/transaction.model");

async function detectFraud(userId, amount) {

  let riskScore = 0;
  let reasons = [];

  if (amount > 20000) {
    riskScore += 2;
    reasons.push("High amount");
  }
  const lastMinute = new Date(Date.now() - 60 * 1000);

  const recentTxns = await transactionModel.countDocuments({
    user: userId,
    createdAt: { $gte: lastMinute },
    status: "COMPLETED"
  });

  if (recentTxns > 3) {
    riskScore += 3;
    reasons.push("Too many transactions");
  }

  let action = "ALLOW";

  if (riskScore >= 3 && riskScore < 6) action = "VERIFY";
  if (riskScore >= 6 && riskScore < 8) action = "BLOCK";
  if (riskScore >= 8) action = "FREEZE";

  return { riskScore, action, reason: reasons.join(", ") };
}

module.exports = { detectFraud };