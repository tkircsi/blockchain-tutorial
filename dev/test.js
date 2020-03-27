const Blockchain = require('./blockchain');
const bc = new Blockchain();

const chain1 = [
  {
    timestamp: 1585324526761,
    transactions: [
      {
        amount: 10,
        sender: '',
        recipient: 'Tibor'
      }
    ],
    nonce: 0,
    hash: 'd2c4634c06f400e412cab8db79bfe0c2e1a15259e6758ac6661ea63298c90f69',
    previousBlockHash: '0000'
  },
  {
    timestamp: 1585324571553,
    transactions: [
      {
        amount: 99,
        sender: 'boldi',
        recipient: 'tibi',
        transactionId: '698ab840704311ea839e97e23a4d967a'
      },
      {
        amount: 10,
        sender: 'bogi',
        recipient: 'tibi',
        transactionId: '6e525270704311ea839e97e23a4d967a'
      },
      {
        amount: 100,
        sender: 'tibi',
        recipient: 'bogi',
        transactionId: '753c0950704311ea839e97e23a4d967a'
      },
      {
        amount: 12.5,
        sender: null,
        recipient: '60372d50704311ea839e97e23a4d967a',
        transactionId: '7912b3d0704311ea839e97e23a4d967a'
      }
    ],
    nonce: 245468,
    hash: '0000d2530cb2a3df660037ec650f1cfb1c8e540b7e0a93d10aa16877b00a6865',
    previousBlockHash:
      'd2c4634c06f400e412cab8db79bfe0c2e1a15259e6758ac6661ea63298c90f69'
  },
  {
    timestamp: 1585324606627,
    transactions: [
      {
        amount: 20,
        sender: 'tibi',
        recipient: 'bogi',
        transactionId: '8951a350704311ea839e97e23a4d967a'
      },
      {
        amount: 30,
        sender: 'tibi',
        recipient: 'bogi',
        transactionId: '8d6bbf70704311ea839e97e23a4d967a'
      },
      {
        amount: 12.5,
        sender: null,
        recipient: '60372d50704311ea839e97e23a4d967a',
        transactionId: '8fa5a9e0704311ea839e97e23a4d967a'
      }
    ],
    nonce: 19605,
    hash: '000049556d9e6afccbc21cf4cdbc2b3a24e7ac86a503c179dd54d1790711d4d2',
    previousBlockHash:
      '0000d2530cb2a3df660037ec650f1cfb1c8e540b7e0a93d10aa16877b00a6865'
  }
];

console.log(bc.chainIsValid(chain1));
