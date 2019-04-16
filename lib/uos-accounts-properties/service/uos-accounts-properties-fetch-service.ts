import { UosAccountsResponseDto } from '../interfaces/model-interfaces';

class UosAccountsPropertiesFetchService {
  public static async getData(
    // @ts-ignore
    lowerBound: number,
    // @ts-ignore
    limit: number,
  ): Promise<UosAccountsResponseDto> {
    // @ts-ignore

    // TODO check if accounts are persist - check root interface
    return [];
  }
}

export = UosAccountsPropertiesFetchService;
