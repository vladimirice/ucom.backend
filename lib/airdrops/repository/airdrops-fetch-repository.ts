import AirdropsModelProvider = require('../service/airdrops-model-provider');
import knex = require('../../../config/knex');
import AccountsModelProvider = require('../../accounts/service/accounts-model-provider');

class AirdropsFetchRepository {
  public static async getAirdropStateByPostId(
    postId: number,
  ) {
    const airdrops = AirdropsModelProvider.airdropsTableName();

    const where = {
      [`${airdrops}.post_id`]: postId,
    };

    return this.getAirdropStateByTokensWhere(where);
  }

  public static async getAirdropStateById(
    id: number,
  ) {
    const airdrops = AirdropsModelProvider.airdropsTableName();

    const where = {
      [`${airdrops}.id`]: id,
    };

    return this.getAirdropStateByTokensWhere(where);
  }

  public static async getAirdropByPk(
    id: number,
  ) {
    const where = {
      id,
    };

    return knex(AirdropsModelProvider.airdropsTableName())
      .where(where)
      .first();
  }

  private static async getAirdropStateByTokensWhere(
    where: any,
  ) {
    const t = AirdropsModelProvider.airdropsTokensTableName();

    const airdrops = AirdropsModelProvider.airdropsTableName();
    const accounts = AccountsModelProvider.accountsTableName();
    const symbols = AccountsModelProvider.accountsSymbolsTableName();

    const res = await knex(t)
      .select([
        knex.raw('ABS(income.current_balance) AS amount_claim'),
        'debt.current_balance AS amount_left',
        `${symbols}.title AS symbol`,
        `${symbols}.precision AS precision`,
        `${airdrops}.id as airdrop_id`,
        `${airdrops}.started_at as started_at`,
        `${airdrops}.finished_at as finished_at`,
      ])
      .where(where)
      .innerJoin(`${airdrops}`, `${t}.airdrop_id`, `${airdrops}.id`)
      .innerJoin(`${accounts} AS income`, `${t}.income_account_id`, 'income.id')
      .innerJoin(`${accounts} AS debt`, `${t}.debt_account_id`, 'debt.id')
      .innerJoin(`${symbols}`, 'income.symbol_id', `${symbols}.id`);

    const tokens = res.map(item => ({
      amount_claim: +item.amount_claim,
      amount_left: +item.amount_left,
      symbol: item.symbol,
      precision: item.precision,
    }));

    return {
      tokens,

      airdropId: +res[0].airdrop_id,
      startedAt: res[0].started_at,
      finishedAt: res[0].finished_at,
    };
  }
}

export = AirdropsFetchRepository;
