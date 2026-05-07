import { createMailTransport, getFromAddress } from './smtp.js';

function joinAddresses(list) {
  if (!list?.length) return undefined;
  return list.join(', ');
}

export async function sendMailMessage(config, options) {
  const transport = createMailTransport(config);
  const { to, cc, bcc, subject, text, attachments } = options;

  await transport.sendMail({
    from: getFromAddress(config),
    to: joinAddresses(to),
    cc: joinAddresses(cc),
    bcc: joinAddresses(bcc),
    subject,
    text,
    attachments: attachments?.length ? attachments : undefined
  });
}
