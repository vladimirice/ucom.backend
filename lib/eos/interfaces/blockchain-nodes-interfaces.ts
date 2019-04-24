import { InputQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';

interface RequestQueryBlockchainNodes extends InputQueryDto {
  readonly filters: {
    readonly myself_votes_only: boolean;
    readonly blockchain_nodes_type: number;
    readonly user_id: number;
    readonly search: string;
    deleted_at?: boolean;
  }
}

export {
  RequestQueryBlockchainNodes,
};
