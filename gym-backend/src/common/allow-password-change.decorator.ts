import { SetMetadata } from '@nestjs/common';

export const ALLOW_PASSWORD_CHANGE = 'allowPasswordChange';

/** Routes a flagged account may still call (who am I, and change my password). */
export const AllowPasswordChange = () => SetMetadata(ALLOW_PASSWORD_CHANGE, true);