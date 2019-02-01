import { MyselfDataDto } from '../../common/interfaces/post-processing-dto';
import { ListResponse } from '../../common/interfaces/lists-interfaces';

interface OrgModel {
  readonly id: number;
  readonly current_vote: number;

  [index: string]: any;
}

interface OrgIdToOrgModelCard {
  [index: number]: OrgModelCard;
}

interface OrgModelCard {
  [index: string]: any;
}

interface OrgListResponse extends ListResponse {
  data: OrgModelResponse[];
}

interface OrgModelResponse extends OrgModel {
  [index: string]: any;
}

interface OrgModelMyselfResponse extends OrgModelResponse {
  myselfData: MyselfDataDto,
}

export {
  OrgModel,
  OrgListResponse,
  OrgModelResponse,
  OrgModelMyselfResponse,
  OrgModelCard,
  OrgIdToOrgModelCard,
};
