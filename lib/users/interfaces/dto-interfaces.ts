interface ActivityWithContentEntity {
  readonly description: string;
  readonly entity_id:        number;
  readonly entity_name:      string;
  readonly user_id_from:     number;
  readonly org_id:           number | null;
}

export {
  ActivityWithContentEntity,
};
