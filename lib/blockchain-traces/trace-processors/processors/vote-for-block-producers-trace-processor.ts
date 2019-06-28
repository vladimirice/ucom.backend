/* eslint-disable class-methods-use-this */
import { injectable } from 'inversify';

import 'reflect-metadata';
import { ITraceActionData } from '../../interfaces/blockchain-actions-interfaces';

import AbstractTracesProcessor = require('./../abstract-traces-processor');

const joi = require('joi');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

@injectable()
class VoteForBlockProducersTraceProcessor extends AbstractTracesProcessor {
  readonly serviceName      = 'vote-for-block-producers';

  readonly traceType        = BlockchainTrTraces.getTypeVoteForBp();

  readonly expectedActName  = 'voteproducer';

  readonly expectedActionsLength  = 1;

  readonly actionDataSchema = {
    voter:      joi.string().required().min(1).max(12),
    proxy:      joi.string().empty(''),
    producers:  joi.array().items(joi.string()),
  };

  getFromToAndMemo(actionData: ITraceActionData): { from: string, to: string | null, memo: string } {
    return {
      from: actionData.voter,
      to: null,
      memo: '',
    };
  }

  getTraceThumbnail(actionData: ITraceActionData) {
    return {
      producers: actionData.producers,
    };
  }
}

export = VoteForBlockProducersTraceProcessor;
