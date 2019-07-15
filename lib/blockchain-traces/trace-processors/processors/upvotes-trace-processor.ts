/* eslint-disable class-methods-use-this */
import { StringToAnyCollection } from '../../../common/interfaces/common-types';
import {
  IActNameToActionDataArray,
  IFromToMemo, ITraceActionUpvoteContent,
} from '../../interfaces/blockchain-actions-interfaces';

import AbstractTracesProcessor = require('../abstract-traces-processor');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');

const actName = 'usertocont';

class UpvotesTraceProcessor extends AbstractTracesProcessor {
  readonly traceType: number = BlockchainTrTraces.getTypeUpvoteContent();

  readonly expectedActionsData = {
    [actName]: {
      validationSchema: {
        acc:                  joi.string().required().min(1).max(12),
        content_id:           joi.string().required(),
        interaction_type_id:  joi.number().required().allow(2),
      },

      minNumberOfActions: 1,
      maxNumberOfActions: 1,
    },
  };

  getFromToAndMemo(actNameToActionDataArray: IActNameToActionDataArray): IFromToMemo {
    const actionData = <ITraceActionUpvoteContent>actNameToActionDataArray[actName][0];

    return {
      from: actionData.act_data.acc,
      memo: '',
      to: null,
    };
  }

  getTraceThumbnail(actNameToActionDataArray: IActNameToActionDataArray): StringToAnyCollection {
    const actionData = <ITraceActionUpvoteContent>actNameToActionDataArray[actName][0];

    return {
      content_id: actionData.act_data.content_id,
      interaction_type_id: actionData.act_data.interaction_type_id,
    };
  }
}

export = UpvotesTraceProcessor;
