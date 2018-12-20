declare class UsersActivityRepository {
  public findOnlyItselfById(id: number): Promise<Object>;
  public findOneWithPostById(id: number): Promise<activityWithContentEntity | null>;
}
