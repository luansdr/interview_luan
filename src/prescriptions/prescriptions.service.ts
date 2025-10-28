// src/prescriptions/prescriptions.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FileService } from 'src/services/file-service.service';
import { IErrorPrescription } from './interfaces/IErrorPrescription.interface';
import { IStatusPayload } from './interfaces/IStatusPayload.interface';

import { isValidUF } from 'src/common/constants/ufs';
import { isCpf11 } from 'src/common/utils/isCPF.utils';
import { onlyDigits } from 'src/common/utils/onlyDigits.utils';
import { todayISO } from 'src/common/utils/todayISO.utils';

const DB = { prescriptionsByCsvId: new Map<string, any>() };

@Injectable()
export class PrescriptionsService {
  private jobs = new Map<string, IStatusPayload>();
  private readonly log = new Logger(PrescriptionsService.name);

  constructor(private fileService: FileService) {}

  async create(file: Express.Multer.File) {
    const upload_id = randomUUID();
    this.log.log(
      `upload=${upload_id} received size=${file.size}B mimetype=${file.mimetype}`,
    );

    this.jobs.set(upload_id, {
      upload_id,
      status: 'processing',
      total_records: 0,
      processed_records: 0,
      valid_records: 0,
      errors: [],
    });

    setImmediate(() =>
      this.process(upload_id, file.buffer).catch((e) => {
        this.log.error(
          `upload=${upload_id} failed err=${(e as Error)?.message}`,
        );

        const s = this.jobs.get(upload_id);
        if (!s) return;
        s.status = 'failed';
        s.errors.push({
          line: 0,
          field: 'file',
          message: 'Falha no processamento',
          value: String(e).slice(0, 300),
        });
        this.jobs.set(upload_id, s);
      }),
    );

    return upload_id;
  }

  getStatus(id: string): IStatusPayload {
    const s = this.jobs.get(id);
    if (!s) {
      return {
        upload_id: id,
        status: 'failed',
        total_records: 0,
        processed_records: 0,
        valid_records: 0,
        errors: [
          {
            line: 0,
            field: 'upload_id',
            message: 'Upload não encontrado',
            value: id,
          },
        ],
      };
    }
    return s;
  }

  private async process(upload_id: string, buffer: Buffer) {
    const start = Date.now();
    const s = this.jobs.get(upload_id)!;
    const seen = new Set<string>();
    const today = new Date(todayISO()).getTime();

    this.log.log(`upload=${upload_id} parsing CSV`);
    const rows = await this.fileService.processCsv(buffer);
    s.total_records = rows.length;
    this.log.log(`upload=${upload_id} total_records=${s.total_records}`);

    for (let i = 0; i < rows.length; i++) {
      const line = i + 2;
      const row = rows[i];
      const csvId = String(row['id'] ?? '').trim();
      const date = String(row['date'] ?? '').trim();
      const patientCpfRaw = String(row['patient_cpf'] ?? '').trim();
      const doctorCrmRaw = String(row['doctor_crm'] ?? '').trim();
      const doctorUfRaw = String(row['doctor_uf'] ?? '').trim();
      const medication = String(row['medication'] ?? '').trim();
      const controlled = ['true', '1', 't', 'yes', 'y', 'sim'].includes(
        String(row['controlled'] ?? '')
          .trim()
          .toLowerCase(),
      );
      const dosage = String(row['dosage'] ?? '').trim();
      const frequencyRaw = String(row['frequency'] ?? '').trim();
      const durationRaw = String(row['duration'] ?? '').trim();
      const notesRaw = (row['notes'] ?? '') ? String(row['notes']).trim() : '';

      const errs: IErrorPrescription[] = [];

      if (!csvId) errs.push({ line, field: 'id', message: 'Obrigatório' });

      const d = Date.parse(date);
      if (!date || isNaN(d))
        errs.push({
          line,
          field: 'date',
          message: 'Data inválida (YYYY-MM-DD)',
          value: date,
        });
      else if (d > today)
        errs.push({
          line,
          field: 'date',
          message: 'Data não pode ser futura',
          value: date,
        });

      const cpf = onlyDigits(patientCpfRaw);
      if (cpf.length !== 11)
        errs.push({
          line,
          field: 'patient_cpf',
          message: 'CPF deve ter 11 dígitos',
          value: patientCpfRaw,
        });
      else if (!isCpf11(cpf))
        errs.push({
          line,
          field: 'patient_cpf',
          message: 'CPF inválido',
          value: patientCpfRaw,
        });

      const crm = onlyDigits(doctorCrmRaw);
      if (!crm)
        errs.push({
          line,
          field: 'doctor_crm',
          message: 'Apenas números',
          value: doctorCrmRaw,
        });

      const uf = doctorUfRaw.toUpperCase();
      if (!isValidUF(uf))
        errs.push({
          line,
          field: 'doctor_uf',
          message: 'UF inválida',
          value: doctorUfRaw,
        });

      if (!medication)
        errs.push({ line, field: 'medication', message: 'Obrigatório' });
      if (!dosage) errs.push({ line, field: 'dosage', message: 'Obrigatório' });

      const duration = parseInt(durationRaw, 10);
      if (!durationRaw)
        errs.push({ line, field: 'duration', message: 'Obrigatório' });
      else if (!Number.isFinite(duration) || duration <= 0) {
        errs.push({
          line,
          field: 'duration',
          message: 'Deve ser número positivo',
          value: durationRaw,
        });
      } else {
        if (duration > 90)
          errs.push({
            line,
            field: 'duration',
            message: 'Duração máxima 90 dias',
            value: durationRaw,
          });
        if (controlled && duration > 60)
          errs.push({
            line,
            field: 'duration',
            message: 'Controlado: duração máxima 60 dias',
            value: durationRaw,
          });
      }

      if (frequencyRaw === '')
        errs.push({ line, field: 'frequency', message: 'Obrigatório' });

      if (controlled && !notesRaw)
        errs.push({
          line,
          field: 'notes',
          message: 'Obrigatório para controlados',
        });

      if (csvId) {
        if (seen.has(csvId))
          errs.push({
            line,
            field: 'id',
            message: 'Duplicado no arquivo',
            value: csvId,
          });
        if (DB.prescriptionsByCsvId.has(csvId))
          errs.push({
            line,
            field: 'id',
            message: 'Já existe no sistema',
            value: csvId,
          });
      }

      if (errs.length) {
        s.errors.push(...errs);
      } else {
        DB.prescriptionsByCsvId.set(csvId, {
          csvId,
          date,
          patientCpf: cpf,
          doctorCrm: crm,
          doctorUf: uf,
          medication,
          controlled,
          dosage,
          frequencyRaw,
          frequencyHours: frequencyRaw,
          durationDays: duration,
          notes: notesRaw || null,
          createdAt: new Date().toISOString(),
        });
        s.valid_records += 1;
      }

      s.processed_records += 1;
      seen.add(csvId);

    }

    s.status = 'completed';
    this.jobs.set(upload_id, s);
    const elapsed = Date.now() - start;
    this.log.log(
      `upload=${upload_id} completed total=${s.total_records} valid=${s.valid_records} errors=${s.errors.length} time=${elapsed}ms`,
    );
  }
}
