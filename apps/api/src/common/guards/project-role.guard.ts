import {
  SetMetadata,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectRole } from '@aljama/shared';
import { PrismaService } from '../../prisma/prisma.service';

export const REQUIRE_PROJECT_ROLE_KEY = 'require_project_role';
export const RequireProjectRole = (...roles: ProjectRole[]) =>
  SetMetadata(REQUIRE_PROJECT_ROLE_KEY, roles);

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      REQUIRE_PROJECT_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    const projectId =
      request.params?.projectId ||
      request.params?.id ||
      request.body?.projectId ||
      request.query?.projectId;

    if (!projectId) {
      return true;
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const hasRole = requiredRoles.includes(membership.projectRole as unknown as ProjectRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient project permissions. Required role: ${requiredRoles.join(', ')}`,
      );
    }

    request.projectRole = membership.projectRole;
    return true;
  }
}
