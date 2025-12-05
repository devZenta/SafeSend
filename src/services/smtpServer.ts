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
  BASE_PATH: string;
  sendMail: SendMailService;
  tokenStore: TokenStoreService;
  randomBytes: RandomBytesService;
  log: LogService;
};

async function initSmtpServer({
  SMTP_OPTIONS,
  BASE_URL,
  BASE_PATH,
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

        if (!toAddress.endsWith(`@${SMTP_OPTIONS.domain}`)) {
          log(
            'warning',
            `💌 - Rejected mail from ${fromAddress} to ${toAddress} (session: ${session.id}).`,
          );

          return callback(
            Object.assign(new Error('Relay denied'), { responseCode: 553 }),
          );
        }

        log(
          'warning',
          `💌 - Proxying mail from ${fromAddress} to ${toAddress} (session: ${session.id}).`,
        );

        const token = toAddress.split('@')[0].includes('+')
          ? toAddress.split('@')[0].split('+').pop()
          : undefined;

        if (!token) {
          log(
            'warning',
            `💌 - Rejected mail from ${fromAddress} since no token (session: ${session.id}).`,
          );

          const knockEmail = `${toAddress.split('@')[0]}+knock@${toAddress.split('@')[1]}`;

          await sendMail({
            from: toAddress,
            to: fromAddress,
            subject: 'Protected mailbox',
            headers: { 'X-SafeSend-Challenge': knockEmail },
            text: `Hi!

This mailbox is protected by SafeSend, to send emails to it,
 you first need to send a knock email to: ${knockEmail}

Below is a copy of your original email:
Subject: ${subject},
Content:
${text}
            `,
          });
          return callback();
        }

        if (token === 'knock') {
          const newToken = (await randomBytes(32)).toString('hex');

          await tokenStore.set(newToken, {
            pattern: fromAddress,
            validated: false,
          });

          const knockLink = `${BASE_URL}${BASE_PATH}/knock/${newToken}/validation?from=${encodeURIComponent(
            fromAddress,
          )}&to=${encodeURIComponent(toAddress)}`;

          await sendMail({
            from: fromAddress,
            to: toAddress,
            subject: "Someone's knocking",
            headers: { 'X-SafeSend-KnockUrl': knockLink },
            text: `Hi! Someone is knocking, to allow it to send email, click on the link: ${knockLink}`,
          });

          log(
            'warning',
            `💌 - Knock email sent to ${toAddress} (session: ${session.id}).`,
          );

          return callback();
        }

        const tokenPayload = await tokenStore.get(token);

        if (!tokenPayload) {
          log(
            'warning',
            `💌 - Rejected mail from ${fromAddress} due to invalid token (session: ${session.id}).`,
          );
          return callback(
            Object.assign(new Error('Invalid token'), {
              responseCode: 553,
            }),
          );
        }

        if (!tokenPayload.validated) {
          log(
            'warning',
            `💌 - Rejected mail from ${fromAddress} due to unvalidated token (session: ${session.id}).`,
          );
          return callback(
            Object.assign(new Error('Token not validated'), {
              responseCode: 553,
            }),
          );
        }

        if (tokenPayload.pattern !== fromAddress) {
          log(
            'warning',
            `💌 - Rejected mail from ${fromAddress} due to pattern mismatch (session: ${session.id}).`,
          );
          return callback(
            Object.assign(
              new Error('Email address does not match token pattern'),
              {
                responseCode: 553,
              },
            ),
          );
        }
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
