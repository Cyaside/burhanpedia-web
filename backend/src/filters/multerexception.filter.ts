import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    // Multer throws an object with code 'LIMIT_FILE_SIZE' for size limit
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as { code?: string }).code === 'LIMIT_FILE_SIZE'
    ) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'File terlalu besar, maksimal 5MB',
      });
      return;
    }

    // fileFilter error comes here as a normal Error
    if (exception instanceof Error && /image/i.test(exception.message)) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      res
        .status(status)
        .json(
          typeof response === 'string'
            ? { statusCode: status, message: response }
            : response,
        );
      return;
    }

    // fallback
    const fallbackMessage =
      exception instanceof Error ? exception.message : 'Internal server error';
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: fallbackMessage,
    });
    return;
  }
}
