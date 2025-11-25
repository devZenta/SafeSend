import { autoProvider, location, type Provider } from 'knifecycle';
import { type LogService } from 'common-services';
import { SMTPServer } from 'smtp-server';
import EmlParser from 'eml-parser';
import { type SendMailService } from './sendMail.js';
import { type TokenStoreService } from './tokenStore.js';
import { type RandomBytesService } from './randomBytes.js';

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
  BASE_URL: string;
  sendMail: SendMailService;
  tokenStore: TokenStoreService;
  randomBytes: RandomBytesService;
  log: LogService;
};

async function initSmtpServer({
  SMTP_OPTIONS,
  BASE_URL,
  sendMail,
  tokenStore,
  randomBytes,
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

      log(
        'warning',
        `💌 - Proxyed mail from ${address.address} (session: ${session.id}).`,
      );

      callback();
    },
    async onData(stream, session, callback) {
      try {
        log('warning', `📧 - Parsing email data (session: ${session.id}).`);

        const result = await new EmlParser(stream).parseEml();

        log(
          'warning',
          `📧 - Email parsed successfully (session: ${session.id}).`,
        );

        const fromAddress =
          result.from?.value?.[0]?.address ||
          result.from?.text ||
          'unknown@example.com';
        const toAddress =
          result.to?.value?.[0]?.address ||
          result.to?.text ||
          'unknown@example.com';
        const subject = result.subject || 'No subject';
        const text = result.text || 'No content';

        log(
          'warning',
          `📧 - Email details: from=${fromAddress}, to=${toAddress}, subject=${subject} (session: ${session.id}).`,
        );

        const token = toAddress.split('@')[0].split('+').pop();

        if (!token) {
          log(
            'warning',
            `💌 - Rejected mail from ${fromAddress} since no token (session: ${session.id}).`,
          );
          return callback(
            Object.assign(new Error('Relay denied'), { responseCode: 553 }),
          );
        }

        if (token === 'knock') {
          // Generate a random token
          // Save it to the token store with validated set to false
          // Build the link to validate it
          const knockLink = ``;
          await sendMail({
            from: fromAddress,
            to: toAddress,
            subject: "Someone's knocking",
            text: `Hi! Someone is knocking, to allow it to send email, click on the link: ${knockLink}`,
          });

          log(
            'warning',
            `💌 - Knock email sent to ${toAddress} (session: ${session.id}).`,
          );

          callback();
        }

        // Check the token and the email pattern

        await sendMail({
          from: fromAddress,
          to: toAddress,
          subject: subject,
          text: text,
        });

        log(
          'warning',
          `💌 - Email forwarded to ${toAddress} (session: ${session.id}).`,
        );

        callback();
      } catch (err) {
        log(
          'error',
          `❌ - Error parsing email (session: ${session.id}): ${err}`,
        );
        callback(err as Error);
      }
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
