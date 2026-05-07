import { z } from 'zod';

const optionalNonEmpty = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().min(1).optional()
);

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  GROQ_MODEL: optionalNonEmpty,
  EMAIL_USER: z.string().email('EMAIL_USER must be a valid email'),
  EMAIL_PASS: z.string().min(1, 'EMAIL_PASS is required'),
  DATABASE_URL: optionalNonEmpty,
  INTERNAL_API_KEY: optionalNonEmpty,
  APP_PASSWORD: optionalNonEmpty,
  SESSION_SECRET: optionalNonEmpty,
  CRON_SECRET: optionalNonEmpty,
  SMTP_HOST: optionalNonEmpty,
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .preprocess((v) => {
      if (v === 'true' || v === '1') return true;
      if (v === 'false' || v === '0') return false;
      return v;
    }, z.boolean().optional()),
  SMTP_USER: optionalNonEmpty,
  SMTP_PASS: optionalNonEmpty,
  SMTP_FROM: optionalNonEmpty,
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(3_600_000)
});

let cached;

export function getConfig() {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`);
  }
  const data = parsed.data;
  if (data.NODE_ENV === 'production' && !data.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when NODE_ENV=production');
  }
  if (data.APP_PASSWORD && (!data.SESSION_SECRET || data.SESSION_SECRET.length < 32)) {
    throw new Error(
      'SESSION_SECRET is required (32+ characters) when APP_PASSWORD is set'
    );
  }
  cached = data;
  return cached;
}

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function clientSafeError(_error, fallback = 'Something went wrong') {
  return isProduction() ? fallback : _error?.message || fallback;
}
