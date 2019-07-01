"use strict";
// /* eslint-disable class-methods-use-this */
// import { StringToAnyCollection } from '../../../common/interfaces/common-types';
// import { ITraceActionData } from '../../interfaces/blockchain-actions-interfaces';
// import { ITrace } from '../../interfaces/blockchain-traces-interfaces';
//
// import AbstractTracesProcessor = require('../abstract-traces-processor');
//
// const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;
// const joi = require('joi');
//
// class StakeResourcesOnlyProcessor extends AbstractTracesProcessor {
//   /*
//     act_data : {
//       from : actor.account_name,
//       receiver : actor.account_name,
//       stake_net_quantity : '0.0000 UOS',
//       stake_cpu_quantity : '2.0000 UOS',
//       transfer : 0,
//     },
//   */
//
//   readonly actionDataSchema: StringToAnyCollection = {
//     from: joi.string(),
//   };
//
//   readonly expectedActName: string = 'delegatebw123';
//
//   readonly expectedActionsLength: number = 1; // TODO one or two
//
//   readonly serviceName = 'stake-resources-only';
//
//   readonly traceType: number = BlockchainTrTraces.getTypeStakeResources();
//
//   // @ts-ignore
//   getFromToAndMemo(actionData: ITraceActionData): { from: string; to: string | null; memo: string } {
//     return {
//       from: actionData.from,
//       memo: '',
//       to: null,
//     };
//   }
//
//   // @ts-ignore
//   getTraceThumbnail(actionData: ITraceActionData, trace: ITrace): StringToAnyCollection {
//     return {};
//   }
// }
//
// export = StakeResourcesOnlyProcessor;
