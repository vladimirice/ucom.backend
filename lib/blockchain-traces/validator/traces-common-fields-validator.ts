/* eslint-disable newline-per-chained-call */
import { injectable } from 'inversify';
import 'reflect-metadata';
import { ITrace } from '../interfaces/blockchain-traces-interfaces';

const joi = require('joi');

@injectable()
class TracesCommonFieldsValidator {
  private actionsSchema = {
    act_data:           joi.object().required(),
    inline_traces:      joi.array().required(),
    receipt:            joi.object().required(),
    account_ram_deltas: joi.array().required(),
    act:                joi.object().required(),

    trx_id:             joi.string().required().min(1),
    producer_block_id:  joi.string().required().min(1),
    block_num:          joi.number().required().min(1),
    block_time:         joi.string().required().min(1),
    console:            joi.string().empty(''),
    context_free:       joi.boolean().required(),
    elapsed:            joi.number().required().min(1),
  };

  private schema = {
    actions:      joi.array().required().min(1).items(joi.object(this.actionsSchema)),

    _id:          joi.object().required(),
    account:      joi.string().required().min(1).max(12),
    blockid:      joi.string().required().min(1),
    blocknum:     joi.number().required().min(1),
    blocktime:    joi.string().required().min(1),
    irreversible: joi.boolean().required().allow(true),
    trxid:        joi.string().required().min(1),
  };

  public validateOneTrace(trace: ITrace) {
    return joi.validate(trace, this.schema, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: false,
    });
  }
}

export  = TracesCommonFieldsValidator;
