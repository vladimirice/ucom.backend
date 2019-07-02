import { StringToAnyCollection } from '../../common/interfaces/common-types';

interface ITraceAction {
  act_data:           ITraceActionData; // here is a main payload
  inline_traces:      ITraceAction[]; // here is a payload for RAM also

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

interface IActNameToActionDataArray {
  [index: string]: ITraceAction[];
}

interface IFromToMemo {
  from: string,
  to:   string | null,
  memo: string,
}

interface ITraceActionData extends StringToAnyCollection {}

interface ITraceActionTransferTokens extends ITraceAction {
  act_data: {
    from:     string;
    to:       string;
    quantity: string; // 10.0000 UOS - not a number, it is a number + symbol
    memo:     string;
  }
}

interface ITraceActionVoteForBPs extends ITraceAction {
  act_data: {
    voter:      string;
    proxy:      string;
    producers:  string[];
  }
}

interface ITraceActionVoteForCalculators extends ITraceAction {
  act_data: {
    voter:        string;
    calculators:  string[];
  }
}

interface ITraceActionClaimEmission extends ITraceAction {
  act_data: {
    owner:          string;
  }
  inline_traces:  any;
}

interface ITraceActionBuyRam extends ITraceAction {
  act_data: {
    payer:    string,
    receiver: string,
    bytes:    number,
  }
  inline_traces:  ITraceAction[];
}

interface ITraceActionSellRam extends ITraceAction {
  act_data: {
    account:  string,
    bytes:    number,
  }
  inline_traces:  ITraceAction[];
}

interface ITraceActionDelegateBw extends ITraceAction {
  act_data: {
    from:               string,
    receiver:           string,
    stake_net_quantity: string, // example - '0.0000 UOS',
    stake_cpu_quantity: string, // example - '2.0000 UOS',
    transfer :          number,
  },
}

interface ITraceActionUndelegateBw extends ITraceAction {
  act_data: {
    from:                 string,
    receiver:             string,
    unstake_net_quantity: string, // example - '0.0000 UOS',
    unstake_cpu_quantity: string, // example - '2.0000 UOS',
    transfer:             number,
  },
}

export {
  ITraceActionDelegateBw,
  ITraceActionUndelegateBw,

  ITraceActionBuyRam,
  ITraceActionSellRam,

  IFromToMemo,
  IActNameToActionDataArray,
  ITraceAction,
  ITraceActionData,
  ITraceActionVoteForCalculators,
  ITraceActionVoteForBPs,
  ITraceActionTransferTokens,
  ITraceActionClaimEmission,
};
