import { TUploadStatus } from "../types/TUploadStatus.type";
import { IErrorPrescription } from "./IErrorPrescription.interface";

export interface IStatusPayload {
    upload_id: string;
    status: TUploadStatus| 'failed';
    total_records: number;
    processed_records: number;
    valid_records: number;
    errors: IErrorPrescription[];
  }
  