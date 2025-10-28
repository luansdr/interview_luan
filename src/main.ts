import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuditLoggerInterceptor } from './interceptors/audit/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log','error','warn','debug'] });
  app.useGlobalInterceptors(new AuditLoggerInterceptor());
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT ?? "3000"
  await app.listen(port);
}
bootstrap();