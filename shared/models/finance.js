/**
 * Finance model for the SQUIRREL Suite
 */
class Finance {
  constructor(balance, transactions = []) {
    this.balance = balance;
    this.transactions = transactions;
  }
}

/**
 * Transaction model for the SQUIRREL Suite
 */
class Transaction {
  constructor(id, amount, description, date) {
    this.id = id;
    this.amount = amount;
    this.description = description;
    this.date = date;
  }
}

export { Finance, Transaction };