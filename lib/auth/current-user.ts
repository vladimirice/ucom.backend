import { UserModel } from '../users/interfaces/model-interfaces';
import { AppError } from '../api/errors';

class CurrentUser {
  private user: UserModel | null = null;

  private id: number | null = null;

  /**
   *
   * @param {Object} value
   */
  setCurrentUser(value): void {
    this.user = value;
    this.setCurrentUserId(value.id);
  }

  setCurrentUserId(value: number): void {
    this.id = value;
  }

  isCurrentUser(): boolean {
    return !!this.id;
  }

  getUser(): UserModel | null {
    return this.user;
  }

  getUserOrException(): UserModel {
    if (!this.user) {
      throw new AppError('User must be defined or AuthMiddleware should be used beforehand');
    }

    return this.user;
  }

  getId(): number | null {
    return this.id;
  }

  getCurrentUserId(): number | null {
    return this.id;
  }

  getCurrentUserIdOrException(): number {
    const currentUser = this.getUserOrException();

    return currentUser.id;
  }
}

export = CurrentUser;
