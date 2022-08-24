import { Catch, ExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { Response } from 'express';
import { QueryFailedError } from "typeorm";

/**
 * Custom exception filter to convert QueryFailedError from TypeOrm to NestJs responses
 * @see also @https://docs.nestjs.com/exception-filters
 */
@Catch(QueryFailedError)
export class QueryFailedErrorExceptionFilter implements ExceptionFilter {

  public catch(exception: QueryFailedError, host: ArgumentsHost) {

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    return response.status(400).json({ 
      message: { 
        statusCode: 400, 
        error: 'Bad Request', 
        errorMessage: exception.message,
      } 
    });
  }

}
