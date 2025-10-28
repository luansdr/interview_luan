import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditLoggerInterceptor implements NestInterceptor {
  private readonly log = new Logger('HTTP');

  intercept(callContent: ExecutionContext, next: CallHandler): Observable<any> {
    const req = callContent
      .switchToHttp()
      .getRequest<Request & { file?: any }>();
    const res = callContent.switchToHttp().getResponse();
    const start = Date.now();

    const method = (req as any).method;
    const url = (req as any).url;
    const ip = (req as any).ip;
    const contentLength = (req as any).headers?.['content-length'];
    const fileInfo = req?.file
      ? { fieldname: req.file.fieldname, size: req.file.size }
      : undefined;

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const statusCode = (res as any).statusCode;
        this.log.log(
          JSON.stringify({
            method,
            url,
            statusCode,
            ms,
            ip,
            contentLength,
            fileInfo,
          }),
        );
      }),
    );
  }
}
