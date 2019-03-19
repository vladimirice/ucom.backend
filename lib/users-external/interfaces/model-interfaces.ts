interface UserExternalModel {
  readonly id: number;

  readonly external_type_id: number;
  readonly external_id: number;
  readonly external_login: string;
  readonly user_id: number;

  readonly json_value: any;

  readonly created_at: any;
  readonly updated_at: any;
}

export {
  UserExternalModel,
};
