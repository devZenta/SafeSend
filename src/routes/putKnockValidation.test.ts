import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPutKnockValidation from './putKnockValidation.js';
import { type LogService } from 'common-services';
import type { TokenStoreService } from '../services/tokenStore.js';

describe('putKnockValidation', () => {
  const log = jest.fn<LogService>();
  const tokenStore: jest.Mocked<TokenStoreService> = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    log.mockReset();
    tokenStore.get.mockReset();
    tokenStore.set.mockReset();
  });

  test('should validate an existing knock', async () => {
    tokenStore.get.mockResolvedValue({
      pattern: 'test@example.com',
      validated: false,
    });

    const putKnockValidation = await initPutKnockValidation({
      log,
      tokenStore,
    });

    const response = await putKnockValidation({
      path: { knockId: 'rtt' },
      body: {},
    });

    expect(response).toEqual({
      status: 201,
      headers: {},
      body: {},
    });

    expect(tokenStore.set).toHaveBeenCalledWith('rtt', {
      pattern: 'test@example.com',
      validated: true,
    });

    expect(log.mock.calls).toEqual([['warning', '📢 - Validated knock: rtt!']]);
  });

  test('should throw if knock does not exist', async () => {
    tokenStore.get.mockResolvedValue(undefined);

    const putKnockValidation = await initPutKnockValidation({
      log,
      tokenStore,
    });

    await expect(
      putKnockValidation({
        path: { knockId: 'unknown' },
        body: {},
      }),
    ).rejects.toThrow('E_UNKNOWN_KNOCK');

    expect(log.mock.calls).toEqual([
      ['warning', '❗ - Cannot validate knock: unknown!'],
    ]);
  });
});
