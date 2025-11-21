import { autoProvider, location, type Provider } from 'knifecycle';
import { type LogService } from 'common-services';
import { SMTPServer } from 'smtp-server';

export type SmtpServerService = InstanceType<typeof SMTPServer>;
export type SmtpServerOptions = {
  port: number;
  host: string;
};
export type SmtpServerConfig = {
  SMTP_OPTIONS: SmtpServerOptions;
};
export type SmtpServerDependencies = SmtpServerConfig & {
  log: LogService;
};

async function initSmtpServer({
  SMTP_OPTIONS,
  log,
}: SmtpServerDependencies): Promise<Provider<SmtpServerService>> {
  log('warning', '➕ - Starting the SMTP server.');
  const server = new SMTPServer({
    authOptional: true,
    onMailFrom(address, session, callback) {
      log('warning', `💌 - Received mail from ${address}, $session`);

      // if (!address.address.endsWith('@example.com')) {
      //   return cb(
      //     Object.assign(new Error('Relay denied'), { responseCode: 553 }),
      //   );
      // }
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
