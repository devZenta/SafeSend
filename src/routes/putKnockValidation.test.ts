import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPutKnockValidation from './putKnockValidation.js';
import streamtest from 'streamtest';
import { type LogService } from 'common-services';

describe('putKnockValidation', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work', async () => {
    const putKnockValidation = await initPutKnockValidation({
      log,
    });
    const response = await putKnockValidation({
      path: {
        knockId: 'rtt',
      },
      body: {},
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "warning",
      "📢 - Validated knock: rtt!",
    ],
  ],
  "response": {
    "body": {},
    "headers": {},
    "status": 200,
  },
}
`);
  });
});
