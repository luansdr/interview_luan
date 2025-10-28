import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrescriptionsService } from './prescriptions.service';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = /text\/csv|application\/vnd\.ms-excel/.test(file.mimetype) || file.originalname.endsWith('.csv');
      cb(ok ? null : new BadRequestException('Tipo de arquivo inválido'), ok);
    },
  }))
  
  @HttpCode(HttpStatus.ACCEPTED)
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo nao enviado, deve-se enviar um arquivo CSV com o nome file');
    const id = await this.prescriptionsService.create(file);
    return this.prescriptionsService.getStatus(id);
  }

  @Get('upload/:id')
  status(@Param('id') id: string) {
    return this.prescriptionsService.getStatus(id);
  }
}
