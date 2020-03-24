const SHA256 = require('sha256');

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];

  this.pendingTransactions.push({
    amount: 10,
    sender: '',
    recipient: 'Tibor'
  });
  this.createNewBlock(0, '0000', this.hashBlock('0000', 'Genesis Bloc', 0));
}

Blockchain.prototype.createNewBlock = function(nonce, previusBlockHash, hash) {
  const newBlock = {
    timestamp: Date.now(),
    transactions: this.pendingTransactions.splice(
      0,
      this.pendingTransactions.length
    ),
    nonce,
    hash,
    previusBlockHash
  };

  this.chain.push(newBlock);

  return newBlock;
};

Blockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
};

Blockchain.prototype.createNewTransaction = function(
  amount,
  sender,
  recipient
) {
  const newTx = {
    amount,
    sender,
    recipient
  };

  this.pendingTransactions.push(newTx);
  return;
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

module.exports = Blockchain;
