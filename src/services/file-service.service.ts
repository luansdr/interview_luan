import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import * as csv from 'csv-parser';

@Injectable()
export class FileService {
  async streamCsv(
    buffer: Buffer,
    onRow: (row: Record<string, any>, line: number) => Promise<void> | void,
  ): Promise<number> {
    let line = 1;
    return new Promise((resolve, reject) => {
      const stream = Readable.from(buffer);
      stream
        .pipe(csv())
        .on('data', async (row) => {
          line += 1;
          try { await onRow(row, line); } catch (e) { stream.destroy(e as Error); }
        })
        .on('end', () => resolve(line - 1))
        .on('error', reject);
    });
  }
}
