class IpfsApi {
  static async addFileToIpfs(content) {
    return [
      {
        path: 'QmZY43MX85ThZwJjD6kDrkzTdVyQjDh52phh2MgWZDQoJ7',
        hash: 'QmZY43MX85ThZwJjD6kDrkzTdVyQjDh52phh2MgWZDQoJ7',
        size: 39
      }
    ];
  }

  static async getFileFromIpfs(hash) {
    throw new Error('This mock is not implemented yet');
  }
}

module.exports = IpfsApi;