import { autoService, location } from 'knifecycle';
import {
  type WhookRouteDefinition,
  type WhookRouteTypedHandler,
} from '@whook/whook';
import { type LogService } from 'common-services';


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
        schema: { type: 'string'},
      },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
          },
        },
      },
    },
    responses: {
      200: {
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

export type HandlerDependencies = {
  log: LogService;
};

async function initPutKnockValidation({
  log,
}: HandlerDependencies) {
  const handler: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({
    path: { knockId },
    body,
  }) => {
    log ("warning", `Validated the email: ${knockId}`)
    return {
      status: 200,
      headers: {},
      body: {},
    };
  };

  return handler;
}

export default location(
  autoService(initPutKnockValidation),
  import.meta.url,
);