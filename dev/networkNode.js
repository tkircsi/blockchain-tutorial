const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const Blockchain = require('./blockchain');
const uuid = require('uuid');
const axios = require('axios');

const PORT = process.argv[2];
const currentNodeUrl = process.argv[3];
const nodeAddress = uuid
  .v1()
  .split('-')
  .join('');

const BC = new Blockchain(currentNodeUrl);
// console.log(JSON.stringify(BC, null, 4));
// Load env vars
dotenv.config({ path: './dev/config.env' });
const app = express();
app.use(express.json({ extended: false }));

// Dev logging middleware
// app.use(logger);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/blockchain', async (req, res) => {
  res.status(200).json({
    success: true,
    data: BC
  });
});

app.get('/mine', async (req, res) => {
  try {
    const rewardTx = BC.createNewTransaction({
      amount: 12.5,
      sender: null,
      recipient: nodeAddress
    });
    //BC.addTransactionToPendndingTransactions(rewardTx);
    await axios.post(currentNodeUrl + '/transaction/broadcast', {
      newTx: rewardTx
    });

    const previousBlockHash = BC.getLastBlock().hash;
    const nonce = BC.proofOfWork(previousBlockHash, BC.pendingTransactions);
    const hash = BC.hashBlock(previousBlockHash, BC.pendingTransactions, nonce);
    const newBlock = BC.createNewBlock(nonce, previousBlockHash, hash);

    const networkNodes = BC.getNetworkNodes();
    networkNodes.forEach(async networkNodeUrl => {
      if (networkNodeUrl !== currentNodeUrl) {
        await axios.post(networkNodeUrl + '/receive-new-block', { newBlock });
      }
    });

    res.status(200).json({
      success: true,
      block: newBlock
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false
    });
  }
});

app.post('/receive-new-block', async (req, res) => {
  try {
    const { newBlock } = req.body;
    const lastBlock = BC.getLastBlock();
    const isCorrectHash = lastBlock.hash === newBlock.previousBlockHash;

    if (isCorrectHash) {
      BC.addNewBlock(newBlock);
      BC.clearPendingTransactions();
      res.status(200).json({
        success: true
      });
    } else {
      res.status(400).json({
        success: false
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false
    });
  }
});

app.post('/register-and-broadcast-node', async (req, res) => {
  const { newNodeUrl } = req.body;
  BC.registerNewNodeUrl(newNodeUrl);
  const networkNodes = BC.getNetworkNodes();

  networkNodes.forEach(async networkNodeUrl => {
    try {
      // Current node do not need register
      if (networkNodeUrl !== currentNodeUrl) {
        let body = { newNodeUrl };
        const header = {
          'Content-Type': 'application/json'
        };
        // Register to all other node except the new one
        if (newNodeUrl !== networkNodeUrl) {
          await axios.post(networkNodeUrl + '/register-node', body, header);
        } else {
          // Bulk register the new node
          body = {
            networkNodes
          };
          await axios.post(newNodeUrl + '/register-node-bulk', body, header);
        }
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false
      });
    }
  });
  console.log(`Network nodes: ${BC.getNetworkNodes()}`);
  res.status(200).json({
    success: true
  });
});

app.post('/register-node', async (req, res) => {
  try {
    const { newNodeUrl } = req.body;
    BC.registerNewNodeUrl(newNodeUrl);
    console.log(`Network nodes: ${BC.getNetworkNodes()}`);

    res.status(200).json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.post('/register-node-bulk', async (req, res) => {
  try {
    const { networkNodes } = req.body;
    networkNodes.forEach(async nodeUrl => {
      BC.registerNewNodeUrl(nodeUrl);
    });
    console.log(`Network nodes: ${BC.getNetworkNodes()}`);
    res.status(200).json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      success: false
    });
  }
});

app.get('/network-nodes', async (req, res) => {
  const networkNodes = BC.getNetworkNodes();
  res.status(200).json({
    networkNodes: networkNodes
  });
});

app.post('/transaction', async (req, res) => {
  try {
    const { newTx } = req.body;
    BC.addTransactionToPendndingTransactions(newTx);
    res.status(200).json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.post('/transaction/broadcast', async (req, res) => {
  try {
    const { newTx } = req.body;
    const tx = BC.createNewTransaction(newTx);
    BC.addTransactionToPendndingTransactions(tx);
    BC.getNetworkNodes().forEach(async nodeUrl => {
      if (nodeUrl !== currentNodeUrl) {
        await axios.post(nodeUrl + '/transaction', { newTx: tx });
      }
    });
    res.status(200).json({
      success: true
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get('/consensus', async (req, res) => {
  try {
    const networkNodes = BC.getNetworkNodes();
    const responsePromises = [];
    networkNodes.forEach(async networkNodeUrl => {
      responsePromises.push(axios.get(networkNodeUrl + '/blockchain'));
    });

    const blockchains = await Promise.all(responsePromises);
    const chainLength = BC.chain.length;
    let maxChainLength = chainLength;
    let newLongestChain = null;
    let newPendingTransactions = null;
    blockchains.forEach(promiseResult => {
      const blockchain = promiseResult.data.data;
      if (blockchain.chain.length > maxChainLength) {
        if (BC.chainIsValid(blockchain.chain)) {
          maxChainLength = blockchain.chain.length;
          newLongestChain = blockchain.chain;
          newPendingTransactions = blockchain.pendingTransactions;
        }
      }
    });

    if (!newLongestChain) {
      res.status(200).json({
        success: true,
        message: 'Current  chain is up to date.'
      });
    } else {
      BC.chain = newLongestChain;
      BC.pendingTransactions = newPendingTransactions;
      res.status(200).json({
        success: true,
        message: 'Current chain is updated.'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get('/', async (req, res) => {
  res.status(200).json({
    success: true,
    data: 'Hello @ Blockchain API!'
  });
});

app.get('/block/:blockHash', async (req, res) => {
  const blockHash = req.params.blockHash;
  const block = BC.getBlock(blockHash);
  if (block) {
    res.status(200).json({
      success: true,
      block
    });
  } else {
    res.status(404).json({
      success: true
    });
  }
});

app.get('/transaction/:transactionId', async (req, res) => {
  const transactionId = req.params.transactionId;
  const result = BC.getTransaction(transactionId);

  if (result) {
    res.status(200).json({
      success: true,
      transaction: result.tx,
      block: result.block
    });
  } else {
    res.status(404).json({
      success: true
    });
  }
});

app.get('/address/:address', async (req, res) => {
  const address = req.params.address;
  const { balance, addressTransactions } = BC.getAddressData(address);
  res.status(200).json({
    success: true,
    address,
    balance,
    addressTransactions
  });
});

const server = app.listen(PORT, () => {
  console.log(
    `Node ${nodeAddress} is running in ${process.env.NODE_ENV} mode on port ${PORT}!`
      .yellow.bold
  );
});
