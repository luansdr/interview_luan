import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileService } from './services/file-service.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { Prescription } from './prescriptions/entities/prescription.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data.db',
      entities: [Prescription],
      synchronize: true,
    }),
    PrescriptionsModule],
  controllers: [AppController],
  providers: [AppService, FileService],
})
export class AppModule {}
