import {
    Injectable,
    CanActivate,
    ExecutionContext,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { META_SHORT_ACCESS_TOKEN_OPTIONS } from '../decorators/short-access-token.decorator';
import { ShortAccessTokenService } from '../../shortaccesstoken';
import { ShortAccessTokenOptions } from '../../interfaces';
import { DateTime, Duration } from 'luxon';

@Injectable()
export class ShortAccessTokenGuard implements CanActivate {
    private readonly logger = new Logger(ShortAccessTokenGuard.name);

    constructor(
        private shortAccessTokenService: ShortAccessTokenService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const shortAccessTokenOptions =
            this.reflector.getAllAndOverride<ShortAccessTokenOptions>(
                META_SHORT_ACCESS_TOKEN_OPTIONS,
                [context.getClass(), context.getHandler()],
            );

        if (!shortAccessTokenOptions) {
            this.logger.verbose(
                'Rejecting request: ShortAccessToken options missing on protected endpoint',
            );
            return false;
        }
        const request = context.switchToHttp().getRequest();

        if (
            !request.params[shortAccessTokenOptions.resourceField] ||
            !request.params[shortAccessTokenOptions.tokenField]
        ) {
            this.logger.verbose(
                'Rejecting request: ShortAccessToken Protected endpoint provided fields that were not found on the request',
            );
            return false;
        }

        let SAT =
            await this.shortAccessTokenService.findOneByTokenAndResourceType(
                request.params[shortAccessTokenOptions.tokenField],
                shortAccessTokenOptions.resourceType,
            );
        if (!SAT) {
            this.logger.verbose('Rejecting request: invalid token provided');
            return false;
        }

        let createdAt = DateTime.fromISO(SAT.createdAt.toISOString());

        if (
            createdAt.plus(Duration.fromISO(SAT.duration)) > DateTime.now() &&
            request.params[shortAccessTokenOptions.resourceField] ==
                SAT.resourceId
        ) {
            this.logger.verbose('Allowing request: Valid token provided');
            return true;
        }

        return false;
    }
}
