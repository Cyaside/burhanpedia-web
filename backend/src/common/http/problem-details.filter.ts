import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestContext } from './request-context';

interface ExceptionBody {
  code?: string;
  detail?: string;
  errors?: unknown[];
  message?: string | string[];
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestContext>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body: ExceptionBody =
      typeof raw === 'object' && raw !== null ? raw : {};
    const messages = Array.isArray(body.message)
      ? body.message
      : body.message
        ? [body.message]
        : [];
    const title = HttpStatus[status] || 'Error';

    if (status >= 500) {
      this.logger.error(
        `Unhandled request failure requestId=${request.requestId}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response
      .status(status)
      .type('application/problem+json')
      .send({
        type: `https://burhanpedia.local/problems/${body.code?.toLowerCase() ?? 'request-failed'}`,
        title,
        status,
        code:
          body.code ?? (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED'),
        detail:
          body.detail ??
          (status >= 500
            ? 'An unexpected error occurred.'
            : (messages[0] ?? title)),
        instance: request.originalUrl,
        traceId: request.requestId,
        errors: body.errors ?? (messages.length > 1 ? messages : []),
      });
  }
}
