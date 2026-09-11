import { SetMetadata } from '@nestjs/common';
import { ReviewRole } from '@prisma/client';
import { REVIEW_ROLES_KEY } from '../guards/review-participant.guard';

export const ReviewRoles = (...roles: ReviewRole[]) => SetMetadata(REVIEW_ROLES_KEY, roles);
