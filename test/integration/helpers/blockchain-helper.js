const request = require('supertest');
const server = require('../../../app');

const Req = require('./request-helper');
const Res = require('./response-helper');

const accountsData = require('../../../config/accounts-data');

const BlockchainService       = require('../../../lib/eos/service').Blockchain;
const BlockchainModelProvider = require('../../../lib/eos/service').ModelProvider;

const BlockchainNodesRepository = require('../../../lib/eos/repository').Main;
const { TransactionSender } = require('ucom-libs-social-transactions');

const { WalletApi } = require('ucom-libs-wallet');

const BlockchainTrTypesDictionary = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

const UsersHelper = require('./users-helper');

let accountName = 'vlad';
let privateKey = accountsData[accountName].activePk;

class BlockchainHelper {

  static getEtalonVladTrEmission() {
    return [
      {
        // "id": "1",
        "tr_type": 50,
        "tr_processed_data": {
          "tokens": {
            "currency": "UOS",
            "emission": 4075.2938
          }
        },
        "memo": "",
        "tr_id": "97a06b69bb3aa1728aaec96224127b2324983ef806a28f3e03579dc5891eb26d",
        "external_id": "5c007f51f24a510c2fb94902",
        "account_name_from": null,
        "account_name_to": "vlad",
        "raw_tr_data": {
          "id": "97a06b69bb3aa1728aaec96224127b2324983ef806a28f3e03579dc5891eb26d",
          "_id": "5c007f51f24a510c2fb94902",
          "except": null,
          "elapsed": 2933,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 3546,
            "net_usage_words": 13
          },
          "createdAt": "2018-11-30T00:07:45.623Z",
          "net_usage": 104,
          "scheduled": false,
          "block_data": {
            "block_id": "00e5ca528753e676de4d55fdd8e613f62f25057b3641734c50e800a97e330339",
            "producer": "calc5",
            "block_num": 15059538,
            "validated": true,
            "executed_at": "2018-11-12T12:44:27.500",
            "irreversible": true,
            "previous_block_id": "00e5ca5116f451f3342ed0a4905ff2db0becf4a180fe5b0b3443086373f9dafd"
          },
          "action_traces": [
            {
              "act": {
                "data": {
                  "owner": "vlad"
                },
                "name": "withdrawal",
                "account": "uos.calcs",
                "hex_data": "0000000000904cdc",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "97a06b69bb3aa1728aaec96224127b2324983ef806a28f3e03579dc5891eb26d",
              "console": "",
              "elapsed": 995,
              "receipt": {
                "receiver": "uos.calcs",
                "act_digest": "7c254361c8da8798e30eaa3a38ba8d22c80f7625c70dd61e83ffe6f86b6e1d62",
                "abi_sequence": 1,
                "auth_sequence": [
                  [
                    "vlad",
                    1349
                  ]
                ],
                "code_sequence": 1,
                "recv_sequence": 1000861,
                "global_sequence": 20139962
              },
              "cpu_usage": 0,
              "inline_traces": [
                {
                  "act": {
                    "data": {
                      "to": "uos.calcs",
                      "memo": "issue tokens for account",
                      "quantity": "4075.2938 UOS"
                    },
                    "name": "issue",
                    "account": "eosio.token",
                    "hex_data": "0000c0281a0430d52ad76d020000000004554f530000000018697373756520746f6b656e7320666f72206163636f756e74",
                    "authorization": [
                      {
                        "actor": "eosio",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "97a06b69bb3aa1728aaec96224127b2324983ef806a28f3e03579dc5891eb26d",
                  "console": "",
                  "elapsed": 716,
                  "receipt": {
                    "receiver": "eosio.token",
                    "act_digest": "7df47fd784edabab99998d2c8d8fec1f3cf923f022532ae0e3261c93e7db5cb6",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "eosio",
                        15059755
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 754,
                    "global_sequence": 20139963
                  },
                  "cpu_usage": 0,
                  "inline_traces": [
                    {
                      "act": {
                        "data": {
                          "to": "uos.calcs",
                          "from": "eosio",
                          "memo": "issue tokens for account",
                          "quantity": "4075.2938 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000ea30550000c0281a0430d52ad76d020000000004554f530000000018697373756520746f6b656e7320666f72206163636f756e74",
                        "authorization": [
                          {
                            "actor": "eosio",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "97a06b69bb3aa1728aaec96224127b2324983ef806a28f3e03579dc5891eb26d",
                      "console": "",
                      "elapsed": 402,
                      "receipt": {
                        "receiver": "eosio.token",
                        "act_digest": "50ba64e63fbb82717da06fbea7d403b3a764e2bce66e4fc8c7dfaaafb15ab11a",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "eosio",
                            15059756
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 755,
                        "global_sequence": 20139964
                      },
                      "cpu_usage": 0,
                      "inline_traces": [
                        {
                          "act": {
                            "data": {
                              "to": "uos.calcs",
                              "from": "eosio",
                              "memo": "issue tokens for account",
                              "quantity": "4075.2938 UOS"
                            },
                            "name": "transfer",
                            "account": "eosio.token",
                            "hex_data": "0000000000ea30550000c0281a0430d52ad76d020000000004554f530000000018697373756520746f6b656e7320666f72206163636f756e74",
                            "authorization": [
                              {
                                "actor": "eosio",
                                "permission": "active"
                              }
                            ]
                          },
                          "trx_id": "97a06b69bb3aa1728aaec96224127b2324983ef806a28f3e03579dc5891eb26d",
                          "console": "",
                          "elapsed": 58,
                          "receipt": {
                            "receiver": "eosio",
                            "act_digest": "50ba64e63fbb82717da06fbea7d403b3a764e2bce66e4fc8c7dfaaafb15ab11a",
                            "abi_sequence": 2,
                            "auth_sequence": [
                              [
                                "eosio",
                                15059757
                              ]
                            ],
                            "code_sequence": 2,
                            "recv_sequence": 15060880,
                            "global_sequence": 20139965
                          },
                          "cpu_usage": 0,
                          "inline_traces": [],
                          "total_cpu_usage": 0
                        },
                        {
                          "act": {
                            "data": {
                              "to": "uos.calcs",
                              "from": "eosio",
                              "memo": "issue tokens for account",
                              "quantity": "4075.2938 UOS"
                            },
                            "name": "transfer",
                            "account": "eosio.token",
                            "hex_data": "0000000000ea30550000c0281a0430d52ad76d020000000004554f530000000018697373756520746f6b656e7320666f72206163636f756e74",
                            "authorization": [
                              {
                                "actor": "eosio",
                                "permission": "active"
                              }
                            ]
                          },
                          "trx_id": "97a06b69bb3aa1728aaec96224127b2324983ef806a28f3e03579dc5891eb26d",
                          "console": "",
                          "elapsed": 48,
                          "receipt": {
                            "receiver": "uos.calcs",
                            "act_digest": "50ba64e63fbb82717da06fbea7d403b3a764e2bce66e4fc8c7dfaaafb15ab11a",
                            "abi_sequence": 2,
                            "auth_sequence": [
                              [
                                "eosio",
                                15059758
                              ]
                            ],
                            "code_sequence": 2,
                            "recv_sequence": 1000862,
                            "global_sequence": 20139966
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
                      "to": "vlad",
                      "from": "uos.calcs",
                      "memo": "transfer issued tokens for account",
                      "quantity": "4075.2938 UOS"
                    },
                    "name": "transfer",
                    "account": "eosio.token",
                    "hex_data": "0000c0281a0430d50000000000904cdc2ad76d020000000004554f5300000000227472616e736665722069737375656420746f6b656e7320666f72206163636f756e74",
                    "authorization": [
                      {
                        "actor": "uos.calcs",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "97a06b69bb3aa1728aaec96224127b2324983ef806a28f3e03579dc5891eb26d",
                  "console": "",
                  "elapsed": 445,
                  "receipt": {
                    "receiver": "eosio.token",
                    "act_digest": "7ca3f861289efa9d14a03af9357b06ade1ea0042d33827b56ceacdd9a05fc194",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "uos.calcs",
                        999722
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 756,
                    "global_sequence": 20139967
                  },
                  "cpu_usage": 0,
                  "inline_traces": [
                    {
                      "act": {
                        "data": {
                          "to": "vlad",
                          "from": "uos.calcs",
                          "memo": "transfer issued tokens for account",
                          "quantity": "4075.2938 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000c0281a0430d50000000000904cdc2ad76d020000000004554f5300000000227472616e736665722069737375656420746f6b656e7320666f72206163636f756e74",
                        "authorization": [
                          {
                            "actor": "uos.calcs",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "97a06b69bb3aa1728aaec96224127b2324983ef806a28f3e03579dc5891eb26d",
                      "console": "",
                      "elapsed": 53,
                      "receipt": {
                        "receiver": "uos.calcs",
                        "act_digest": "7ca3f861289efa9d14a03af9357b06ade1ea0042d33827b56ceacdd9a05fc194",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "uos.calcs",
                            999723
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 1000863,
                        "global_sequence": 20139968
                      },
                      "cpu_usage": 0,
                      "inline_traces": [],
                      "total_cpu_usage": 0
                    },
                    {
                      "act": {
                        "data": {
                          "to": "vlad",
                          "from": "uos.calcs",
                          "memo": "transfer issued tokens for account",
                          "quantity": "4075.2938 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000c0281a0430d50000000000904cdc2ad76d020000000004554f5300000000227472616e736665722069737375656420746f6b656e7320666f72206163636f756e74",
                        "authorization": [
                          {
                            "actor": "uos.calcs",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "97a06b69bb3aa1728aaec96224127b2324983ef806a28f3e03579dc5891eb26d",
                      "console": "",
                      "elapsed": 3,
                      "receipt": {
                        "receiver": "vlad",
                        "act_digest": "7ca3f861289efa9d14a03af9357b06ade1ea0042d33827b56ceacdd9a05fc194",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "uos.calcs",
                            999724
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 16,
                        "global_sequence": 20139969
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
        // "tr_executed_at": "2018-11-12T09:44:27.000Z",
        // "mongodb_created_at": "2018-11-30T00:07:45.000Z",
        // "created_at": "2018-12-10T18:20:18.085Z",
        // "updated_at": "2018-12-10T18:20:18.085Z"
      }
    ]
  }

  static getEtalonVladTrTraces() {
    return [
      {
        // "id": "1",
        "tr_type": 12,
        "tr_processed_data": {
          "tokens": {
            "active": 6,
            "currency": "UOS"
          }
        },
        "memo": "",
        "tr_id": "5db9280470c27bd4452b6ff68809f642b3b2076c65e2bc289d06ebe6cce4402d",
        "external_id": "5c08e15af24a510c2ffdbe2d",
        "account_name_from": "vlad",
        "account_name_to": "jane",
        "raw_tr_data": {
          "id": "5db9280470c27bd4452b6ff68809f642b3b2076c65e2bc289d06ebe6cce4402d",
          "_id": "5c08e15af24a510c2ffdbe2d",
          "except": null,
          "elapsed": 1779,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 8087,
            "net_usage_words": 16
          },
          "createdAt": "2018-12-06T08:44:10.505Z",
          "net_usage": 128,
          "scheduled": false,
          "block_data": {
            "block_id": "0124a18ce6f2e6129c00bc39aa0598e91545d3ba02c72cd687f9bae56c3604b0",
            "producer": "calc2",
            "block_num": 19177868,
            "validated": true,
            "executed_at": "2018-12-06T08:44:10.500",
            "irreversible": true,
            "previous_block_id": "0124a18badc31de86903dd5f76fe413a622b567752886cd2973913153c0b5e8c"
          },
          "action_traces": [
            {
              "act": {
                "data": {
                  "to": "jane",
                  "from": "vlad",
                  "memo": "",
                  "quantity": "6.0000 UOS"
                },
                "name": "transfer",
                "account": "eosio.token",
                "hex_data": "0000000000904cdc0000000000a0a67960ea00000000000004554f530000000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "5db9280470c27bd4452b6ff68809f642b3b2076c65e2bc289d06ebe6cce4402d",
              "console": "",
              "elapsed": 1419,
              "receipt": {
                "receiver": "eosio.token",
                "act_digest": "da60719110b967b43d3d19cc1dea86a125d0b8f0b6daa0ef4c02611fcfdda39c",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1915
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 1132,
                "global_sequence": 34144585
              },
              "cpu_usage": 0,
              "inline_traces": [
                {
                  "act": {
                    "data": {
                      "to": "jane",
                      "from": "vlad",
                      "memo": "",
                      "quantity": "6.0000 UOS"
                    },
                    "name": "transfer",
                    "account": "eosio.token",
                    "hex_data": "0000000000904cdc0000000000a0a67960ea00000000000004554f530000000000",
                    "authorization": [
                      {
                        "actor": "vlad",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "5db9280470c27bd4452b6ff68809f642b3b2076c65e2bc289d06ebe6cce4402d",
                  "console": "",
                  "elapsed": 7,
                  "receipt": {
                    "receiver": "vlad",
                    "act_digest": "da60719110b967b43d3d19cc1dea86a125d0b8f0b6daa0ef4c02611fcfdda39c",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "vlad",
                        1916
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 23,
                    "global_sequence": 34144586
                  },
                  "cpu_usage": 0,
                  "inline_traces": [],
                  "total_cpu_usage": 0
                },
                {
                  "act": {
                    "data": {
                      "to": "jane",
                      "from": "vlad",
                      "memo": "",
                      "quantity": "6.0000 UOS"
                    },
                    "name": "transfer",
                    "account": "eosio.token",
                    "hex_data": "0000000000904cdc0000000000a0a67960ea00000000000004554f530000000000",
                    "authorization": [
                      {
                        "actor": "vlad",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "5db9280470c27bd4452b6ff68809f642b3b2076c65e2bc289d06ebe6cce4402d",
                  "console": "",
                  "elapsed": 8,
                  "receipt": {
                    "receiver": "jane",
                    "act_digest": "da60719110b967b43d3d19cc1dea86a125d0b8f0b6daa0ef4c02611fcfdda39c",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "vlad",
                        1917
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 41,
                    "global_sequence": 34144587
                  },
                  "cpu_usage": 0,
                  "inline_traces": [],
                  "total_cpu_usage": 0
                }
              ],
              "total_cpu_usage": 0
            }
          ]
        },
        "tr_executed_at": 1544075050,
        // "mongodb_created_at": "2018-12-06T08:44:10.000Z",
        // "created_at": "2018-12-10T15:05:56.515Z",
        // "updated_at": "2018-12-10T15:05:56.515Z"
      },
      {
        // "id": "2",
        "tr_type": 12,
        "tr_processed_data": {
          "tokens": {
            "active": 5,
            "currency": "UOS"
          }
        },
        "memo": "",
        "tr_id": "9254b29ec0097e080a8202b00cd490b3072063867a006fb2a215fc08d73d8312",
        "external_id": "5c08e15df24a510c2ffdbe47",
        "account_name_from": "jane",
        "account_name_to": "vlad",
        "raw_tr_data": {
          "id": "9254b29ec0097e080a8202b00cd490b3072063867a006fb2a215fc08d73d8312",
          "_id": "5c08e15df24a510c2ffdbe47",
          "except": null,
          "elapsed": 1224,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 1224,
            "net_usage_words": 16
          },
          "createdAt": "2018-12-06T08:44:13.154Z",
          "net_usage": 128,
          "scheduled": false,
          "block_data": {
            "block_id": "0124a192d2b3b67f7539f04248202e02d674eb91ff488ef82fdf303ad9853e7f",
            "producer": "calc3",
            "block_num": 19177874,
            "validated": true,
            "executed_at": "2018-12-06T08:44:13.500",
            "irreversible": true,
            "previous_block_id": "0124a191126f23c2fcc2aeaf3677d502a13b25a6f9de066694bebb35187b2fc9"
          },
          "action_traces": [
            {
              "act": {
                "data": {
                  "to": "vlad",
                  "from": "jane",
                  "memo": "",
                  "quantity": "5.0000 UOS"
                },
                "name": "transfer",
                "account": "eosio.token",
                "hex_data": "0000000000a0a6790000000000904cdc50c300000000000004554f530000000000",
                "authorization": [
                  {
                    "actor": "jane",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "9254b29ec0097e080a8202b00cd490b3072063867a006fb2a215fc08d73d8312",
              "console": "",
              "elapsed": 791,
              "receipt": {
                "receiver": "eosio.token",
                "act_digest": "b2af7a637fb225f768bf0b4d5f8e893fb93186b5aa88a2c1b50289b78eaca2c1",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "jane",
                    644
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 1133,
                "global_sequence": 34144594
              },
              "cpu_usage": 0,
              "inline_traces": [
                {
                  "act": {
                    "data": {
                      "to": "vlad",
                      "from": "jane",
                      "memo": "",
                      "quantity": "5.0000 UOS"
                    },
                    "name": "transfer",
                    "account": "eosio.token",
                    "hex_data": "0000000000a0a6790000000000904cdc50c300000000000004554f530000000000",
                    "authorization": [
                      {
                        "actor": "jane",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "9254b29ec0097e080a8202b00cd490b3072063867a006fb2a215fc08d73d8312",
                  "console": "",
                  "elapsed": 7,
                  "receipt": {
                    "receiver": "jane",
                    "act_digest": "b2af7a637fb225f768bf0b4d5f8e893fb93186b5aa88a2c1b50289b78eaca2c1",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "jane",
                        645
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 42,
                    "global_sequence": 34144595
                  },
                  "cpu_usage": 0,
                  "inline_traces": [],
                  "total_cpu_usage": 0
                },
                {
                  "act": {
                    "data": {
                      "to": "vlad",
                      "from": "jane",
                      "memo": "",
                      "quantity": "5.0000 UOS"
                    },
                    "name": "transfer",
                    "account": "eosio.token",
                    "hex_data": "0000000000a0a6790000000000904cdc50c300000000000004554f530000000000",
                    "authorization": [
                      {
                        "actor": "jane",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "9254b29ec0097e080a8202b00cd490b3072063867a006fb2a215fc08d73d8312",
                  "console": "",
                  "elapsed": 8,
                  "receipt": {
                    "receiver": "vlad",
                    "act_digest": "b2af7a637fb225f768bf0b4d5f8e893fb93186b5aa88a2c1b50289b78eaca2c1",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "jane",
                        646
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 24,
                    "global_sequence": 34144596
                  },
                  "cpu_usage": 0,
                  "inline_traces": [],
                  "total_cpu_usage": 0
                }
              ],
              "total_cpu_usage": 0
            }
          ]
        },
        "tr_executed_at": 1544075053,
        // "mongodb_created_at": "2018-12-06T08:44:13.000Z",
        // "created_at": "2018-12-10T15:07:37.938Z",
        // "updated_at": "2018-12-10T15:07:37.938Z"
      }
    ];
  }
  static getEtalonVladStakeWithUnstake() {
    return [
      {
        // "id": "1",
        "tr_type": 21,
        "tr_processed_data": {
          "resources": {
            "cpu": {
              "tokens": {
                "currency": "UOS",
                "self_delegated": 2
              },
              "unstaking_request": {
                "amount": 0,
                "currency": "UOS"
              }
            },
            "net": {
              "tokens": {
                "currency": "UOS",
                "self_delegated": 0
              },
              "unstaking_request": {
                "amount": 3,
                "currency": "UOS"
              }
            }
          }
        },
        "memo": "",
        "tr_id": "e399d14bb1669126233f3dd7cee3e61b1883076c5665251adc4bbcec63655448",
        "external_id": "5c06e1c4f24a510c2fedbf18",
        "account_name_from": "vlad",
        "account_name_to": "vlad",
        "raw_tr_data": {
          "id": "e399d14bb1669126233f3dd7cee3e61b1883076c5665251adc4bbcec63655448",
          "_id": "5c06e1c4f24a510c2fedbf18",
          "except": null,
          "elapsed": 20494,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 20494,
            "net_usage_words": 39
          },
          "createdAt": "2018-12-04T20:21:24.868Z",
          "net_usage": 312,
          "scheduled": false,
          "action_traces": [
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "unstake_cpu_quantity": "0.0000 UOS",
                  "unstake_net_quantity": "3.0000 UOS"
                },
                "name": "undelegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc307500000000000004554f5300000000000000000000000004554f5300000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "e399d14bb1669126233f3dd7cee3e61b1883076c5665251adc4bbcec63655448",
              "console": "",
              "elapsed": 6405,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "475f7d105e4fb1d5babd8534af0e1b04104e978f51f91c73bbc419bfd6cd5881",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1833
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 18917837,
                "global_sequence": 33882467
              },
              "cpu_usage": 0,
              "inline_traces": [],
              "total_cpu_usage": 0
            },
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "transfer": 0,
                  "stake_cpu_quantity": "2.0000 UOS",
                  "stake_net_quantity": "0.0000 UOS"
                },
                "name": "delegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc000000000000000004554f5300000000204e00000000000004554f530000000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "e399d14bb1669126233f3dd7cee3e61b1883076c5665251adc4bbcec63655448",
              "console": "",
              "elapsed": 3174,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "fdb8c572fa49003094d43877f9a40886e77817febbd194f02594cc65672d1694",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1834
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 18917838,
                "global_sequence": 33882468
              },
              "cpu_usage": 0,
              "inline_traces": [
                {
                  "act": {
                    "data": {
                      "to": "eosio.stake",
                      "from": "vlad",
                      "memo": "stake bandwidth",
                      "quantity": "2.0000 UOS"
                    },
                    "name": "transfer",
                    "account": "eosio.token",
                    "hex_data": "0000000000904cdc0014341903ea3055204e00000000000004554f53000000000f7374616b652062616e647769647468",
                    "authorization": [
                      {
                        "actor": "vlad",
                        "permission": "active"
                      }
                    ]
                  },
                  "trx_id": "e399d14bb1669126233f3dd7cee3e61b1883076c5665251adc4bbcec63655448",
                  "console": "",
                  "elapsed": 2536,
                  "receipt": {
                    "receiver": "eosio.token",
                    "act_digest": "333df59abbe27f7328a9f1f70d33aa9ea370069a11457e64bc18c09b2b30c51d",
                    "abi_sequence": 2,
                    "auth_sequence": [
                      [
                        "vlad",
                        1835
                      ]
                    ],
                    "code_sequence": 2,
                    "recv_sequence": 1112,
                    "global_sequence": 33882469
                  },
                  "cpu_usage": 0,
                  "inline_traces": [
                    {
                      "act": {
                        "data": {
                          "to": "eosio.stake",
                          "from": "vlad",
                          "memo": "stake bandwidth",
                          "quantity": "2.0000 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000904cdc0014341903ea3055204e00000000000004554f53000000000f7374616b652062616e647769647468",
                        "authorization": [
                          {
                            "actor": "vlad",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "e399d14bb1669126233f3dd7cee3e61b1883076c5665251adc4bbcec63655448",
                      "console": "",
                      "elapsed": 4,
                      "receipt": {
                        "receiver": "vlad",
                        "act_digest": "333df59abbe27f7328a9f1f70d33aa9ea370069a11457e64bc18c09b2b30c51d",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "vlad",
                            1836
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 21,
                        "global_sequence": 33882470
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
                          "quantity": "2.0000 UOS"
                        },
                        "name": "transfer",
                        "account": "eosio.token",
                        "hex_data": "0000000000904cdc0014341903ea3055204e00000000000004554f53000000000f7374616b652062616e647769647468",
                        "authorization": [
                          {
                            "actor": "vlad",
                            "permission": "active"
                          }
                        ]
                      },
                      "trx_id": "e399d14bb1669126233f3dd7cee3e61b1883076c5665251adc4bbcec63655448",
                      "console": "",
                      "elapsed": 920,
                      "receipt": {
                        "receiver": "eosio.stake",
                        "act_digest": "333df59abbe27f7328a9f1f70d33aa9ea370069a11457e64bc18c09b2b30c51d",
                        "abi_sequence": 2,
                        "auth_sequence": [
                          [
                            "vlad",
                            1837
                          ]
                        ],
                        "code_sequence": 2,
                        "recv_sequence": 340,
                        "global_sequence": 33882471
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
        // "tr_executed_at": "2018-12-04T20:21:24.000Z",
        // "mongodb_created_at": "2018-12-04T20:21:24.000Z",
        // "created_at": "2018-12-06T10:48:44.789Z",
        // "updated_at": "2018-12-06T10:48:44.789Z"
      },
      {
        // "id": "3",
        "tr_type": 21,
        "tr_processed_data": {
          "resources": {
            "cpu": {
              "tokens": {
                "currency": "UOS",
                "self_delegated": 0
              },
              "unstaking_request": {
                "amount": 7,
                "currency": "UOS"
              }
            },
            "net": {
              "tokens": {
                "currency": "UOS",
                "self_delegated": 3
              },
              "unstaking_request": {
                "amount": 0,
                "currency": "UOS"
              }
            }
          }
        },
        "memo": "",
        "tr_id": "5e5f2220189baf1e9dd4093b0eb97af58ac81bd83ea23356892acb54150f2e03",
        "external_id": "5c08f5e0f24a510c2fffd7f8",
        "account_name_from": "vlad",
        "account_name_to": "vlad",
        "raw_tr_data": {
          "id": "5e5f2220189baf1e9dd4093b0eb97af58ac81bd83ea23356892acb54150f2e03",
          "_id": "5c08f5e0f24a510c2fffd7f8",
          "except": null,
          "elapsed": 5801,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 5801,
            "net_usage_words": 34
          },
          "createdAt": "2018-12-06T10:11:44.779Z",
          "net_usage": 272,
          "scheduled": false,
          "action_traces": [
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "transfer": 0,
                  "stake_cpu_quantity": "0.0000 UOS",
                  "stake_net_quantity": "3.0000 UOS"
                },
                "name": "delegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc307500000000000004554f5300000000000000000000000004554f530000000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "5e5f2220189baf1e9dd4093b0eb97af58ac81bd83ea23356892acb54150f2e03",
              "console": "",
              "elapsed": 3338,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "22a0e5ab02a5460df5c2de23aa8418fab11a0a70749b63903424f0a36009f4a5",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1921
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 19190290,
                "global_sequence": 34198546
              },
              "cpu_usage": 0,
              "inline_traces": [],
              "total_cpu_usage": 0
            },
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "unstake_cpu_quantity": "7.0000 UOS",
                  "unstake_net_quantity": "0.0000 UOS"
                },
                "name": "undelegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc000000000000000004554f5300000000701101000000000004554f5300000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "5e5f2220189baf1e9dd4093b0eb97af58ac81bd83ea23356892acb54150f2e03",
              "console": "",
              "elapsed": 2201,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "0251278462a2676125fc22496ac1f51fc861e77ab9c8947f5e6fa5101a16e3c5",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1922
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 19190291,
                "global_sequence": 34198547
              },
              "cpu_usage": 0,
              "inline_traces": [],
              "total_cpu_usage": 0
            }
          ]
        },
        // "tr_executed_at": "2018-12-06T10:11:44.000Z",
        // "mongodb_created_at": "2018-12-06T10:11:44.000Z",
        // "created_at": "2018-12-06T10:48:44.789Z",
        // "updated_at": "2018-12-06T10:48:44.789Z"
      }
    ];
  }


  static getEtalonVladUnstakingRequests() {
    return [
      {
        // "id": "1",
        "tr_type": 30,
        "tr_processed_data": {
          "resources": {
            "cpu": {
              "unstaking_request": {
                "amount": 0,
                "currency": "UOS"
              }
            },
            "net": {
              "unstaking_request": {
                "amount": 3,
                "currency": "UOS"
              }
            }
          }
        },
        "memo": "",
        "tr_id": "b19bf74ff2a397f92857e36c279b43f3ce2ee697487639706fdcc8387f1f83ee",
        "external_id": "5c0906a5f24a510c2f022551",
        "account_name_from": "vlad",
        "account_name_to": "vlad",
        "raw_tr_data": {
          "id": "b19bf74ff2a397f92857e36c279b43f3ce2ee697487639706fdcc8387f1f83ee",
          "_id": "5c0906a5f24a510c2f022551",
          "except": null,
          "elapsed": 1833,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 1833,
            "net_usage_words": 23
          },
          "createdAt": "2018-12-06T11:23:17.028Z",
          "net_usage": 184,
          "scheduled": false,
          "action_traces": [
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "unstake_cpu_quantity": "0.0000 UOS",
                  "unstake_net_quantity": "3.0000 UOS"
                },
                "name": "undelegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc307500000000000004554f5300000000000000000000000004554f5300000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "b19bf74ff2a397f92857e36c279b43f3ce2ee697487639706fdcc8387f1f83ee",
              "console": "",
              "elapsed": 1608,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "475f7d105e4fb1d5babd8534af0e1b04104e978f51f91c73bbc419bfd6cd5881",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1925
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 19198879,
                "global_sequence": 34260076
              },
              "cpu_usage": 0,
              "inline_traces": [],
              "total_cpu_usage": 0
            }
          ]
        },
        // "tr_executed_at": "2018-12-06T11:23:17.000Z",
        // "mongodb_created_at": "2018-12-06T11:23:17.000Z",
        // "created_at": "2018-12-06T11:39:21.664Z",
        // "updated_at": "2018-12-06T11:39:21.664Z"
      },
      {
        // "id": "3",
        "tr_type": 30,
        "tr_processed_data": {
          "resources": {
            "cpu": {
              "unstaking_request": {
                "amount": 2,
                "currency": "UOS"
              }
            },
            "net": {
              "unstaking_request": {
                "amount": 0,
                "currency": "UOS"
              }
            }
          }
        },
        "memo": "",
        "tr_id": "847dd0b78d38769206bbdca9d7862a7f7062e4078716b8087e404355f5cf40f8",
        "external_id": "5c0906aaf24a510c2f02267e",
        "account_name_from": "vlad",
        "account_name_to": "vlad",
        "raw_tr_data": {
          "id": "847dd0b78d38769206bbdca9d7862a7f7062e4078716b8087e404355f5cf40f8",
          "_id": "5c0906aaf24a510c2f02267e",
          "except": null,
          "elapsed": 1950,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 1950,
            "net_usage_words": 23
          },
          "createdAt": "2018-12-06T11:23:22.621Z",
          "net_usage": 184,
          "scheduled": false,
          "action_traces": [
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "unstake_cpu_quantity": "2.0000 UOS",
                  "unstake_net_quantity": "0.0000 UOS"
                },
                "name": "undelegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc000000000000000004554f5300000000204e00000000000004554f5300000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "847dd0b78d38769206bbdca9d7862a7f7062e4078716b8087e404355f5cf40f8",
              "console": "",
              "elapsed": 1687,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "c4866e45328fa2ef09e465e66ab288104943a36f060b6a593e596b8b52598a52",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1926
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 19198891,
                "global_sequence": 34260208
              },
              "cpu_usage": 0,
              "inline_traces": [],
              "total_cpu_usage": 0
            }
          ]
        },
        // "tr_executed_at": "2018-12-06T11:23:22.000Z",
        // "mongodb_created_at": "2018-12-06T11:23:22.000Z",
        // "created_at": "2018-12-06T11:39:21.664Z",
        // "updated_at": "2018-12-06T11:39:21.664Z"
      },
      {
        // "id": "5",
        "tr_type": 30,
        "tr_processed_data": {
          "resources": {
            "cpu": {
              "unstaking_request": {
                "amount": 2,
                "currency": "UOS"
              }
            },
            "net": {
              "unstaking_request": {
                "amount": 2,
                "currency": "UOS"
              }
            }
          }
        },
        "memo": "",
        "tr_id": "80ad7119439cbbf74eda33bcd62b9f627f37b082192094ad37bfa7542aff8ffc",
        "external_id": "5c0906b0f24a510c2f0227a1",
        "account_name_from": "vlad",
        "account_name_to": "vlad",
        "raw_tr_data": {
          "id": "80ad7119439cbbf74eda33bcd62b9f627f37b082192094ad37bfa7542aff8ffc",
          "_id": "5c0906b0f24a510c2f0227a1",
          "except": null,
          "elapsed": 3686,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 3686,
            "net_usage_words": 39
          },
          "createdAt": "2018-12-06T11:23:28.336Z",
          "net_usage": 312,
          "scheduled": false,
          "action_traces": [
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "unstake_cpu_quantity": "0.0000 UOS",
                  "unstake_net_quantity": "2.0000 UOS"
                },
                "name": "undelegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc204e00000000000004554f5300000000000000000000000004554f5300000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "80ad7119439cbbf74eda33bcd62b9f627f37b082192094ad37bfa7542aff8ffc",
              "console": "",
              "elapsed": 1976,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "09b71ee611080b169ae0c0116d550a8570df9c86fd30b3fb9fa9a84b823de561",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1927
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 19198903,
                "global_sequence": 34260330
              },
              "cpu_usage": 0,
              "inline_traces": [],
              "total_cpu_usage": 0
            },
            {
              "act": {
                "data": {
                  "from": "vlad",
                  "receiver": "vlad",
                  "unstake_cpu_quantity": "2.0000 UOS",
                  "unstake_net_quantity": "0.0000 UOS"
                },
                "name": "undelegatebw",
                "account": "eosio",
                "hex_data": "0000000000904cdc0000000000904cdc000000000000000004554f5300000000204e00000000000004554f5300000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "80ad7119439cbbf74eda33bcd62b9f627f37b082192094ad37bfa7542aff8ffc",
              "console": "",
              "elapsed": 1434,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "c4866e45328fa2ef09e465e66ab288104943a36f060b6a593e596b8b52598a52",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1928
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 19198904,
                "global_sequence": 34260331
              },
              "cpu_usage": 0,
              "inline_traces": [],
              "total_cpu_usage": 0
            }
          ]
        },
        // "tr_executed_at": "2018-12-06T11:23:28.000Z",
        // "mongodb_created_at": "2018-12-06T11:23:28.000Z",
        // "created_at": "2018-12-06T11:39:21.664Z",
        // "updated_at": "2018-12-06T11:39:21.664Z"
      }
    ];
  }

  static getEthalonVladVotesForBp() {
    return [
      {
        // "id": "1",
        "tr_type": 40,
        "tr_processed_data": {
          "producers": []
        },
        "memo": "",
        "tr_id": "5536b0e4b2c9ecf18e8f8fd84bb17da158349fefb7767fbfe0daff7ccefd7728",
        "external_id": "5c0089f2f24a510c2fdda072",
        "account_name_from": "vlad",
        "account_name_to": null,
        "raw_tr_data": {
          "id": "5536b0e4b2c9ecf18e8f8fd84bb17da158349fefb7767fbfe0daff7ccefd7728",
          "_id": "5c0089f2f24a510c2fdda072",
          "except": null,
          "elapsed": 1387,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 1798,
            "net_usage_words": 14
          },
          "createdAt": "2018-11-30T00:53:06.948Z",
          "net_usage": 112,
          "scheduled": false,
          "action_traces": [
            {
              "act": {
                "data": {
                  "proxy": "",
                  "voter": "vlad",
                  "producers": []
                },
                "name": "voteproducer",
                "account": "eosio",
                "hex_data": "0000000000904cdc000000000000000000",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "5536b0e4b2c9ecf18e8f8fd84bb17da158349fefb7767fbfe0daff7ccefd7728",
              "console": "",
              "elapsed": 1219,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "5e3729bfc655aba4e5c1fcf8ae7f4844297e80c14bc3add372b6a4bc03208d4a",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1419
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 15741896,
                "global_sequence": 21746410
              },
              "cpu_usage": 0,
              "inline_traces": [],
              "total_cpu_usage": 0
            }
          ]
        },
        // "tr_executed_at": "2018-11-30T00:53:06.000Z",
        // "mongodb_created_at": "2018-11-30T00:53:06.000Z",
        // "created_at": "2018-12-06T10:27:56.896Z",
        // "updated_at": "2018-12-06T10:27:56.896Z"
      },
      {
        // "id": "2",
        "tr_type": 40,
        "tr_processed_data": {
          "producers": [
            "calc2",
            "calc4"
          ]
        },
        "memo": "",
        "tr_id": "7a6fc58ed9d09e12c6a1c4cf9d151ed5c40fca530cb8f7a019c5625456bf2cf7",
        "external_id": "5c0089f2f24a510c2fdda08e",
        "account_name_from": "vlad",
        "account_name_to": null,
        "raw_tr_data": {
          "id": "7a6fc58ed9d09e12c6a1c4cf9d151ed5c40fca530cb8f7a019c5625456bf2cf7",
          "_id": "5c0089f2f24a510c2fdda08e",
          "except": null,
          "elapsed": 1491,
          "receipt": {
            "status": "executed",
            "cpu_usage_us": 1594,
            "net_usage_words": 16
          },
          "createdAt": "2018-11-30T00:53:06.962Z",
          "net_usage": 128,
          "scheduled": false,
          "action_traces": [
            {
              "act": {
                "data": {
                  "proxy": "",
                  "voter": "vlad",
                  "producers": [
                    "calc2",
                    "calc4"
                  ]
                },
                "name": "voteproducer",
                "account": "eosio",
                "hex_data": "0000000000904cdc000000000000000002000000000081a241000000000082a241",
                "authorization": [
                  {
                    "actor": "vlad",
                    "permission": "active"
                  }
                ]
              },
              "trx_id": "7a6fc58ed9d09e12c6a1c4cf9d151ed5c40fca530cb8f7a019c5625456bf2cf7",
              "console": "",
              "elapsed": 1319,
              "receipt": {
                "receiver": "eosio",
                "act_digest": "e1e75725874921a43d2121e797daec67299c31e6c2a04c87a9351dedae07bc9a",
                "abi_sequence": 2,
                "auth_sequence": [
                  [
                    "vlad",
                    1420
                  ]
                ],
                "code_sequence": 2,
                "recv_sequence": 15741910,
                "global_sequence": 21746424
              },
              "cpu_usage": 0,
              "inline_traces": [],
              "total_cpu_usage": 0
            }
          ]
        },
        // "tr_executed_at": "2018-11-30T00:53:06.000Z",
        // "mongodb_created_at": "2018-11-30T00:53:06.000Z",
        // "created_at": "2018-12-06T10:27:56.896Z",
        // "updated_at": "2018-12-06T10:27:56.896Z"
      }
    ]
  }
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
    const trTypeToProcessor = {
      [BlockchainTrTypesDictionary.getTypeTransfer()]:        BlockchainHelper._checkTrTransfer,
      [BlockchainTrTypesDictionary.getLabelTransferFrom()]:   BlockchainHelper._checkTrTransfer,
      [BlockchainTrTypesDictionary.getLabelTransferTo()]:     BlockchainHelper._checkTrTransfer,

      [BlockchainTrTypesDictionary.getTypeStakeResources()]:  BlockchainHelper._checkTrStake,
      [BlockchainTrTypesDictionary.getTypeUnstakingRequest()]:  BlockchainHelper._checkUnstakingRequest,
      [BlockchainTrTypesDictionary.getTypeStakeWithUnstake()]:  BlockchainHelper._checkTrStakeWithUnstake,
      [BlockchainTrTypesDictionary.getTypeVoteForBp()]:       BlockchainHelper._checkTrVoteForBp,
      [BlockchainTrTypesDictionary.getTypeClaimEmission()]:       BlockchainHelper._getTypeEmission,
    };

    models.forEach(model => {
      expect(model.tr_type).toBeDefined();

      const checker = trTypeToProcessor[model.tr_type];

      if (checker) {
        checker(model);
      } else {
        throw new Error(`There is no processor for tr_type: ${model.tr_type}`);
      }
    });
  }

  /**
   *
   * @param {Object} model
   * @private
   */
  static _checkTrTransfer(model) {
    const possibleValues = [
      BlockchainTrTypesDictionary.getLabelTransferFrom(),
      BlockchainTrTypesDictionary.getLabelTransferTo(),
    ];

    BlockchainHelper._checkCommonTrTracesFields(model);
    expect(~possibleValues.indexOf(model.tr_type)).toBeTruthy();
    expect(model.tokens).toBeDefined();
    expect(typeof model.tokens.active).toBe('number');
    expect(model.tokens.currency).toBe('UOS');

    UsersHelper.checkIncludedUserPreview(model);
  }

  /**
   *
   * @param {Object} model
   * @private
   */
  static _checkTrStake(model) {
    BlockchainHelper._checkCommonTrTracesFields(model);
    expect(model.memo).toBe('');
    expect(model.tr_type).toBe(BlockchainTrTypesDictionary.getTypeStakeResources());

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
  static _checkTrStakeWithUnstake(model) {
    BlockchainHelper._checkCommonTrTracesFields(model);
    expect(model.memo).toBe('');
    expect(model.tr_type).toBe(BlockchainTrTypesDictionary.getTypeStakeWithUnstake());

    expect(model.resources).toBeDefined();

    expect(model.resources.cpu).toBeDefined();
    expect(model.resources.cpu.tokens).toBeDefined();
    expect(model.resources.cpu.tokens.currency).toBe('UOS');
    expect(typeof model.resources.cpu.tokens.self_delegated).toBe('number');
    expect(model.resources.cpu.tokens.self_delegated).toBeGreaterThanOrEqual(0);

    expect(model.resources.cpu.unstaking_request).toBeDefined();
    expect(model.resources.cpu.unstaking_request.amount).toBeGreaterThanOrEqual(0);

    expect(model.resources.net).toBeDefined();
    expect(model.resources.net.tokens).toBeDefined();
    expect(model.resources.net.tokens.currency).toBe('UOS');
    expect(typeof model.resources.net.tokens.self_delegated).toBe('number');
    expect(model.resources.net.tokens.self_delegated).toBeGreaterThanOrEqual(0);
    expect(model.resources.net.unstaking_request).toBeDefined();
    expect(model.resources.net.unstaking_request.amount).toBeGreaterThanOrEqual(0);
  }

  /**
   *
   * @param {Object} model
   * @private
   */
  static _checkUnstakingRequest(model) {
    BlockchainHelper._checkCommonTrTracesFields(model);
    expect(model.memo).toBe('');
    expect(model.tr_type).toBe(BlockchainTrTypesDictionary.getTypeUnstakingRequest());

    expect(model.resources).toBeDefined();

    expect(model.resources.cpu).toBeDefined();
    expect(model.resources.cpu.tokens).not.toBeDefined();

    expect(model.resources.cpu.unstaking_request).toBeDefined();
    expect(model.resources.cpu.unstaking_request.amount).toBeGreaterThanOrEqual(0);
    expect(model.resources.cpu.unstaking_request.currency).toBe('UOS');

    expect(model.resources.net).toBeDefined();
    expect(model.resources.net.tokens).not.toBeDefined();

    expect(model.resources.net.unstaking_request).toBeDefined();
    expect(model.resources.net.unstaking_request.amount).toBeGreaterThanOrEqual(0);
    expect(model.resources.net.unstaking_request.currency).toBe('UOS');
  }

  /**
   *
   * @param {Object} model
   * @private
   */
  static _checkTrVoteForBp(model) {
    BlockchainHelper._checkCommonTrTracesFields(model);
    expect(model.memo).toBe('');
    expect(model.tr_type).toBe(BlockchainTrTypesDictionary.getTypeVoteForBp());

    expect(Array.isArray(model.producers)).toBeTruthy();

  }
  /**
   *
   * @param {Object} model
   * @private
   */
  static _getTypeEmission(model) {
    BlockchainHelper._checkCommonTrTracesFields(model);

    expect(model.memo).toBe('');
    expect(model.tr_type).toBe(BlockchainTrTypesDictionary.getTypeClaimEmission());

    expect(model.tokens).toBeDefined();
    expect(model.tokens.emission).toBeGreaterThan(0);
    expect(model.tokens.currency).toBe('UOS');
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
    expect(model.raw_tr_data.block_data).toBeDefined();
    expect(Object.keys(model.raw_tr_data.block_data).length).toBe(7);
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

    const expected = BlockchainModelProvider.getFieldsForPreview().concat(
      BlockchainModelProvider.getModel().getPostProcessingFields()
    );

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
    expect(model.votes_percentage).toBeDefined();
    expect(typeof model.votes_percentage).toBe('number');

    if (isMyselfDataRequired) {
      expect(model.myselfData).toBeDefined();
      expect(model.myselfData.bp_vote).toBeDefined();
      expect(typeof model.myselfData.bp_vote).toBe('boolean');
    }
  }
}

module.exports = BlockchainHelper;