const moment = require('moment');
const DATE_FORMAT = 'YYYY-MM-DD';

const usersJobs = [{
  id: 1,
  title: 'Moscow business IT solutions',
  position: 'Technical support',
  start_date: moment('2009-03-17', DATE_FORMAT).format(DATE_FORMAT),
  end_date: moment('20012-02-14', DATE_FORMAT).format(DATE_FORMAT),
  is_current: false,
  user_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
}, {
  id: 2,
  title: 'Integrated IT holding',
  position: 'Blockchain developer',
  start_date: moment('2012-03-10', DATE_FORMAT).format(DATE_FORMAT),
  end_date: null,
  is_current: true,
  user_id: 1,
  created_at: new Date(),
  updated_at: new Date(),
}, {
  id: 3,
  title: 'United blockchain campaign of USA',
  position: 'CEO',
  start_date: moment('2010-02-03', DATE_FORMAT).format(DATE_FORMAT),
  end_date: null,
  is_current: true,
  user_id: 2,
  created_at: new Date(),
  updated_at: new Date(),
},
];

module.exports = usersJobs;
