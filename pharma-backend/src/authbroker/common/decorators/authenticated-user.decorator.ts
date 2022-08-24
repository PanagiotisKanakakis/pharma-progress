import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Retrieves the current Keycloak logged-in user.
 */
export const AuthenticatedUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const httpCtx = ctx.switchToHttp();
        const req = httpCtx.getRequest();
        return req.user;
    },
);
