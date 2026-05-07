export function extractPlaceholders(template) {
  const re = /\{\{\s*(\w+)\s*\}\}/g;
  const keys = new Set();
  let m;
  while ((m = re.exec(template)) !== null) {
    keys.add(m[1]);
  }
  return [...keys];
}

export function applyTemplate(template, values) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = values[key];
    return v != null && String(v).trim() !== '' ? String(v) : `{{${key}}}`;
  });
}
