import { InputQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';

interface RequestQueryBlockchainNodes extends InputQueryDto {
  readonly filters: {
    readonly myself_votes_only: boolean;
    readonly blockchain_nodes_type: number;
    readonly user_id: number;
    readonly title_like?: string;
    readonly deleted_at: boolean;
  }
}

interface VotersToProcessDto {
  [index: number]: {
    readonly user_id: number;
    readonly nodes: number[];
    old_nodes: number[];
  }
}

export {
  VotersToProcessDto,
  RequestQueryBlockchainNodes,
};
