import { autoService, location } from 'knifecycle';
import {
  type WhookRouteDefinition,
  type WhookRouteTypedHandler,
} from '@whook/whook';
import { LogService } from 'common-services';
import { RandomBytesService } from '../services/randomBytes.js';
import { TokenStoreService } from '../services/tokenStore.js';

export const definition = {
  path: '/tokens',
  method: 'post',
  operation: {
    operationId: 'postToken',
    summary: 'Create a token for a given pattern',
    tags: ['system'],
    parameters: [],
    security: [
      {
        bearerAuth: ['admin'],
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['pattern'],
            properties: {
              pattern: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Success',
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

export type HandlerDependencies = {
  log: LogService;
  randomBytes: RandomBytesService;
  tokenStore: TokenStoreService;
};

async function initPostToken({
  log,
  randomBytes,
  tokenStore,
}: HandlerDependencies) {
  const handler: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({ body }) => {
    const newToken = (await randomBytes(32)).toString('hex');

    await tokenStore.set(newToken, {
      pattern: body.pattern,
      status: 'validated',
    });
    return {
      status: 200,
      headers: {},
      body: { token: newToken },
    };
  };

  return handler;
}

export default location(autoService(initPostToken), import.meta.url);
