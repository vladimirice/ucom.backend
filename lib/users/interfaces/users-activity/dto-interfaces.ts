interface IActivityModel {
  id: number;
}

interface ActivityConditionsDto {
  activity_type_id:   number;
  activity_group_id:  number;
  event_id:           number;
}

export {
  IActivityModel,
  ActivityConditionsDto,
};
