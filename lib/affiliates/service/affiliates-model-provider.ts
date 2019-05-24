const SCHEMA_NAME = 'affiliates';

const OFFERS_TABLE_NAME       = `${SCHEMA_NAME}.offers`;
const STREAMS_TABLE_NAME      = `${SCHEMA_NAME}.streams`;
const CLICKS_TABLE_NAME       = `${SCHEMA_NAME}.clicks`;
const CONVERSIONS_TABLE_NAME  = `${SCHEMA_NAME}.conversions`;

class AffiliatesModelProvider {
  public static getSchemaName(): string {
    return SCHEMA_NAME;
  }

  public static getOffersTableName(): string {
    return OFFERS_TABLE_NAME;
  }

  public static getStreamsTableName(): string {
    return STREAMS_TABLE_NAME;
  }

  public static getClicksTableName(): string {
    return CLICKS_TABLE_NAME;
  }
  public static getConversionsTableName(): string {
    return CONVERSIONS_TABLE_NAME;
  }
}

export = AffiliatesModelProvider;
