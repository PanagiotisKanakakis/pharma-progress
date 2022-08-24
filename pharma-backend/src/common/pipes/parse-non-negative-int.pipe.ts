import { ArgumentMetadata, HttpStatus, Injectable, Optional, ParseIntPipeOptions, PipeTransform } from "@nestjs/common";
import { HttpErrorByCode } from "@nestjs/common/utils/http-error-by-code.util";

/**
 * Defines the ParseNonNegativeInt Pipe
 */
@Injectable()
export class ParseNonNegativeIntPipe implements PipeTransform<string> {
  protected exceptionFactory: (error: string) => any;

  constructor(@Optional() options?: ParseIntPipeOptions) {
    options = options || {};
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } =
      options;

    this.exceptionFactory =
      exceptionFactory ||
      (error => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  /**
   * Method that accesses and performs optional transformation on argument for
   * in-flight requests.
   *
   * @param value currently processed route argument
   * @param metadata contains metadata about the currently processed route argument
   */
  async transform(value: string, metadata: ArgumentMetadata): Promise<number> {
    const isNumeric =
      ['string', 'number'].includes(typeof value) &&
      /^\d+$/.test(value) &&
      isFinite(value as any);
    if (!isNumeric) {
      throw this.exceptionFactory(
        'Validation failed (non-negative numeric string is expected)',
      );
    }
    const actualValue = parseInt(value, 10);
    if (actualValue < 0) { 
        throw this.exceptionFactory(
          'Validation failed (non-negative numeric string is expected)',
        );
    }
    return actualValue;
  }
}