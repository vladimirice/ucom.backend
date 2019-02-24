const seeds = [{
  source_url: 'https://www.facebook.com/BillGates/',
  is_official: false,
  source_type_id: 1,
  user_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
}, {
  source_url: 'https://medium.com/bill-melinda-gates-foundation',
  is_official: true,
  source_type_id: 3,
  user_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
}, {
  source_url: 'https://www.facebook.com/stevejobsfilm/',
  is_official: true,
  source_type_id: 1,
  user_id: 2,
  created_at: new Date(),
  updated_at: new Date(),
}, {
  source_url: 'https://twitter.com/SJobsLegend',
  is_official: false,
  source_type_id: 4,
  user_id: 2,
  created_at: new Date(),
  updated_at: new Date(),
},
];

module.exports = seeds;
