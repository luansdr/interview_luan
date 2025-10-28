import { Module } from '@nestjs/common';
import { FileService } from 'src/services/file-service.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, FileService],
})
export class PrescriptionsModule {}
