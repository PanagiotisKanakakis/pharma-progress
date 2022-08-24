import { createHmac } from 'crypto';

export const afmToUsername = async (afm: string) => {
    const SALT = `@afms@alt`;
    const LENGTH = 8;
    const hash = createHmac('sha256', SALT).update(afm).digest('hex');
    return `user${hash.substring(0, LENGTH)}`;
};
