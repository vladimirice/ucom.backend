const STATUS__PENDING   = 0;
const STATUS__CONFIRMED = 1;
const STATUS__DECLINED  = 2;

class UsersTeamStatusDictionary {
  /**
   *
   * @return {number}
   */
  static getStatusPending() {
    return STATUS__PENDING
  }

  /**
   *
   * @return {number}
   */
  static getStatusConfirmed() {
    return STATUS__CONFIRMED;
  }

  /**
   *
   * @return {number}
   */
  static getStatusDeclined() {
    return STATUS__DECLINED;
  }
}

module.exports= UsersTeamStatusDictionary;