const ENV__TEST       = 'test';
const ENV__STAGING    = 'staging';
const ENV__PRODUCTION = 'production';

class EnvHelper {
  public static getNodeEnv(): string | undefined {
    return process.env.NODE_ENV;
  }

  public static isTestEnv(): boolean {
    return this.isExpectedEnv(ENV__TEST);
  }

  public static isStagingEnv(): boolean {
    return this.isExpectedEnv(ENV__STAGING);
  }

  public static isProductionEnv(): boolean {
    return this.isExpectedEnv(ENV__PRODUCTION);
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
