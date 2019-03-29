interface MyselfDataDto {
  myselfVote?: string;
  join?: boolean;
  organization_member?: boolean;
  repost_available?: boolean;

  follow?: boolean;
  myFollower?: boolean;
  trust?: boolean;

  editable?: boolean;
  member?:   boolean;
}

export {
  MyselfDataDto,
};
