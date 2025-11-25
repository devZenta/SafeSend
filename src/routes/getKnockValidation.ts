import { autoService, location } from 'knifecycle';
import {
  type WhookRouteDefinition,
  type WhookRouteTypedHandler,
} from '@whook/whook';
import { type LogService } from 'common-services';
import initPutKnockValidation, {
  definition as baseDefinition,
} from './putKnockValidation.js';

export const definition = {
  path: '/knock/{knockId}/validation',
  method: 'get',
  operation: {
    operationId: 'getKnockValidation',
    summary: 'Allow to validate a knock with a link',
    tags: ['system'],
    parameters: [
      ...baseDefinition.operation.parameters,
      {
        name: 'from',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'email' },
      },
      {
        name: 'to',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'email' },
      },
    ],
    responses: {
      201: {
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

async function initGetKnockValidation({
  log,
  putKnockValidation,
}: {
  log: LogService;
  putKnockValidation: Awaited<ReturnType<typeof initPutKnockValidation>>;
}) {
  const handler: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({ path: { knockId }, query: { from, to } }) => {
    return putKnockValidation({ path: { knockId }, body: { from, to } });
  };

  return handler;
}

export default location(autoService(initGetKnockValidation), import.meta.url);
