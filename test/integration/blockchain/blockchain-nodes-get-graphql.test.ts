import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlHelper } from '../helpers/graphql-helper';

import SeedsHelper = require('../helpers/seeds-helper');

let userVlad: UserModel;

const JEST_TIMEOUT = 10000;

const options = {
  isGraphQl: true,
  workersMocking: 'all',
};

function getSampleNodes() {
  const bpNodes: any[] = [];
  const calcNodes: any[] = [];

  for (let i = 1; i <= 12; i += 1) {
    bpNodes.push({
      id: i,
      title: `bp_node_${i}`,
      votes_count: i * 5,
      votes_amount: i * 10003509,
      currency: 'UOS',
      bp_status: i % 2 === 0 ? 1 : 2,
      blockchain_nodes_type: 1,
      myselfData: {
        bp_vote: i % 2 === 0,
      },
      votes_percentage: 23.81 + i * 4,
    });
  }
  for (let i = 13; i <= 21; i += 1) {
    calcNodes.push({
      id: i,
      title: `calc_node_${i}`,
      votes_count: i * 5,
      votes_amount: i * 10003509,
      currency: 'importance',
      bp_status: i % 2 === 0 ? 1 : 2,
      blockchain_nodes_type: 2,
      myselfData: {
        bp_vote: i % 2 === 0,
      },
      votes_percentage: 23.81 + i * 2,
    });
  }

  return {
    1: {
      data: bpNodes,
      metadata: {
        has_more: true,
        page: 1,
        per_page: 10,
        total_amount: 12,
      },
    },
    2: {
      data: calcNodes,
      metadata: {
        has_more: false,
        page: 1,
        per_page: 10,
        total_amount: 8,
      },
    },
  };
}

describe('Blockchain nodes get - graphql', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(options); });
  afterAll(async () => { await SeedsHelper.doAfterAll(options); });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('Test trending - only test for graphql client error', async () => {
      const ordering = '-bp_status';
      const page = 1;
      const perPage = 10;

      const response = await GraphqlHelper.getManyBlockchainNodesAsMyself(userVlad, ordering, page, perPage);

      expect(response).toEqual(getSampleNodes());
    }, JEST_TIMEOUT);
  });
});

export {};
