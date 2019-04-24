interface StatsEventsOptions {
  readonly posts?: {
    importance:     boolean,
    upvotes:        boolean,
    activityIndex:  boolean,
  };
}

interface ObjectInterfaceRulesDto {
  [index: string]: {
    readonly type: string;
    readonly length: number;
    readonly value?: any;
    readonly allowed_values?: any[];
  }
}

interface CheckManyObjectsOptionsDto {
  readonly exactKeysAmount: boolean;
  readonly keyIs?: string;
}

export {
  StatsEventsOptions,
  ObjectInterfaceRulesDto,
  CheckManyObjectsOptionsDto,
};
