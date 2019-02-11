interface EntityEventParamDto {
  entity_id:            number;
  entity_name:          string;
  entity_blockchain_id: string;
  event_type:           number;
  event_group:          number;
  event_super_group:    number;
  json_value:           JsonValue;
}

interface JsonValue {
  readonly formula?: {
    description: string,
  },
  readonly worker_recalc_period: string  // (one hour for ex.)
  readonly description: string; // for humans
  readonly data: any
}

export {
  EntityEventParamDto,
  JsonValue,
};
