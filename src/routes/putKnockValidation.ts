import { autoService, location } from 'knifecycle';
import {
  type WhookRouteDefinition,
  type WhookRouteTypedHandler,
} from '@whook/whook';
import { type LogService } from 'common-services';

import type {
  TokenStoreService,
  TokenPayload,
} from '../services/tokenStore.js';
import { YHTTPError } from 'yhttperror';
import { type SendMailService } from '../services/sendMail.js';

export const definition = {
  path: '/knock/{knockId}/validation',
  method: 'put',
  operation: {
    operationId: 'putKnockValidation',
    summary: 'Allow to validate knock.',
    tags: ['system'],
    parameters: [
      {
        name: 'knockId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: false,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Successfully validated',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initPutKnockValidation({
  log,
  tokenStore,
  sendMail,
}: {
  log: LogService;
  tokenStore: TokenStoreService;
  sendMail: SendMailService;
}) {
  const handler: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({ path: { knockId }, body }) => {
    const payload = await tokenStore.get(knockId);

    if (!payload) {
      log('warning', `❗ - Cannot validate knock: ${knockId}!`);
      throw new YHTTPError(404, 'E_UNKNOWN_KNOCK', knockId);
    }

    if (payload.status !== 'requested') {
      log('warning', `❗ - Cannot validate knock: ${knockId}!`);
      throw new YHTTPError(404, 'E_UNKNOWN_KNOCK', knockId);
    }

    const updatedPayload: TokenPayload = {
      pattern: payload.pattern,
      status: 'validated',
    };

    await tokenStore.set(knockId, updatedPayload);

    log('warning', `📢 - Validated knock: ${knockId}!`);

    await sendMail({
      from: 'postmaster@safesend.com',
      to: payload.from,
      subject: 'Your knock has been validated!',
      text: `You can send mail with : ${payload.from.split('@')[0].split('+')[0]}+${knockId}@${payload.from.split('@')[1]}`,
    });

    return {
      status: 201,
      headers: {},
      body: {},
    };
  };

  return handler;
}

export default location(autoService(initPutKnockValidation), import.meta.url);
