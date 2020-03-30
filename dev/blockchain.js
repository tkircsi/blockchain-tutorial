const SHA256 = require('sha256');
const uuid = require('uuid');
const _ = require('lodash');

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
  this.genesisBlock = this.createNewBlock(
    0,
    '0000',
    this.hashBlock('0000', 'Genesis Bloc', 0)
  );
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

Blockchain.prototype.chainIsValid = function(blockchain) {
  const gen = { ...this.genesisBlock };
  delete gen.timestamp;
  const gen_other = { ...blockchain[0] };
  delete gen_other.timestamp;
  const genesisIsValid = _.isEqual(gen, gen_other);

  if (!genesisIsValid) return false;

  for (let i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    const previousBlock = blockchain[i - 1];
    const blockHash = this.hashBlock(
      previousBlock['hash'],
      currentBlock['transactions'],
      currentBlock['nonce']
    );

    if (blockHash.substring(0, 4) !== '0000') return false;

    if (currentBlock['previousBlockHash'] !== previousBlock['hash'])
      return false;
  }
  return true;
};

Blockchain.prototype.getBlock = function(blockHash) {
  for (block of this.chain) {
    if (block.hash === blockHash) return block;
  }
  return null;
};

Blockchain.prototype.getTransaction = function(transactionId) {
  for (block of this.chain) {
    for (tx of block.transactions) {
      if (tx.transactionId === transactionId) return { block, tx };
    }
  }
  return null;
};

Blockchain.prototype.getAddressData = function(address) {
  const addressTransactions = [];
  let balance = 0;
  for (let block of this.chain) {
    for (let tx of block.transactions) {
      if (tx.sender === address || tx.recipient === address) {
        if (tx.sender === address) {
          balance -= tx.amount;
        }
        if (tx.recipient === address) {
          balance += tx.amount;
        }
        addressTransactions.push(tx);
      }
    }
  }
  return {
    addressTransactions,
    balance
  };
};

module.exports = Blockchain;
