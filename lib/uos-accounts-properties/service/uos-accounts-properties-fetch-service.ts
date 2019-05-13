import { UosAccountsResponseDto } from '../interfaces/model-interfaces';

const { UosAccountsPropertiesApi } = require('ucom-libs-wallet');

class UosAccountsPropertiesFetchService {
  public static async getData(
    lowerBound: number,
    limit: number,
  ): Promise<UosAccountsResponseDto> {
    return UosAccountsPropertiesApi.getAccountsTableRows(lowerBound, limit);
  }
}

export = UosAccountsPropertiesFetchService;
