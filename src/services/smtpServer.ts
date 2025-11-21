import { autoProvider, location, type Provider } from 'knifecycle';
import { type LogService } from 'common-services';
import { SMTPServer } from 'smtp-server';
import { SendMailService } from './sendMail.js';

export type SmtpServerService = InstanceType<typeof SMTPServer>;
export type SmtpServerOptions = {
  port: number;
  host: string;
  domain: string;
};
export type SmtpServerConfig = {
  SMTP_OPTIONS: SmtpServerOptions;
};
export type SmtpServerDependencies = SmtpServerConfig & {
  sendMail: SendMailService;
  log: LogService;
};

async function initSmtpServer({
  SMTP_OPTIONS,
  sendMail,
  log,
}: SmtpServerDependencies): Promise<Provider<SmtpServerService>> {
  log('warning', '➕ - Starting the SMTP server.');
  const server = new SMTPServer({
    authOptional: true,
    async onMailFrom(address, session, callback) {
      log(
        'warning',
        `💌 - Received mail from ${address.address} (session: ${session.id}).`,
      );

      if (!address.address.endsWith(`@${SMTP_OPTIONS.domain}`)) {
        log(
          'warning',
          `💌 - Rejected mail from ${address.address} (session: ${session.id}).`,
        );
        return callback(
          Object.assign(new Error('Relay denied'), { responseCode: 553 }),
        );
      }

      await sendMail({
        to: 'text@xp.com',
        subject: 'a mail',
        text: 'we received a mail',
      });
      log(
        'warning',
        `💌 - Proxyed mail from ${address.address} (session: ${session.id}).`,
      );

      callback();
    },
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(SMTP_OPTIONS.port, SMTP_OPTIONS.host, () => {
      resolve();
    });
  });

  const fatalErrorPromise = new Promise<void>((_resolve, reject) => {
    server.on('error', (err) => {
      reject(err);
    });
  });

  return {
    service: server,
    fatalErrorPromise,
    dispose: async () => {
      new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
    },
  };
}

export default location(autoProvider(initSmtpServer), import.meta.url);
