import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';

@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    // Multer throws an object with code 'LIMIT_FILE_SIZE' for size limit
    if (exception?.code === 'LIMIT_FILE_SIZE') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'File terlalu besar, maksimal 5MB',
      });
    }

    // fileFilter error comes here as a normal Error
    if (exception instanceof Error && /image/i.test(exception.message)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
      });
    }

    // fallback
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception?.message || 'Internal server error',
    });
  }
}
