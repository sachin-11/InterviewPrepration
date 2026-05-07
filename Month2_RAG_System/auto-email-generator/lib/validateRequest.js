import { z } from 'zod';

function toAddressArray(v) {
  if (Array.isArray(v)) {
    return v.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof v === 'string') {
    return v
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
  }
  return [];
}

export function coerceSendPayload(raw) {
  const tid = raw.templateId;
  const templateIdNum =
    tid === '' || tid === undefined || tid === null
      ? undefined
      : Number(tid);
  return {
    to: toAddressArray(raw.to),
    cc: toAddressArray(raw.cc),
    bcc: toAddressArray(raw.bcc),
    subject: raw.subject ?? '',
    prompt: raw.prompt,
    body: raw.body,
    templateId: Number.isFinite(templateIdNum) ? templateIdNum : undefined,
    scheduleAt: raw.scheduleAt
  };
}

export const previewBodySchema = z.object({
  subject: z.string().max(200).optional(),
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(8000)
    .transform((s) => s.trim())
});

export const sendEmailJsonSchema = z
  .object({
    to: z
      .array(z.string().email('Invalid email in To'))
      .min(1, 'At least one To address is required')
      .max(20),
    cc: z.array(z.string().email('Invalid email in CC')).max(20).default([]),
    bcc: z.array(z.string().email('Invalid email in BCC')).max(20).default([]),
    subject: z
      .string()
      .min(1, 'Subject is required')
      .max(200)
      .transform((s) => s.trim()),
    prompt: z
      .string()
      .max(8000)
      .optional()
      .transform((s) => (s == null || s === '' ? undefined : s.trim())),
    body: z
      .string()
      .max(50_000)
      .optional()
      .transform((s) => (s == null || s === '' ? undefined : s.trim())),
    templateId: z.coerce.number().int().positive().optional(),
    scheduleAt: z.string().optional()
  })
  .superRefine((data, ctx) => {
    const hasBody = Boolean(data.body?.length);
    const hasPrompt = Boolean(data.prompt?.length);
    if (!hasBody && !hasPrompt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Provide either a prompt (to generate) or a body (to send as-is)',
        path: ['prompt']
      });
    }
  });

export function parsePreviewBody(body) {
  return previewBodySchema.safeParse(body);
}

export function parseSendJson(body) {
  return sendEmailJsonSchema.safeParse(coerceSendPayload(body));
}
