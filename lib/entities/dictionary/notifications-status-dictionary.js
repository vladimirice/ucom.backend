const STATUS__CONFIRMED                 = 1;
const STATUS__DECLINED                  = 2;
const STATUS__NOT_REQUIRED_CONFIRMATION = 3;

class NotificationsStatusDictionary {

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

module.exports= NotificationsStatusDictionary;