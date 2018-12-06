const request = require('supertest');
const server = require('../../../app');

const Req = require('./request-helper');
const Res = require('./response-helper');

const accountsData = require('../../../config/accounts-data');

const BlockchainService       = require('../../../lib/eos/service').Blockchain;
const BlockchainModelProvider = require('../../../lib/eos/service').ModelProvider;

const BlockchainNodesRepository = require('../../../lib/eos/repository').Main;
const { TransactionSender } = require('uos-app-transaction');

const { WalletApi } = require('uos-app-wallet');

const BlockchainTrTypesDictionary = require('uos-app-wallet').Dictionary.BlockchainTrTraces;

// TODO - move to WalletApiDictionary
const TR_TYPE__TRANSFER_FROM  = 10;
const TR_TYPE__TRANSFER_TO    = 11;
const TR_TYPE_STAKE_RESOURCES = 20;

const TR_TYPE_UNSTAKING_REQUEST = 30;
const TR_TYPE_VOTE_FOR_BP       = 40;
const TR_TYPE_CLAIM_EMISSION    = 50;

const TR_TYPE_BUY_RAM           = 60;
const TR_TYPE_SELL_RAM          = 61;

let accountName = 'vlad';
let privateKey = accountsData[accountName].activePk;

class BlockchainHelper {
  static getEthalonVladStakeTrTrace() {
    return [
      {
        "tr_type": 20,
        "tr_processed_data": {
          "resources": {
            "cpu": {
              "tokens": {
                "currency": "UOS",
                "self_delegated": 8
              }
            },
            "net": {
              "tokens": {
                "currency": "UOS",
                "self_delegated": 8
              }
            }
          }
        },
        "memo": "",
        "tr_id": "228465112ca1a3c0b773b5abe337bbf0ca8d2a1cf2a875c72c16b4cc12760d77",
        "external_id": "5c008492f24a510c2fcb3841",
        "account_name_from": "vlad",
        "account_name_to": "vlad",
        "raw_tr_data": {
          "id": "228465112ca1a3c0b773b5abe337bbf0ca8d2a1cf2a875c72c16b4cc12760d77",
          "_id": "5c008492f24a510c2fcb3841",
          "except": null,
          "elapsed": 5020,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 3649,
            "net_usage_words": 28
          },
          "createdAt": "2018-11-30T00:30:10.270Z",
          "net_usage": 224,
          "scheduled": false,
          "action_traces": [
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "transfer": 0,
                  "stake_cpu_quantity": "0.0000 UOS",
                  "stake_net_quantity": "8.0000 UOS"
                },
                "name": "delegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc803801000000000004554f5300000000000000000000000004554f530000000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "228465112ca1a3c0b773b5abe337bbf0ca8d2a1cf2a875c72c16b4cc12760d77",
              "console": "",
              "elapsed": 2830,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "781babd1388f7f4d7795d96aca7687472912e06286a1a0a4ae339336cca87c98",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1368
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 15401080,
                "global_sequence": 20929490
              },
              "cpu_usage": 0,
              "inline_traces": [
                {
                  "act": {
                    "data": {
                      "to": "eosio.stake",
                      "from": "vlad",
                      "memo": "stake bandwidth",
                      "quantity": "8.0000 UOS"
                    },
                    "name": "transfer",
                    "account": "eosio.token",
                    "hex_data": "0000000000904cdc0014341903ea3055803801000000000004554f53000000000f7374616b652062616e647769647468",
                    "authorization": [
                      {
                        "actor": "vlad",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "228465112ca1a3c0b773b5abe337bbf0ca8d2a1cf2a875c72c16b4cc12760d77",
                  "console": "",
                  "elapsed": 485,
                  "receipt": {
                    "receiver": "eosio.token",
                    "act_digest": "0528ea591ead8d50a02e685663671a6ac3052f3821a033cb7b65bfd645736238",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "vlad",
                        1369
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 765,
                    "global_sequence": 20929491
                  },
                  "cpu_usage": 0,
                  "inline_traces": [
                    {
                      "act": {
                        "data": {
                          "to": "eosio.stake",
                          "from": "vlad",
                          "memo": "stake bandwidth",
                          "quantity": "8.0000 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000904cdc0014341903ea3055803801000000000004554f53000000000f7374616b652062616e647769647468",
                        "authorization": [
                          {
                            "actor": "vlad",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "228465112ca1a3c0b773b5abe337bbf0ca8d2a1cf2a875c72c16b4cc12760d77",
                      "console": "",
                      "elapsed": 4,
                      "receipt": {
                        "receiver": "vlad",
                        "act_digest": "0528ea591ead8d50a02e685663671a6ac3052f3821a033cb7b65bfd645736238",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "vlad",
                            1370
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 17,
                        "global_sequence": 20929492
                      },
                      "cpu_usage": 0,
                      "inline_traces": [],
                      "total_cpu_usage": 0
                    },
                    {
                      "act": {
                        "data": {
                          "to": "eosio.stake",
                          "from": "vlad",
                          "memo": "stake bandwidth",
                          "quantity": "8.0000 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000904cdc0014341903ea3055803801000000000004554f53000000000f7374616b652062616e647769647468",
                        "authorization": [
                          {
                            "actor": "vlad",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "228465112ca1a3c0b773b5abe337bbf0ca8d2a1cf2a875c72c16b4cc12760d77",
                      "console": "",
                      "elapsed": 4,
                      "receipt": {
                        "receiver": "eosio.stake",
                        "act_digest": "0528ea591ead8d50a02e685663671a6ac3052f3821a033cb7b65bfd645736238",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "vlad",
                            1371
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 237,
                        "global_sequence": 20929493
                      },
                      "cpu_usage": 0,
                      "inline_traces": [],
                      "total_cpu_usage": 0
                    }
                  ],
                  "total_cpu_usage": 0
                }
              ],
              "total_cpu_usage": 0
            },
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "transfer": 0,
                  "stake_cpu_quantity": "8.0000 UOS",
                  "stake_net_quantity": "0.0000 UOS"
                },
                "name": "delegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc000000000000000004554f5300000000803801000000000004554f530000000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "228465112ca1a3c0b773b5abe337bbf0ca8d2a1cf2a875c72c16b4cc12760d77",
              "console": "",
              "elapsed": 1122,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "6ccb130dc56c20461b704f55e0438b95610a7bc055561472823f72a881e064f2",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1372
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 15401081,
                "global_sequence": 20929494
              },
              "cpu_usage": 0,
              "inline_traces": [
                {
                  "act": {
                    "data": {
                      "to": "eosio.stake",
                      "from": "vlad",
                      "memo": "stake bandwidth",
                      "quantity": "8.0000 UOS"
                    },
                    "name": "transfer",
                    "account": "eosio.token",
                    "hex_data": "0000000000904cdc0014341903ea3055803801000000000004554f53000000000f7374616b652062616e647769647468",
                    "authorization": [
                      {
                        "actor": "vlad",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "228465112ca1a3c0b773b5abe337bbf0ca8d2a1cf2a875c72c16b4cc12760d77",
                  "console": "",
                  "elapsed": 377,
                  "receipt": {
                    "receiver": "eosio.token",
                    "act_digest": "0528ea591ead8d50a02e685663671a6ac3052f3821a033cb7b65bfd645736238",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "vlad",
                        1373
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 766,
                    "global_sequence": 20929495
                  },
                  "cpu_usage": 0,
                  "inline_traces": [
                    {
                      "act": {
                        "data": {
                          "to": "eosio.stake",
                          "from": "vlad",
                          "memo": "stake bandwidth",
                          "quantity": "8.0000 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000904cdc0014341903ea3055803801000000000004554f53000000000f7374616b652062616e647769647468",
                        "authorization": [
                          {
                            "actor": "vlad",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "228465112ca1a3c0b773b5abe337bbf0ca8d2a1cf2a875c72c16b4cc12760d77",
                      "console": "",
                      "elapsed": 3,
                      "receipt": {
                        "receiver": "vlad",
                        "act_digest": "0528ea591ead8d50a02e685663671a6ac3052f3821a033cb7b65bfd645736238",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "vlad",
                            1374
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 18,
                        "global_sequence": 20929496
                      },
                      "cpu_usage": 0,
                      "inline_traces": [],
                      "total_cpu_usage": 0
                    },
                    {
                      "act": {
                        "data": {
                          "to": "eosio.stake",
                          "from": "vlad",
                          "memo": "stake bandwidth",
                          "quantity": "8.0000 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000904cdc0014341903ea3055803801000000000004554f53000000000f7374616b652062616e647769647468",
                        "authorization": [
                          {
                            "actor": "vlad",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "228465112ca1a3c0b773b5abe337bbf0ca8d2a1cf2a875c72c16b4cc12760d77",
                      "console": "",
                      "elapsed": 3,
                      "receipt": {
                        "receiver": "eosio.stake",
                        "act_digest": "0528ea591ead8d50a02e685663671a6ac3052f3821a033cb7b65bfd645736238",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "vlad",
                            1375
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 238,
                        "global_sequence": 20929497
                      },
                      "cpu_usage": 0,
                      "inline_traces": [],
                      "total_cpu_usage": 0
                    }
                  ],
                  "total_cpu_usage": 0
                }
              ],
              "total_cpu_usage": 0
            }
          ]
        },

        // skip timestamps
        // "tr_executed_at": "2018-11-30T00:30:10.000Z",
        // "mongodb_created_at": "2018-11-30T00:30:10.000Z",
        // "created_at": "2018-12-05T09:41:06.450Z",
        // "updated_at": "2018-12-05T09:41:06.450Z"
      },
      {
        // "id": "2",
        "tr_type": 20,
        "tr_processed_data": {
          "resources": {
            "cpu": {
              "tokens": {
                "currency": "UOS",
                "self_delegated": 80
              }
            },
            "net": {
              "tokens": {
                "currency": "UOS",
                "self_delegated": 80
              }
            }
          }
        },
        "memo": "",
        "tr_id": "f77f3e8c952839feb5d7ea03b48fa19f743698ce7e4db7a9d9945e030214001b",
        "external_id": "5c008492f24a510c2fcb38ce",
        "account_name_from": "vlad",
        "account_name_to": "vlad",
        "raw_tr_data": {
          "id": "f77f3e8c952839feb5d7ea03b48fa19f743698ce7e4db7a9d9945e030214001b",
          "_id": "5c008492f24a510c2fcb38ce",
          "except": null,
          "elapsed": 5359,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 3959,
            "net_usage_words": 28
          },
          "createdAt": "2018-11-30T00:30:10.340Z",
          "net_usage": 224,
          "scheduled": false,
          "action_traces": [
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "transfer": 0,
                  "stake_cpu_quantity": "0.0000 UOS",
                  "stake_net_quantity": "80.0000 UOS"
                },
                "name": "delegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc00350c000000000004554f5300000000000000000000000004554f530000000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "f77f3e8c952839feb5d7ea03b48fa19f743698ce7e4db7a9d9945e030214001b",
              "console": "",
              "elapsed": 1703,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "fb12ca5eaae6d606746c15b389d4d0afc744f281c6509d4774e390e35f197d92",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1376
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 15401148,
                "global_sequence": 20929564
              },
              "cpu_usage": 0,
              "inline_traces": [
                {
                  "act": {
                    "data": {
                      "to": "eosio.stake",
                      "from": "vlad",
                      "memo": "stake bandwidth",
                      "quantity": "80.0000 UOS"
                    },
                    "name": "transfer",
                    "account": "eosio.token",
                    "hex_data": "0000000000904cdc0014341903ea305500350c000000000004554f53000000000f7374616b652062616e647769647468",
                    "authorization": [
                      {
                        "actor": "vlad",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "f77f3e8c952839feb5d7ea03b48fa19f743698ce7e4db7a9d9945e030214001b",
                  "console": "",
                  "elapsed": 764,
                  "receipt": {
                    "receiver": "eosio.token",
                    "act_digest": "cd251f95285b7671a6b932cfb3aa36361906dabad1304cd46f0a9f95d903759a",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "vlad",
                        1377
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 767,
                    "global_sequence": 20929565
                  },
                  "cpu_usage": 0,
                  "inline_traces": [
                    {
                      "act": {
                        "data": {
                          "to": "eosio.stake",
                          "from": "vlad",
                          "memo": "stake bandwidth",
                          "quantity": "80.0000 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000904cdc0014341903ea305500350c000000000004554f53000000000f7374616b652062616e647769647468",
                        "authorization": [
                          {
                            "actor": "vlad",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "f77f3e8c952839feb5d7ea03b48fa19f743698ce7e4db7a9d9945e030214001b",
                      "console": "",
                      "elapsed": 6,
                      "receipt": {
                        "receiver": "vlad",
                        "act_digest": "cd251f95285b7671a6b932cfb3aa36361906dabad1304cd46f0a9f95d903759a",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "vlad",
                            1378
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 19,
                        "global_sequence": 20929566
                      },
                      "cpu_usage": 0,
                      "inline_traces": [],
                      "total_cpu_usage": 0
                    },
                    {
                      "act": {
                        "data": {
                          "to": "eosio.stake",
                          "from": "vlad",
                          "memo": "stake bandwidth",
                          "quantity": "80.0000 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000904cdc0014341903ea305500350c000000000004554f53000000000f7374616b652062616e647769647468",
                        "authorization": [
                          {
                            "actor": "vlad",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "f77f3e8c952839feb5d7ea03b48fa19f743698ce7e4db7a9d9945e030214001b",
                      "console": "",
                      "elapsed": 7,
                      "receipt": {
                        "receiver": "eosio.stake",
                        "act_digest": "cd251f95285b7671a6b932cfb3aa36361906dabad1304cd46f0a9f95d903759a",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "vlad",
                            1379
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 239,
                        "global_sequence": 20929567
                      },
                      "cpu_usage": 0,
                      "inline_traces": [],
                      "total_cpu_usage": 0
                    }
                  ],
                  "total_cpu_usage": 0
                }
              ],
              "total_cpu_usage": 0
            },
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "transfer": 0,
                  "stake_cpu_quantity": "80.0000 UOS",
                  "stake_net_quantity": "0.0000 UOS"
                },
                "name": "delegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc000000000000000004554f530000000000350c000000000004554f530000000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "f77f3e8c952839feb5d7ea03b48fa19f743698ce7e4db7a9d9945e030214001b",
              "console": "",
              "elapsed": 2003,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "5aafdc279de7e13e5a44743e1fd57c6c157ce2658c0a24f1c55cb94cf8d6f13d",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1380
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 15401149,
                "global_sequence": 20929568
              },
              "cpu_usage": 0,
              "inline_traces": [
                {
                  "act": {
                    "data": {
                      "to": "eosio.stake",
                      "from": "vlad",
                      "memo": "stake bandwidth",
                      "quantity": "80.0000 UOS"
                    },
                    "name": "transfer",
                    "account": "eosio.token",
                    "hex_data": "0000000000904cdc0014341903ea305500350c000000000004554f53000000000f7374616b652062616e647769647468",
                    "authorization": [
                      {
                        "actor": "vlad",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "f77f3e8c952839feb5d7ea03b48fa19f743698ce7e4db7a9d9945e030214001b",
                  "console": "",
                  "elapsed": 646,
                  "receipt": {
                    "receiver": "eosio.token",
                    "act_digest": "cd251f95285b7671a6b932cfb3aa36361906dabad1304cd46f0a9f95d903759a",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "vlad",
                        1381
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 768,
                    "global_sequence": 20929569
                  },
                  "cpu_usage": 0,
                  "inline_traces": [
                    {
                      "act": {
                        "data": {
                          "to": "eosio.stake",
                          "from": "vlad",
                          "memo": "stake bandwidth",
                          "quantity": "80.0000 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000904cdc0014341903ea305500350c000000000004554f53000000000f7374616b652062616e647769647468",
                        "authorization": [
                          {
                            "actor": "vlad",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "f77f3e8c952839feb5d7ea03b48fa19f743698ce7e4db7a9d9945e030214001b",
                      "console": "",
                      "elapsed": 5,
                      "receipt": {
                        "receiver": "vlad",
                        "act_digest": "cd251f95285b7671a6b932cfb3aa36361906dabad1304cd46f0a9f95d903759a",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "vlad",
                            1382
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 20,
                        "global_sequence": 20929570
                      },
                      "cpu_usage": 0,
                      "inline_traces": [],
                      "total_cpu_usage": 0
                    },
                    {
                      "act": {
                        "data": {
                          "to": "eosio.stake",
                          "from": "vlad",
                          "memo": "stake bandwidth",
                          "quantity": "80.0000 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000904cdc0014341903ea305500350c000000000004554f53000000000f7374616b652062616e647769647468",
                        "authorization": [
                          {
                            "actor": "vlad",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "f77f3e8c952839feb5d7ea03b48fa19f743698ce7e4db7a9d9945e030214001b",
                      "console": "",
                      "elapsed": 6,
                      "receipt": {
                        "receiver": "eosio.stake",
                        "act_digest": "cd251f95285b7671a6b932cfb3aa36361906dabad1304cd46f0a9f95d903759a",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "vlad",
                            1383
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 240,
                        "global_sequence": 20929571
                      },
                      "cpu_usage": 0,
                      "inline_traces": [],
                      "total_cpu_usage": 0
                    }
                  ],
                  "total_cpu_usage": 0
                }
              ],
              "total_cpu_usage": 0
            }
          ]
        },
        // "tr_executed_at": "2018-11-30T00:30:10.000Z",
        // "mongodb_created_at": "2018-11-30T00:30:10.000Z",
        // "created_at": "2018-12-05T10:33:30.746Z",
        // "updated_at": "2018-12-05T10:33:30.746Z"
      }
    ]
  }

  /**
   *
   * @return {string}
   */
  static getTesterAccountName() {
    return accountName;
  }
  /**
   *
   * @return {string}
   */
  static getTesterPrivateKey() {
    return privateKey;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {string} accountName
   * @param {string} privateKey
   * @return {Promise<void>}
   */
  static async rollbackAllUnstakingRequests(accountName, privateKey) {
    const state = await WalletApi.getAccountState(accountName);

    if (state.resources.net.unstaking_request.amount === 0 && state.resources.cpu.unstaking_request.amount === 0) {
      console.warn('nothing to rollback');

      return;
    }

    const net = state.resources.net.tokens.self_delegated + state.resources.net.unstaking_request.amount;
    const cpu = state.resources.cpu.tokens.self_delegated + state.resources.cpu.unstaking_request.amount;

    await TransactionSender.stakeOrUnstakeTokens(accountName, privateKey, net, cpu);

    const stateAfter = await WalletApi.getAccountInfo(accountName);

    expect(stateAfter.resources.net.unstaking_request.amount).toBe(0);
    expect(stateAfter.resources.cpu.unstaking_request.amount).toBe(0);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {string} accountName
   * @param {string} privateKey
   * @return {Promise<void>}
   */
  static async stakeSomethingIfNecessary(accountName, privateKey) {
    const accountState = await WalletApi.getAccountState(accountName);

    if (accountState.tokens.staked === 0) {
      await WalletApi.stakeOrUnstakeTokens(accountName, privateKey, 10, 10)
    }
  }

  /**
   *
   * @param {string} accountName
   * @param {string} privateKey
   * @return {Promise<Object>}
   */
  static resetVotingState(accountName, privateKey) {
    return WalletApi.voteForBlockProducers(accountName, privateKey, []);
  }

  static async mockGetBlockchainNodesWalletMethod(addToVote = {}, toDelete = true) {
    let {producerData:initialData, voters } = await WalletApi.getBlockchainNodes();

    voters = {
      ...voters,
      ...addToVote,
    };

    initialData.z_super_new1 = {
      title: 'z_super_new1',
      votes_count: 5,
      votes_amount: 100,
      currency: 'UOS',
      bp_status: 1,
    };

    initialData.z_super_new2 = {
      title: 'z_super_new2',
      votes_count: 5,
      votes_amount: 100,
      currency: 'UOS',
      bp_status: 1,
    };

    const created = [
      initialData.z_super_new1,
      initialData.z_super_new2
    ];

    // lets also change something
    const dataKeys = Object.keys(initialData);

    const deleted = [];
    if (toDelete) {
      deleted.push(dataKeys[0]);
    }

    const updated = [
      initialData[dataKeys[1]],
      initialData[dataKeys[2]],
    ];

    initialData[dataKeys[1]].votes_count = 10;
    initialData[dataKeys[1]].votes_amount = 250;

    initialData[dataKeys[2]].bp_status = 2;
    initialData[dataKeys[2]].votes_amount = 0;
    initialData[dataKeys[2]].votes_count = 0;

    deleted.forEach(index => {
      delete initialData[index];
    });

    WalletApi.getBlockchainNodes = async function () {
      return {
        voters,
        producerData: initialData,
      };
    };

    return {
      created,
      updated,
      deleted,
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {Promise<Object>}
   */
  static async getAllBlockchainNodes() {
    return BlockchainNodesRepository.findAllBlockchainNodes();
  }

  /**
   *
   * @return {Promise<void>}
   *
   */
  static async updateBlockchainNodes() {
    return await BlockchainService.updateBlockchainNodesByBlockchain();
  }

  /**
   * @return {Promise<Object>}
   *
   * @link BlockchainService#getAndProcessNodes
   */
  static async requestToGetNodesList(myself = null, withMyselfBpVote = false, expectedStatus = 200, searchString = '', allowEmpty = false) {
    const queryString = withMyselfBpVote ? '?myself_bp_vote=true' : '';
    let url = Req.getBlockchainNodesListUrl() + queryString + searchString;

    const req = request(server)
      .get(url)
    ;

    if (myself) {
      Req.addAuthToken(req, myself);
    }

    const res = await req;

    Res.expectStatusToBe(res, expectedStatus);

    if (expectedStatus !== 200) {
      return res.body;
    }

    Res.expectValidListResponse(res, allowEmpty);

    return res.body.data;
  }

  /**
   * @return {Promise<Object>}
   *
   * @link BlockchainService#getAndProcessMyselfBlockchainTransactions
   */
  static async requestToGetMyselfBlockchainTransactions(myself, expectedStatus = 200, queryString = '', allowEmpty = false) {
    let url = Req.getMyselfBlockchainTransactionsUrl();

    if (queryString) {
      url += `${queryString}`;
    }

    const req = request(server)
      .get(url)
    ;

    Req.addAuthToken(req, myself);

    const res = await req;

    Res.expectStatusToBe(res, expectedStatus);

    if (expectedStatus !== 200) {
      return res.body;
    }

    // TODO validate response list
    Res.expectValidListResponse(res, allowEmpty);

    return res.body.data;
  }

  /**
   *
   * @param models
   */
  static checkMyselfBlockchainTransactionsStructure(models) {
    const commonFields = [
      'updated_at',
      'tr_type',
      'memo',
      'raw_tr_data'
    ];

    const trTypeToProcessor = {
      [BlockchainTrTypesDictionary.getTypeTransfer()]:        BlockchainHelper._checkTrTransfer,
      [BlockchainTrTypesDictionary.getTypeStakeResources()]:  BlockchainHelper._checkTrStake,
    };

    const trTypeToFieldSet = {
      [TR_TYPE_BUY_RAM]: [
        'resources',
        // TODO validate inner object structure
      ],
      [TR_TYPE_SELL_RAM]: [
        'resources',
        // TODO validate inner object structure
      ],
      [TR_TYPE__TRANSFER_TO]: [
        'User',
        'memo',
        'tokens',
        // TODO validate inner object structure
      ],
      [TR_TYPE__TRANSFER_FROM]: [
        'User',
        'memo',
        'tokens',
        // TODO validate inner object structure
      ],
      [TR_TYPE_STAKE_RESOURCES]: [
        'resources',
        // TODO validate inner object structure
      ],
      [TR_TYPE_UNSTAKING_REQUEST]: [
        'resources',
        // TODO validate inner object structure
      ],
      [TR_TYPE_VOTE_FOR_BP]: [
        'producers'
        // TODO validate inner object structure
      ],
      [TR_TYPE_CLAIM_EMISSION]: [
        'tokens'
        // TODO validate inner object structure
      ],
    };

    models.forEach(model => {
      expect(model.tr_type).toBeDefined();

      const checker = trTypeToProcessor[model.tr_type];

      if (checker) {
        checker(model);
      }

      const requiredFields = trTypeToFieldSet[model.tr_type];
      expect(requiredFields).toBeDefined();

      const expected = requiredFields.concat(commonFields);

      expect(Object.keys(model).sort()).toEqual(expected.sort());
    });
  }

  /**
   *
   * @param {Object} model
   * @private
   */
  static _checkTrStake(model) {
    BlockchainHelper._checkCommonTrTracesFields(model);
    // TODO
  }

  /**
   *
   * @param {Object} model
   * @private
   */
  static _checkTrTransfer(model) {
    BlockchainHelper._checkCommonTrTracesFields(model);
    expect(model.memo).toBe('');
    expect(model.tr_type).toBe(BlockchainTrTypesDictionary.getTypeTransfer());

    expect(model.resources).toBeDefined();

    expect(model.resources.cpu).toBeDefined();
    expect(model.resources.cpu.tokens).toBeDefined();
    expect(model.resources.cpu.tokens.currency).toBe('UOS');
    expect(typeof model.resources.cpu.tokens.self_delegated).toBe('number');
    expect(model.resources.cpu.tokens.self_delegated).toBeGreaterThanOrEqual(0);

    expect(model.resources.net).toBeDefined();
    expect(model.resources.net.tokens).toBeDefined();
    expect(model.resources.net.tokens.currency).toBe('UOS');
    expect(model.resources.net.tokens.self_delegated).toBeGreaterThanOrEqual(0);
  }

  /**
   *
   * @param {Object} model
   * @private
   */
  static _checkCommonTrTracesFields(model) {
    expect(typeof model.updated_at).toBe('string');
    expect(model.updated_at.length).toBeGreaterThan(0);
    expect(model.raw_tr_data).toBeDefined();
    expect(Object.keys(model.raw_tr_data).length).toBeGreaterThan(0);
  }

  /**
   *
   * @param {Object[]} models
   * @param {boolean} isMyselfDataRequired
   */
  static checkManyProducers(models, isMyselfDataRequired = false) {
    models.forEach(model => {
      this.checkOneProducer(model, isMyselfDataRequired);
    });
  }

  /**
   *
   * @param {Object} model
   * @param {boolean} isMyselfDataRequired
   */
  static checkOneProducer(model, isMyselfDataRequired = false) {
    expect(model).toBeDefined();
    expect(model).not.toBeNull();
    expect(typeof model).toBe('object');

    const expected = BlockchainModelProvider.getFieldsForPreview();

    if (isMyselfDataRequired) {
      expected.push('myselfData');
    }

    const actual = Object.keys(model);
    expect(actual.sort()).toEqual(expected.sort());

    expect(typeof model.id).toBe('number');
    expect(model.id).toBeGreaterThan(0);

    expect(typeof model.title).toBe('string');
    expect(model.title.length).toBeGreaterThan(0);

    expect(typeof model.votes_count).toBe('number');
    expect(model.votes_count).toBeGreaterThanOrEqual(0);

    expect(typeof model.votes_amount).toBe('number');
    expect(model.votes_amount).toBeGreaterThanOrEqual(0);

    expect(model.currency).toBe('UOS');

    expect([1, 2]).toContain(model.bp_status);

    if (isMyselfDataRequired) {
      expect(model.myselfData).toBeDefined();
      expect(model.myselfData.bp_vote).toBeDefined();
      expect(typeof model.myselfData.bp_vote).toBe('boolean');
    }
  }
}

module.exports = BlockchainHelper;