import { noop } from '@whook/whook';

import { type LogService } from 'common-services';
import { autoService, location } from 'knifecycle';
import { type SendMailOptions, createTransport } from 'nodemailer';
import { type JsonObject } from 'type-fest';
import { YError } from 'yerror';

export type SendMailEnvVars = {
  SMTP_CONNECTION_URL: string;
};
export type SendMailDependencies = {
  ENV: SendMailEnvVars;
  log: LogService;
};
export type SendMailService = (options: SendMailOptions) => Promise<void>;

async function initSendMail({
  ENV,
  log = noop,
}: SendMailDependencies): Promise<SendMailService> {
  const transporter = createTransport({
    host: new URL(ENV.SMTP_CONNECTION_URL).hostname,
    port: parseInt(new URL(ENV.SMTP_CONNECTION_URL).port, 10),
    secure: false, // upgrade later with STARTTLS
    tls: { rejectUnauthorized: false },
  });

  log('warning', `✉️ - Initializing the send mail service (via SMTP)!`);

  return async (options): Promise<void> => {
    try {
      log('debug', `✉️ - Sending an email:`, options as JsonObject);
      await transporter.sendMail(options);
    } catch (err) {
      throw YError.wrap(err as Error, 'E_SEND_MAIL', options);
    }
  };
}

export default location(autoService(initSendMail), import.meta.url);
