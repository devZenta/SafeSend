import { autoService, location } from 'knifecycle';
import { type LogService } from 'common-services';
import { writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type TokenPayload = {
  pattern: string;
} & (
  | {
      status: 'validated';
    }
  | {
      status: 'requested';
      from: string;
    }
);
export type TokenStoreService = {
  set(token: string, payload: TokenPayload): Promise<void>;
  get(token: string): Promise<TokenPayload | undefined>;
};
export type TokenStoreDependencies = {
  log: LogService;
};

async function initTokenStore({
  log,
}: TokenStoreDependencies): Promise<TokenStoreService> {
  const storePath = join(tmpdir(), 'token_store.json');

  return {
    async get(token) {
      try {
        const store = JSON.parse(
          (await readFile(storePath)).toString(),
        ) as Record<string, TokenPayload>;

        return store[token];
      } catch {
        return;
      }
    },
    async set(token, payload) {
      let store: Record<string, TokenPayload> = {};

      try {
        store = JSON.parse((await readFile(storePath)).toString()) as Record<
          string,
          TokenPayload
        >;
      } catch {
        // Do nothing
      }

      store[token] = payload;

      await writeFile(storePath, JSON.stringify(store));
    },
  };
}

export default location(autoService(initTokenStore), import.meta.url);
