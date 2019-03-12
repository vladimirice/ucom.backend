const ENV__TEST = 'test';

class EnvHelper {
  public static isTestEnv(): boolean {
    return this.isExpectedEnv(ENV__TEST);
  }

  public static isNotTestEnv(): boolean {
    return this.isNotExpectedEnv(ENV__TEST);
  }

  private static isExpectedEnv(env: string): boolean {
    return process.env.NODE_ENV === env;
  }

  private static isNotExpectedEnv(env: string): boolean {
    return process.env.NODE_ENV !== env;
  }
}

export = EnvHelper;
