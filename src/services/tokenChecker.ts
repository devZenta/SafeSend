import { autoService, location } from 'knifecycle';
import { type LogService } from 'common-services';

export type TokenCheckerService = {
  check(token: string): Promise<boolean>;
};
export type TokenCheckerDependencies = {
  log: LogService;
};

async function initTokenChecker({
  log,
}: TokenCheckerDependencies): Promise<TokenCheckerService> {
  return {
    async check(token) {
      return token === 'token';
    },
  };
}

export default location(autoService(initTokenChecker), import.meta.url);
