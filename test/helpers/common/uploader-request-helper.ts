const supertest = require('supertest');
const { app:server } = require('../../../lib/uploader/uploader-application');

const apiV1Prefix = '/api/v1';

class UploaderRequestHelper {
  public static getRequestObjForPost(url: string) {
    return this.getRequestObj()
      .post(url);
  }

  public static async makeGetRequest(url: string): Promise<any> {
    return this.getRequestObj()
      .get(url);
  }

  public static getApiV1Prefix(): string {
    return apiV1Prefix;
  }

  private static getRequestObj() {
    return supertest(server);
  }
}

export = UploaderRequestHelper;
