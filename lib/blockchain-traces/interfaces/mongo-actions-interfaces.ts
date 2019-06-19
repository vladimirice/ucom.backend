import { StringToAnyCollection } from '../../common/interfaces/common-types';

interface IMongoAction {
  act_data:           StringToAnyCollection; // here is a main payload
  inline_traces:      StringToAnyCollection[]; // here is a payload for RAM also

  receipt:            StringToAnyCollection;
  account_ram_deltas: StringToAnyCollection[];
  act:                StringToAnyCollection;

  trx_id:             string;
  producer_block_id:  string;
  block_num:          number;
  block_time:         string;
  console:            string;
  context_free:       boolean;
  elapsed:            number;
}

// TODO - types for every action

export {
  IMongoAction,
};
