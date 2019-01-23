import { StringToAnyCollection } from './common-types';

interface ListMetadata {
  readonly page: number;
  readonly per_page: number;
  readonly total_amount: number;
  readonly has_more: boolean;
}

interface ListResponse {
  data: StringToAnyCollection,
  metadata: ListMetadata,
}

export {
  ListResponse,
  ListMetadata,
};
