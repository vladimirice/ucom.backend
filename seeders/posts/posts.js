const seeds = [
  {
    // id: 1
    post_type_id: 1,
    title: 'EOS core library update',
    description: 'We are happy to announce a new major version of our EOS core library. A several cool features are successfully implemented',
    current_vote: 50,
    current_rate: 0.5700,
    user_id: 1,
    leading_text: 'Special update for our EOS people',
    created_at: new Date(),
    updated_at: new Date(),
    blockchain_id: 'pstms1-yed143ojlcdq0dl',
    organization_id: 1,
    entity_images: {
      article_title: [
        {
          url: 'http://localhost:3000/upload/sample_filename_1.jpg',
        },
      ],
    },
    entity_id_for: 1,
    entity_name_for: 'org       ',
  },
  {
    // id: 2
    post_type_id: 1,
    title: 'ETH version 2.0 beta testing is in live!',
    description: 'We are very exited to announce a ETH 2.0 beta release. Everybody can participate and gain bonus tokens',
    current_vote: 73,
    current_rate: 0.8450,
    user_id: 1,
    leading_text: 'ETH is nod dead. ETH is cool',
    created_at: new Date(),
    updated_at: new Date(),
    blockchain_id: 'pstms2-yed14jljlcgmepl',
    organization_id: 1,
    entity_images: {
      article_title: [
        {
          url: 'http://localhost:3000/upload/sample_filename_2.jpg',
        },
      ],
    },
    entity_id_for: 1,
    entity_name_for: 'org       ',
  },
  {
    // id: 3
    post_type_id: 1,
    title: 'Secret BTC trading strategy',
    description: 'Yesterday I found out, that plots candles can show us an interesting insight about when to come in to BTC',
    current_vote: 120,
    current_rate: 0.11450,
    user_id: 2,
    leading_text: 'Hey. Here is a cool announcement. Please read quickly and be the first.',
    created_at: new Date(),
    updated_at: new Date(),
    blockchain_id: 'pstms3-yed14jsjlcgnnwk',
    entity_images: {
      article_title: [
        {
          url: 'http://localhost:3000/upload/sample_filename_3.jpg',
        },
      ],
    },
    entity_id_for: 2,
    entity_name_for: 'users     ',
  },
  {
    // id: 4
    post_type_id: 1,
    title: 'Marketing strategies is completely changed',
    description: 'Marketing cryptocurrency strategies are very different than traditional ones because blockchain is all about publicity',
    current_vote: 87,
    current_rate: 0.9860,
    user_id: 2,
    leading_text: 'Marketing is a core instrument to develop the product.',
    created_at: new Date(),
    updated_at: new Date(),
    blockchain_id: 'pstms4-yed14jwjlcgnv3p',
    entity_images: {
      article_title: [
        {
          url: 'http://localhost:3000/upload/sample_filename_4.jpg',
        },
      ],
    },
    entity_id_for: 2,
    entity_name_for: 'users     ',
  },
  {
    // id: 5
    post_type_id: 2,
    title: 'Out very special offer for UOS token holders',
    description: 'Only during this week you can receive extra tokens for our bounty program',
    current_vote: 0,
    current_rate: 0,
    user_id: 1,
    leading_text: 'Our cool offer is here',
    created_at: new Date(),
    updated_at: new Date(),
    blockchain_id: 'pstos5-15uv8u4jlhp11i8',
    entity_images: {
      article_title: [
        {
          url: 'http://localhost:3000/upload/sample_filename_5.jpg',
        },
      ],
    },
    entity_id_for: 1,
    entity_name_for: 'users     ',
  },
];

module.exports = seeds;
