import nodemailer from 'nodemailer';

let cached;

/**
 * Custom SMTP if SMTP_HOST set; otherwise Gmail via EMAIL_USER/PASS.
 */
export function createMailTransport(config) {
  if (cached) return cached;

  const host = config.SMTP_HOST?.trim();
  if (host) {
    cached = nodemailer.createTransport({
      host,
      port: config.SMTP_PORT ?? 587,
      secure: Boolean(config.SMTP_SECURE),
      auth:
        config.SMTP_USER && config.SMTP_PASS
          ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
          : undefined
    });
    return cached;
  }

  cached = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS
    }
  });
  return cached;
}

export function getFromAddress(config) {
  return config.SMTP_FROM?.trim() || config.EMAIL_USER;
}
