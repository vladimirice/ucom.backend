import { AppError } from '../../api/errors';

const SOURCE_GROUP__SOCIAL_NETWORKS = 1;
const SOURCE_GROUP__COMMUNITY       = 2;
const SOURCE_GROUP__PARTNERSHIP     = 3;

const SOURCE_TYPE__INTERNAL = 'internal';
const SOURCE_TYPE__EXTERNAL = 'external';

class EntitySourcesDictionary {
  public static sourceGroupToStringKeySet() {
    return {
      [this.socialNetworksGroup()]: 'social_networks',
      [this.communityGroup()]:      'community_sources',
      [this.partnershipGroup()]:    'partnership_sources',
    };
  }

  public static socialNetworksGroup(): number {
    return SOURCE_GROUP__SOCIAL_NETWORKS;
  }

  public static communityGroup(): number {
    return SOURCE_GROUP__COMMUNITY;
  }

  public static partnershipGroup(): number {
    return SOURCE_GROUP__PARTNERSHIP;
  }

  public static internalType(): string {
    return SOURCE_TYPE__INTERNAL;
  }

  public static externalType(): string {
    return SOURCE_TYPE__EXTERNAL;
  }

  public static sourceGroupIdToStringKey(groupId: number): string {
    const result = this.sourceGroupToStringKeySet()[groupId];

    if (!result) {
      throw new AppError(`Unsupported groupId: ${groupId}`);
    }

    return result;
  }
}

export = EntitySourcesDictionary;
