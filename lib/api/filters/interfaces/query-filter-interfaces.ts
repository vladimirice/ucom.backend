interface RequestQuery {
  readonly sort_by:   string;

  readonly page:      number;
  readonly per_page:  number;
  readonly last_id:   string;
}

export {
  RequestQuery,
};
