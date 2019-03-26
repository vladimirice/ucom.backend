interface IdsFromTokensDto {
  readonly currentUserId: number | null;
  readonly usersExternalId: number | null;
}

interface CurrentUserDataDto {
  currentUser:  currentUserDataDto | null;
  userExternal: userExternalDataDto | null;
}

interface currentUserDataDto {
  id: number;
}

interface userExternalDataDto {
  id: number;
  external_id: number;
}

export  {
  IdsFromTokensDto,
  CurrentUserDataDto,

  currentUserDataDto,
  userExternalDataDto,
};
