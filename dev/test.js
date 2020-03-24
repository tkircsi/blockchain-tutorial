const Blockchain = require('./blockchain');
const bc = new Blockchain();

const previousBlockHash = bc.hashBlock('000000000', 'Genesis Block', 1);
const genesisBlock = bc.createNewBlock(1, '0000000', previousBlockHash);
console.log('previousBlockHash', previousBlockHash);

bc.createNewTransaction(100, 'Bogi', 'Boldi');
bc.createNewTransaction(50, 'Tibi', 'Bogi');
bc.createNewTransaction(120, 'Boci', 'Boldi');

const nonce = bc.proofOfWork(previousBlockHash, bc.pendingTransactions);
console.log('nonce', nonce);

const hash = bc.hashBlock(previousBlockHash, bc.pendingTransactions, nonce);
console.log('hash', hash);

const newBlock = bc.createNewBlock(nonce, previousBlockHash, hash);
console.log(JSON.stringify(newBlock, null, 4));
