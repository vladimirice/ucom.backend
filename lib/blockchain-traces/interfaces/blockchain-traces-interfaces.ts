import { ITraceAction } from './blockchain-actions-interfaces';

interface ITrace {
  _id:          Buffer; // MongoDb ObjectId
  account:      string;
  blockid:      string;
  blocknum:     number;
  blocktime:    string;
  irreversible: boolean;
  trxid:        string;

  actions:      ITraceAction[];
}

interface IProcessedTrace {
  block_number:       number;
  block_id:           string;
  memo:               string;
  tr_type:            number;
  tr_processed_data:  any;
  tr_id:              string;
  account_name_from:  string;
  account_name_to:    string | null;

  raw_tr_data:        any;
  tr_executed_at:     string;
}

export {
  ITrace,
  IProcessedTrace,
};
