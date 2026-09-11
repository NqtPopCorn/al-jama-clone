import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewRole } from '@prisma/client';

export const REVIEW_ROLES_KEY = 'reviewRoles';

@Injectable()
export class ReviewParticipantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ReviewRole[]>(REVIEW_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Determine review ID from route params (either 'id' or 'reviewId')
    const reviewId = request.params.id || request.params.reviewId;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    if (!reviewId) {
      return true; // If no review ID in params, this guard is not applicable or it's a creation route
    }

    // Check participation
    const participant = await this.prisma.reviewParticipant.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: user.id,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this review');
    }

    // Role-based authorization if required roles are specified
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(participant.reviewRole)) {
        throw new ForbiddenException('You do not have the required review role for this action');
      }
    }

    // Store participant in request for later use
    request.reviewParticipant = participant;

    return true;
  }
}
