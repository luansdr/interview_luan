import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrescriptionsService } from './prescriptions.service';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post(`upload`)
  @UseInterceptors(FileInterceptor('file'))
  createPrescriptions(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { message: 'No file uploaded' };
    }

    return this.prescriptionsService.create(file);
  }

  @Get(`upload/:id`)
  getPrescriptions() {
    return this.prescriptionsService.findAll();
  }
}
