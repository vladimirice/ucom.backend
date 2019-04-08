interface UsersActivityTrustModelDto {
  id:           number;
  user_id:      number;
  entity_id:    number;
  entity_name:  string;

  created_at:   any;
}

interface UsersActivityModelDto {
  id: number;

  activity_type_id: number;
  activity_group_id: number;

  blockchain_status: number;
  blockchain_response: string;

  entity_id_on: number | null;
  entity_id_to: number;
  entity_name: string;
  entity_name_on: number | null,

  event_id: number,
  user_id_from: number,
  signed_transaction: string,

  created_at: any;
  updated_at: any;
}

export {
  UsersActivityTrustModelDto,
  UsersActivityModelDto,
};
