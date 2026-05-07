import { Op } from 'sequelize';
import { initDb, ScheduledEmail, recordEmailHistory } from './db.js';
import { sendMailMessage } from './mailDelivery.js';
import { logError } from './logger.js';

function splitAddresses(s) {
  if (!s?.trim()) return [];
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function processDueScheduledEmails(config) {
  if (!ScheduledEmail) return { processed: 0 };
  await initDb();
  const rows = await ScheduledEmail.findAll({
    where: {
      status: 'pending',
      send_at: { [Op.lte]: new Date() }
    },
    limit: 50,
    order: [['send_at', 'ASC']]
  });

  let processed = 0;
  for (const row of rows) {
    const to = splitAddresses(row.recipients);
    const cc = splitAddresses(row.cc);
    const bcc = splitAddresses(row.bcc);
    try {
      await sendMailMessage(config, {
        to,
        cc,
        bcc,
        subject: row.subject,
        text: row.body,
        attachments: []
      });
      row.status = 'sent';
      await row.save();
      await recordEmailHistory({
        recipients: row.recipients,
        cc: row.cc,
        bcc: row.bcc,
        subject: row.subject,
        prompt: row.prompt || '',
        body: row.body,
        status: 'sent',
        error_message: null,
        template_id: row.template_id
      });
      processed += 1;
    } catch (err) {
      logError('scheduled.send', err, { id: row.id });
      row.status = 'failed';
      row.error_message = err.message || 'Send failed';
      await row.save();
    }
  }

  return { processed };
}
