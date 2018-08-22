const moment = require('moment');
const DATE_FORMAT = 'YYYY-MM-DD';

const usersEducation = [{
  id: 1,
  title: 'Lomonosov Moscow State University',
  speciality: 'IT security',
  degree: 'Bachelor',
  start_date: moment('2000-09-01', DATE_FORMAT).format(DATE_FORMAT),
  end_date: moment('2005-06-15', DATE_FORMAT).format(DATE_FORMAT),
  is_current: false,
  user_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
}, {
  id: 2,
  title: 'Moscow Technological Institute',
  speciality: 'Business management',
  degree: 'MBA',
  start_date: moment('2005-10-02', DATE_FORMAT).format(DATE_FORMAT),
  end_date: moment('2008-05-23', DATE_FORMAT).format(DATE_FORMAT),
  is_current: false,
  user_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
}, {
  id: 3,
  title: 'Stanbridge University',
  speciality: 'Management of organizations',
  degree: 'Bachelor',
  start_date: moment('1995-09-03', DATE_FORMAT).format(DATE_FORMAT),
  end_date: moment('2001-08-04', DATE_FORMAT).format(DATE_FORMAT),
  is_current: false,
  user_id: 2,
  created_at: new Date(),
  updated_at: new Date(),
},
];

module.exports = usersEducation;
