import { AirdropsReceiptTableRowsDto } from '../../interfaces/dto-interfaces';

const { BackendApi } = require('ucom-libs-wallet');

class AirdropsFetchTableRowsService {
  public static async getAirdropsReceiptTableRowsAfterExternalId(
    externalId: number,
  ): Promise<AirdropsReceiptTableRowsDto[]> {
    return BackendApi.getAirdropsReceiptTableRowsAfterExternalId(externalId);
  }
}

export = AirdropsFetchTableRowsService;
