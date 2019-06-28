import { StringToAnyCollection } from '../../common/interfaces/common-types';

interface ITraceAction {
  act_data:           ITraceActionData; // here is a main payload
  inline_traces:      StringToAnyCollection[]; // here is a payload for RAM also

  receipt:            StringToAnyCollection;
  account_ram_deltas: StringToAnyCollection[];
  act:                ITraceActionAct;

  trx_id:             string;
  producer_block_id:  string;
  block_num:          number;
  block_time:         string;
  console:            string;
  context_free:       boolean;
  elapsed:            number;
}

interface ITraceActionAct {
  account:        string;
  authorization:  any;
  data:           string;
  name:           string;
}

interface ITraceActionData extends StringToAnyCollection {}

interface ITraceTransferTokensData extends ITraceActionData {
  from:     string;
  to:       string;
  quantity: string; // 10.0000 UOS - not a number, it is a number + symbol
  memo:     string;
}

// TODO - types for every action

export {
  ITraceAction,
  ITraceTransferTokensData,
};
