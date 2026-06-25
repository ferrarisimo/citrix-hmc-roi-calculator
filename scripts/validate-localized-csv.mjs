import fs from 'node:fs';
import path from 'node:path';

const datasets = [
  { name: 'xenserver', base: 'public/data/xenserver/scl.csv', i18n: 'public/data/xenserver/scl.i18n', required: ['category_label', 'regulatory_status_label', 'short_description', 'compatibility_rationale', 'evidence_summary'] },
  { name: 'elux', base: 'public/data/elux/hcl.csv', i18n: 'public/data/elux/hcl.i18n', required: ['notes'], allowEmpty: ['notes'] },
  { name: 'netscaler', base: 'public/data/netscaler/features.csv', i18n: 'public/data/netscaler/features.i18n', required: ['category_label', 'subcategory_label', 'capability_label', 'description', 'main_benefit', 'scope_label'] },
];
const languages = ['it', 'en', 'es'];

const parseCsvLine = (line, delimiter = ',') => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];
    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
};

const parseCsv = (filePath) => {
  const text = fs.readFileSync(filePath, 'utf8').trim();
  if (!text) return [];
  const rows = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(rows[0]);
  return rows.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
};

const errors = [];
for (const dataset of datasets) {
  const baseRows = parseCsv(dataset.base);
  const ids = new Set();
  for (const row of baseRows) {
    if (!row.id) errors.push(`${dataset.name}: base row without id`);
    if (ids.has(row.id)) errors.push(`${dataset.name}: duplicate base id ${row.id}`);
    ids.add(row.id);
  }

  for (const language of languages) {
    const filePath = `${dataset.i18n}.${language}.csv`;
    if (!fs.existsSync(filePath)) {
      errors.push(`${dataset.name}: missing ${filePath}`);
      continue;
    }
    const localizedRows = parseCsv(filePath);
    const localizedIds = new Set(localizedRows.map((row) => row.id));
    for (const id of ids) {
      if (!localizedIds.has(id)) errors.push(`${dataset.name}/${language}: missing translation id ${id}`);
    }
    for (const row of localizedRows) {
      if (!ids.has(row.id)) errors.push(`${dataset.name}/${language}: translation id ${row.id} does not exist in base dataset`);
      for (const field of dataset.required) {
        const canBeEmpty = dataset.allowEmpty?.includes(field);
        if (!canBeEmpty && !row[field]) errors.push(`${dataset.name}/${language}/${row.id}: missing ${field}`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${datasets.length} localized CSV datasets across ${languages.length} languages.`);
