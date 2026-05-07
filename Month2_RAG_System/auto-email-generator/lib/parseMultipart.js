import formidable from 'formidable';
import fs from 'fs/promises';

export async function parseMultipartRequest(req) {
  const form = formidable({
    multiples: true,
    maxFileSize: 12 * 1024 * 1024,
    maxFiles: 5
  });

  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, f, fileObj) => {
      if (err) reject(err);
      else resolve([f, fileObj]);
    });
  });

  const pick = (name) => {
    const v = fields[name];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const fileEntries = [];
  for (const val of Object.values(files)) {
    if (Array.isArray(val)) fileEntries.push(...val.filter(Boolean));
    else if (val) fileEntries.push(val);
  }

  const attachmentList = [];
  for (const f of fileEntries) {
    if (!f?.filepath) continue;
    const buf = await fs.readFile(f.filepath);
    attachmentList.push({
      filename: f.originalFilename || 'attachment',
      content: buf
    });
    await fs.unlink(f.filepath).catch(() => {});
  }

  return {
    fields: {
      to: pick('to') || '',
      cc: pick('cc') || '',
      bcc: pick('bcc') || '',
      subject: pick('subject') || '',
      prompt: pick('prompt') || '',
      body: pick('body') || '',
      templateId: pick('templateId') || '',
      scheduleAt: pick('scheduleAt') || ''
    },
    attachments: attachmentList
  };
}
