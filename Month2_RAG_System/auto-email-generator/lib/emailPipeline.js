import { generateEmailBody } from './llm.js';
import { sendMailMessage } from './mailDelivery.js';
import {
  initDb,
  recordEmailHistory,
  ScheduledEmail,
  isDbConfigured
} from './db.js';
import { logError } from './logger.js';

function parseScheduleDate(raw) {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid schedule date/time');
  }
  return d;
}

export async function runSendFlow({ config, data, attachments = [] }) {
  const scheduleAt = parseScheduleDate(data.scheduleAt);
  let bodyText = data.body;

  if (!bodyText) {
    bodyText = await generateEmailBody(data.prompt, config);
  }

  const recipients = data.to.join(', ');
  const cc = data.cc?.length ? data.cc.join(', ') : null;
  const bcc = data.bcc?.length ? data.bcc.join(', ') : null;

  const baseRow = {
    recipients,
    cc,
    bcc,
    subject: data.subject,
    prompt: data.prompt || '',
    body: bodyText,
    template_id: data.templateId ?? null
  };

  if (scheduleAt) {
    if (scheduleAt <= new Date()) {
      throw new Error('Schedule time must be in the future');
    }
    if (attachments.length > 0) {
      throw new Error(
        'Attachments are not supported for scheduled sends; send now or schedule without files'
      );
    }
    if (!isDbConfigured() || !ScheduledEmail) {
      throw new Error('Database is required for scheduling');
    }
    await initDb();
    await ScheduledEmail.create({
      recipients,
      cc,
      bcc,
      subject: data.subject,
      prompt: data.prompt || null,
      body: bodyText,
      send_at: scheduleAt,
      status: 'pending',
      template_id: data.templateId ?? null,
      attachment_meta: null
    });
    return { success: true, scheduled: true, sendAt: scheduleAt.toISOString() };
  }

  try {
    await sendMailMessage(config, {
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      text: bodyText,
      attachments
    });
    await recordEmailHistory({
      ...baseRow,
      status: 'sent',
      error_message: null
    });
    return { success: true, message: 'Email sent successfully' };
  } catch (err) {
    logError('smtp.send', err, { subject: data.subject });
    try {
      await recordEmailHistory({
        ...baseRow,
        status: 'failed',
        error_message: err.message || 'Send failed'
      });
    } catch (e) {
      logError('history.failed', e);
    }
    throw err;
  }
}
