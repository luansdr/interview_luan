import { Injectable } from '@nestjs/common';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class FileService {
  async processCsv(buffer: Buffer): Promise<any[]> {
    const results: any[] = [];
    const stream = Readable.from([buffer]);

    return new Promise((resolve, reject) => {
      stream
        .on('error', reject)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }
}
