interface UserModel {
  readonly id: number;

  [index: string]: string | number,
}

interface UserModelCard {
  readonly id: number;

  [index: string]: string | number,
}

interface UserIdToUserModelCard {
  [index: number]: UserModelCard;
}

export {
  UserModelCard,
  UserModel,
  UserIdToUserModelCard,
};
