import { IMongoAction } from './mongo-actions-interfaces';

interface IMongoTransaction {
  _id:          Buffer; // MongoDb ObjectId
  account:      string;
  blockid:      string;
  blocknum:     number;
  blocktime:    string;
  irreversible: boolean;

  actions:      IMongoAction[];
}

export {
  IMongoTransaction,
};
