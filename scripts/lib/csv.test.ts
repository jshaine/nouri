import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CsvParser, parseCsv, readCsvFile, type Row } from './csv';

describe('parseCsv', () => {
  it('reads headers and plain rows', () => {
    expect(parseCsv('a,b\n1,2\n3,4\n')).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('handles quotes, escaped quotes, commas and newlines inside quotes, and CRLF', () => {
    const text = '"id","description"\r\n"1","Rice, white, ""long-grain"""\r\n"2","two\nlines"\r\n';
    expect(parseCsv(text)).toEqual([
      { id: '1', description: 'Rice, white, "long-grain"' },
      { id: '2', description: 'two\nlines' },
    ]);
  });

  it('strips a BOM, skips blank lines, fills missing trailing fields and reads a last line without newline', () => {
    expect(parseCsv('﻿a,b,c\n\n1,2\n4,5,6')).toEqual([
      { a: '1', b: '2', c: '' },
      { a: '4', b: '5', c: '6' },
    ]);
  });

  it('keeps empty quoted fields', () => {
    expect(parseCsv('a,b\n"",x\n')).toEqual([{ a: '', b: 'x' }]);
  });

  it('works across chunk boundaries, even mid-quote', () => {
    const rows: Row[] = [];
    const p = new CsvParser((r) => rows.push(r));
    for (const chunk of ['a,b\n"he', 'llo, ""w', 'orld""",2\n', '3,4']) p.push(chunk);
    p.end();
    expect(rows).toEqual([
      { a: 'hello, "world"', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('rejects an unterminated quote', () => {
    expect(() => parseCsv('a\n"open\n')).toThrow(/inside a quoted field/);
  });
});

describe('readCsvFile', () => {
  it('streams a file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'nouri-csv-'));
    const file = join(dir, 'x.csv');
    writeFileSync(file, 'id,name\n1,"Kanin, cooked"\n');
    const rows: Row[] = [];
    await readCsvFile(file, (r) => rows.push(r));
    expect(rows).toEqual([{ id: '1', name: 'Kanin, cooked' }]);
  });
});
