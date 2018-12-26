interface TagCurrentRateDto {
  readonly current_rate: number;
  readonly entity_tags: string[];
}

interface StringToNumObj {
  [index: string]: number;
}

interface DbTag {
  readonly id: number;
  readonly title: string;
  readonly current_rate: number;
  readonly created_at: string;
}

export {
  TagCurrentRateDto,
  StringToNumObj,
  DbTag,
};
