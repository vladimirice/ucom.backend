const MongodbTrTracesRepository = require('../repository/mongodb-tr-traces-repository');

class BlockchainTrTracesService {
  static async getTransferTransactions(limit = null, idFrom = null) {
    await MongodbTrTracesRepository.getTransferTransactions();
  }
}

module.exports = BlockchainTrTracesService;