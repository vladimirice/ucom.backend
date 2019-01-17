interface MyselfDataDto {
  myselfVote?: string;
  join?: boolean;
  organization_member?: boolean;
  repost_available?: boolean;

  follow?: boolean;
  myFollower?: boolean;

  editable?: boolean;
  member?:   boolean;
}

export {
  MyselfDataDto,
};
