import {
    ConsoleLogger,
    Injectable,
    LoggerService,
    LogLevel,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const LOGGER_CONTEXT: string = 'PHARMA';

@Injectable()
export class CustomLogger implements LoggerService {
    private consoleLogger: ConsoleLogger;

    constructor(private readonly configService: ConfigService) {
        this.consoleLogger = new ConsoleLogger(LOGGER_CONTEXT, {
            logLevels: <LogLevel[]>(
                this.configService.get<string>('PHARMA_LOGGING').split(',')
            ),
        });
    }

    log(message: any, ...optionalParams: any[]) {
        this.consoleLogger.log(message, ...optionalParams);
    }

    error(message: any, ...optionalParams: any[]) {
        this.consoleLogger.error(message, ...optionalParams);
    }

    warn(message: any, ...optionalParams: any[]) {
        this.consoleLogger.warn(message, ...optionalParams);
    }

    debug?(message: any, ...optionalParams: any[]) {
        this.consoleLogger.debug(message, ...optionalParams);
    }

    verbose?(message: any, ...optionalParams: any[]) {
        this.consoleLogger.verbose(message, ...optionalParams);
    }

    setLogLevels?(levels: LogLevel[]) {
        this.consoleLogger.setLogLevels(levels);
    }
}
