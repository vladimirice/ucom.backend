import { Transaction } from 'knex';
import { ConversionToProcessDto } from '../interfaces/dto-interfaces';
import { UserModel } from '../../users/interfaces/model-interfaces';

import ConversionsModel = require('../models/conversions-model');
import knex = require('../../../config/knex');
import UsersModelProvider = require('../../users/users-model-provider');
import EosBlockchainStatusDictionary = require('../../eos/eos-blockchain-status-dictionary');
import ProcessStatusesDictionary = require('../../common/dictionary/process-statuses-dictionary');
import StreamsModel = require('../models/streams-model');
import NumbersHelper = require('../../common/helper/numbers-helper');
import OffersModel = require('../models/offers-model');

class ConversionsRepository {
  public static async findSentToBlockchainToProcess(): Promise<ConversionToProcessDto[]> {
    const data = await knex(`${ConversionsModel.getTableName()} as t`)
      .select([
        't.id AS conversion_id',
        't.user_id AS referral_user_id',
        's.user_id AS source_user_id',
      ])
      .innerJoin(`${StreamsModel.getTableName()} AS s`, 's.id', 't.stream_id')
      // eslint-disable-next-line func-names
      .innerJoin(`${UsersModelProvider.getUsersActivityTableName()} AS a`, function () {
        this.on('a.id', '=', 't.users_activity_id')
          .andOn('a.blockchain_status', '=', EosBlockchainStatusDictionary.getStatusIsSent())
          .andOn('t.status', '=', ProcessStatusesDictionary.new());
      });

    for (const item of data) {
      item.conversion_id = NumbersHelper.processFieldToBeNumeric(item.conversion_id, 'conversion_id');
    }

    return data;
  }

  public static async setStatusSuccessById(conversionId: number, transaction: Transaction): Promise<void> {
    await transaction(ConversionsModel.getTableName())
      .update({
        status: ProcessStatusesDictionary.success(),
      })
      .where({
        id: conversionId,
      });
  }

  public static async setStatusDuplicateById(conversionId: number): Promise<void> {
    await knex(ConversionsModel.getTableName())
      .update({
        status: ProcessStatusesDictionary.duplicate(),
      })
      .where({
        id: conversionId,
      });
  }

  public static async findSourceUserIdBySuccessUserConversion(
    offer: OffersModel,
    referralUser: UserModel,
  ): Promise<number> {
    const data = await knex(`${StreamsModel.getTableName()} as t`)
      .select('t.user_id as source_user_id')
      // eslint-disable-next-line func-names
      .innerJoin(`${ConversionsModel.getTableName()} as c`, function () {
        this.on('c.stream_id', '=', 't.id')
          .andOn('c.offer_id', '=', offer.id)
          .andOn('c.user_id', '=', referralUser.id)
          .andOn('c.status', '=', ProcessStatusesDictionary.success());
      })
      .first();

    return data ? data.source_user_id : null;
  }
}

export = ConversionsRepository;
