import { ListResponse } from '../../common/interfaces/lists-interfaces';
import { RequestQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';
import {
  UosAccountPropertiesValuesDto,
} from '../../uos-accounts-properties/interfaces/model-interfaces';
import { ModelWithEntityImages } from '../../entity-images/interfaces/model-interfaces';

interface UserModel extends ModelWithEntityImages {
  readonly id: number;
  readonly account_name: string;

  readonly uos_accounts_properties?: UosAccountPropertiesValuesDto

  readonly social_public_key: string;

  [index: string]: any
}

interface UserModelTests extends UserModel {
  social_private_key: string;
}

interface UserModelCard extends ModelWithEntityImages {
  readonly id: number;
  readonly account_name: string;

  [index: string]: string | number,
}

interface UsersListResponse extends ListResponse {
  data: UserModelResponse[];
}

interface UserModelResponse extends UserModel {
  [index: string]: any;
}


interface UserIdToUserModelCard {
  [index: number]: UserModelCard;
}

interface UsersRequestQueryDto extends RequestQueryDto {
  readonly airdrops?: {
    readonly id: number;
  }
}

interface UsersActivityQueryDto extends UsersRequestQueryDto {
  readonly activity: string;
}

interface OneContentActivityUsersQueryDto extends RequestQueryDto {
 readonly entity_id: number;
 readonly entity_name: string;
 readonly interaction_type?: number;
}

interface OrganizationsActivityQueryDto extends RequestQueryDto {
  readonly organization_identity: string;
  readonly activity:              string;
}

export {
  UserModelCard,
  UserModel,
  UserModelTests,

  UserIdToUserModelCard,
  UsersListResponse,
  UsersRequestQueryDto,
  UsersActivityQueryDto,

  OrganizationsActivityQueryDto,
  OneContentActivityUsersQueryDto,
};
