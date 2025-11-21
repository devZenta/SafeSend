import { location, autoService } from 'knifecycle';
import { type LogService } from 'common-services';
import { type AppEnvVars } from 'application-services';
import {
  type WhookCommandHandler,
  type WhookCommandDefinition,
} from '@whook/whook';
import { SendMailService } from '../services/sendMail.js';

export const definition = {
  name: 'sendMail',
  description: 'A command to send mails',
  example: `whook sendMail --keysOnly`,
  arguments: [
    {
      name: 'recipient',
      description: 'The mail recipient',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'subject',
      description: 'The mail subject',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'message',
      description: 'The mail message',
      schema: {
        type: 'string',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

/* Architecture Note #5.2: Implementation

To implement a command, just write a function that takes
 injected services as a first argument and return the
 command as an asynchronous function.
*/
async function initsendMailCommand({
  sendMail,
  log,
}: {
  sendMail: SendMailService;
  log: LogService;
}): Promise<
  WhookCommandHandler<{
    recipient: string;
    subject: string;
    message: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { recipient, subject, message },
    } = args;

    await sendMail({
      to: recipient,
      subject,
      text: message,
    });

    log('info', `✅ - Mail sent!`);
  };
}

export default location(autoService(initsendMailCommand), import.meta.url);
