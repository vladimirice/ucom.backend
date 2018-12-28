interface PostWithTagCurrentRateDto {
  readonly current_rate: number;
  readonly entity_tags: string[];
}

interface StringToNumObj {
  [index: string]: number;
}

interface TagToRate {
  title: string;
  ratePerPost: number;
  postsAmount: number;
  currentRate: number;
}

interface DbTag {
  readonly id: number;
  readonly title: string;
  readonly current_rate: number;
  readonly created_at: string;
}

export {
  PostWithTagCurrentRateDto,
  StringToNumObj,
  DbTag,
  TagToRate,
};
