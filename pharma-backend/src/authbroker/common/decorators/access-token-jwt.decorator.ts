import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Retrieves the current access token.
 */
export const AccessTokenJWT = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const httpCtx = ctx.switchToHttp();
        const req = httpCtx.getRequest();
        return req.accessTokenJWT;
    },
);
