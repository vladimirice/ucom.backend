const usersSeeds = [{
    id: 1,
    account_name: 'vlad',
    nickname: 'vlad',
    first_name: 'Vlad',
    last_name: 'Ivanov',
    email: 'vlad.ivanov@gmail.com',
    phone_number: '+79161234567',
    birthday: new Date(1980, 1, 12),
    about: 'I am blockchain developer',
    country: 'Russia',
    city: 'Moscow',
    address: 'Tverskaya, 1',
    mood_message: 'Be always positive',
    created_at: new Date(),
    updated_at: new Date()
  }, {
    id: 2,
    account_name: 'jane',
    nickname: 'jane',
    first_name: 'Jane',
    last_name: 'Ivanova',
    email: 'jane.ivanova@example.com',
    phone_number: '+19161234567',
    birthday: new Date(1975, 3, 20),
    about: 'I am a CEO of big blockchain company',
    country: 'US',
    city: 'LA',
    address: 'LA street, 12',
    mood_message: 'Everything is always ok',
    created_at: new Date(),
    updated_at: new Date()
  },
];

module.exports = usersSeeds;


