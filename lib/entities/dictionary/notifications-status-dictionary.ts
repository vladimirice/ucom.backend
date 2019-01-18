const STATUS__CONFIRMED                 = 1;
const STATUS__DECLINED                  = 2;

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

export = NotificationsStatusDictionary;
