import { ITraceAction } from './blockchain-actions-interfaces';

interface IBlockchainTrace {
  _id:          Buffer; // MongoDb ObjectId
  account:      string;
  blockid:      string;
  blocknum:     number;
  blocktime:    string;
  irreversible: boolean;

  actions:      ITraceAction[];
}

export {
  IBlockchainTrace,
};
