/* eslint-disable class-methods-use-this */
import { injectable } from 'inversify';

import 'reflect-metadata';
import {
  IActNameToActionDataArray,
  IFromToMemo,
  ITraceActionVoteForBPs,
} from '../../interfaces/blockchain-actions-interfaces';

import AbstractTracesProcessor = require('./../abstract-traces-processor');

const joi = require('joi');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

@injectable()
class VoteForBlockProducersTraceProcessor extends AbstractTracesProcessor {
  readonly traceType        = BlockchainTrTraces.getTypeVoteForBp();

  readonly expectedActionsData = {
    voteproducer: {
      validationSchema: {
        voter:      joi.string().required().min(1).max(12),
        proxy:      joi.string().empty(''),
        producers:  joi.array().items(joi.string()),
      },
      minNumberOfActions: 1,
      maxNumberOfActions: 1,
    },
  };

  getFromToAndMemo(actNameToActionDataArray: IActNameToActionDataArray): IFromToMemo {
    const actionData = <ITraceActionVoteForBPs>actNameToActionDataArray.voteproducer[0];

    return {
      from: actionData.act_data.voter,
      to:   null,
      memo: '',
    };
  }

  getTraceThumbnail(actNameToActionDataArray: IActNameToActionDataArray) {
    const actionData = <ITraceActionVoteForBPs>actNameToActionDataArray.voteproducer[0];

    return {
      producers: actionData.act_data.producers,
    };
  }
}

export = VoteForBlockProducersTraceProcessor;
