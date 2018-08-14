const usersSeeds = [{
    id: 1,
    account_name: 'admin_account_name',
    nickname: 'admin_nickname',
    first_name: 'admin_first_name',
    last_name: 'admin_last_name',
    email: 'admin@example.com',
    phone_number: '+79161234567',
    birthday: new Date(1980, 1, 12),
    about: 'All about admin life',
    country: 'Russia',
    city: 'Moscow',
    address: 'Tverskaya, 1',
    mood_message: 'Always positive',
    created_at: new Date(),
    updated_at: new Date()
  }, {
    id: 2,
    account_name: 'foo_account_name',
    nickname: 'foo_nickname',
    first_name: 'foo_first_name',
    last_name: 'foo_last_name',
    email: 'foo@example.com',
    phone_number: '+19161234567',
    birthday: new Date(1975, 3, 20),
    about: 'All about foo life',
    country: 'US',
    city: 'LA',
    address: 'LA street, 12',
    mood_message: 'Sunny LA',
    created_at: new Date(),
    updated_at: new Date()
  }, {
    id: 3,
    account_name: 'bar_account_name',
    nickname: 'bar_nickname',
    first_name: 'bar_first_name',
    last_name: 'bar_last_name',
    email: 'bar@example.com',
    phone_number: '+19981234599',
    birthday: new Date(1987, 4, 5),
    about: 'All about bar life',
    country: 'US',
    city: 'NY',
    address: 'NY street, 3',
    mood_message: 'The weather is sunny',
    created_at: new Date(),
    updated_at: new Date()
  },
];

module.exports = usersSeeds;


