import { SetMetadata, Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicenseType } from '@aljama/shared';

export const REQUIRE_LICENSE_KEY = 'require_license';
export const RequireLicense = (license: LicenseType) => SetMetadata(REQUIRE_LICENSE_KEY, license);

@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredLicense = this.reflector.getAllAndOverride<LicenseType>(
      REQUIRE_LICENSE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredLicense) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // QT-08: reviewer_limited accounts can only access Review Center
    if (requiredLicense === LicenseType.FULL && user.licenseType === LicenseType.REVIEWER_LIMITED) {
      throw new ForbiddenException(
        'Reviewer Limited license does not have permission to access Project Explorer or List View. You may only participate in reviews assigned to you in Review Center.',
      );
    }

    return true;
  }
}
