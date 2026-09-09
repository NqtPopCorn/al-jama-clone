import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserSummary } from '@aljama/shared';

export const CurrentUser = createParamDecorator(
  (data: keyof UserSummary | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
