import RequestHelper = require('./request-helper');
import ResponseHelper = require('./response-helper');

const request = require('supertest');

const server  = RequestHelper.getApiApplication();

const apiV1Prefix: string = RequestHelper.getApiV1Prefix();

const statsUrl = `${apiV1Prefix}/stats/total`;

class StatsRequestHelper {
  public static async getStatsTotal(): Promise<any> {
    const url = this.getStatsUrl();

    const res = await request(server).get(url);

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  private static getStatsUrl(): string {
    return statsUrl;
  }
}

export = StatsRequestHelper;
