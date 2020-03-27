const SHA256 = require('sha256');
const uuid = require('uuid');

function Blockchain(currentNodeUrl) {
  this.chain = [];
  this.pendingTransactions = [];
  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = new Set();
  this.networkNodes.add(currentNodeUrl);

  this.pendingTransactions.push({
    amount: 10,
    sender: '',
    recipient: 'Tibor'
  });
  this.createNewBlock(0, '0000', this.hashBlock('0000', 'Genesis Bloc', 0));
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
  const newBlock = {
    timestamp: Date.now(),
    transactions: this.pendingTransactions.splice(
      0,
      this.pendingTransactions.length
    ),
    nonce,
    hash,
    previousBlockHash
  };

  this.addNewBlock(newBlock);

  return newBlock;
};

Blockchain.prototype.addNewBlock = function(newBlock) {
  this.chain.push(newBlock);
};

Blockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function({
  amount,
  sender,
  recipient
}) {
  const newTx = {
    amount,
    sender,
    recipient,
    transactionId: uuid
      .v1()
      .split('-')
      .join('')
  };
  return newTx;
};

Blockchain.prototype.addTransactionToPendndingTransactions = function(newTx) {
  this.pendingTransactions.push(newTx);
};

Blockchain.prototype.clearPendingTransactions = function() {
  this.pendingTransactions = [];
};

Blockchain.prototype.hashBlock = function(
  previousBlockHash,
  currentBlockData,
  nonce
) {
  return SHA256(previousBlockHash + JSON.stringify(currentBlockData) + nonce);
};

Blockchain.prototype.proofOfWork = function(
  previousBlockHash,
  currentBlockData
) {
  let nonce = 0;
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  while (hash.substring(0, 4) !== '0000') {
    nonce++;
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  }
  return nonce;
};

Blockchain.prototype.registerNewNodeUrl = function(newNodeUrl) {
  this.networkNodes.add(newNodeUrl);
};

Blockchain.prototype.getNetworkNodes = function() {
  return Array.from(this.networkNodes.keys());
};

module.exports = Blockchain;
