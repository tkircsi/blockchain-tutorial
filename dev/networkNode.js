const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const Blockchain = require('./blockchain');
const uuid = require('uuid');
const axios = require('axios');

const PORT = process.argv[2];
const nodeUrl = process.argv[3];
const nodeAddress = uuid
  .v1()
  .split('-')
  .join('');

const BC = new Blockchain(nodeUrl);
console.log(JSON.stringify(BC, null, 4));
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

app.post('/transaction', async (req, res) => {
  BC.createNewTransaction(req.body);
  res.status(200).json({
    success: true,
    data: req.body
  });
});

app.get('/mine', async (req, res) => {
  BC.createNewTransaction({
    amount: 12.5,
    sender: null,
    recipient: nodeAddress
  });

  const previousBlockHash = BC.getLastBlock().hash;
  const nonce = BC.proofOfWork(previousBlockHash, BC.pendingTransactions);
  const hash = BC.hashBlock(previousBlockHash, BC.pendingTransactions, nonce);
  const newBlock = BC.createNewBlock(nonce, previousBlockHash, hash);
  res.status(200).json({
    success: true,
    block: newBlock
  });
});

app.post('/register-and-broadcast-node', async (req, res) => {
  const { newNodeUrl } = req.body;
  BC.registerNewNodeUrl(newNodeUrl);
  const networkNodes = BC.getNetworkNodes();
  networkNodes.forEach(async networkNodeUrl => {
    try {
      // Do not broadcast to itself and to the new node
      if (networkNodeUrl === nodeUrl || networkNodeUrl === newNodeUrl) return;
      const body = { newNodeUrl };
      const header = {
        'Content-Type': 'application/json'
      };
      const res = await axios.post(
        networkNodeUrl + '/register-node',
        body,
        header
      );
    } catch (err) {
      console.error(err);
    }
  });
});

app.post('/register-node', async (req, res) => {
  console.log(req.body);
});

app.post('/register-node-bulk', async (req, res) => {});

app.get('/network-nodes', async (req, res) => {
  const networkNodes = BC.getNetworkNodes();
  res.status(200).json({
    networkNodes: networkNodes
  });
});

app.get('/', async (req, res) => {
  res.status(200).json({
    success: true,
    data: 'Hello @ Blockchain API!'
  });
});

const server = app.listen(PORT, () => {
  console.log(
    `Node ${nodeAddress} is running in ${process.env.NODE_ENV} mode on port ${PORT}!`
      .yellow.bold
  );
});
