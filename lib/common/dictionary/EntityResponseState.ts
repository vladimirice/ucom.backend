const STATE__FULL         = 'full';
const STATE__LIST         = 'list';
const STATE__NOTIFICATION = 'notification';
const STATE__CARD         = 'card';

class EntityResponseState {
  public static full(): string {
    return STATE__FULL;
  }

  public static list(): string {
    return STATE__LIST;
  }

  public static notification(): string {
    return STATE__NOTIFICATION;
  }

  public static card(): string {
    return STATE__CARD;
  }
}

export = EntityResponseState;
