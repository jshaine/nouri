/**
 * Minimal RFC 4180 CSV reader: quoted fields, escaped quotes (""), commas and
 * newlines inside quotes, CRLF. Streams, so USDA's large food_nutrient.csv
 * never has to fit in memory at once.
 */
import { createReadStream } from 'node:fs';

export type Row = Record<string, string>;

/** Parses CSV text chunk by chunk; call `push` per chunk, then `end`. */
export class CsvParser {
  private field = '';
  private record: string[] = [];
  private inQuotes = false;
  private quotePending = false;
  private header: string[] | undefined;
  private readonly onRow: (row: Row) => void;

  constructor(onRow: (row: Row) => void) {
    this.onRow = onRow;
  }

  push(chunk: string): void {
    for (const ch of chunk) {
      if (this.inQuotes) {
        if (this.quotePending) {
          this.quotePending = false;
          if (ch === '"') {
            this.field += '"';
            continue;
          }
          this.inQuotes = false;
          // fall through: ch is the character after a closing quote
        } else if (ch === '"') {
          this.quotePending = true;
          continue;
        } else {
          this.field += ch;
          continue;
        }
      }
      if (ch === '"' && this.field === '') this.inQuotes = true;
      else if (ch === ',') this.endField();
      else if (ch === '\n') this.endRecord();
      else if (ch !== '\r') this.field += ch;
    }
  }

  end(): void {
    if (this.quotePending) {
      this.quotePending = false;
      this.inQuotes = false;
    }
    if (this.inQuotes) throw new Error('CSV ended inside a quoted field.');
    if (this.field !== '' || this.record.length > 0) this.endRecord();
  }

  private endField() {
    this.record.push(this.field);
    this.field = '';
  }

  private endRecord() {
    this.endField();
    const record = this.record;
    this.record = [];
    if (record.length === 1 && record[0] === '') return; // blank line
    if (!this.header) {
      this.header = record.map((h) => h.replace(/^\uFEFF/, '').trim());
      return;
    }
    const row: Row = {};
    this.header.forEach((name, i) => {
      row[name] = record[i] ?? '';
    });
    this.onRow(row);
  }
}

export function parseCsv(text: string): Row[] {
  const rows: Row[] = [];
  const parser = new CsvParser((r) => rows.push(r));
  parser.push(text);
  parser.end();
  return rows;
}

/** Streams a CSV file, calling `onRow` for each record after the header. */
export async function readCsvFile(path: string, onRow: (row: Row) => void): Promise<void> {
  const parser = new CsvParser(onRow);
  const stream = createReadStream(path, { encoding: 'utf8' });
  for await (const chunk of stream) parser.push(chunk as string);
  parser.end();
}
