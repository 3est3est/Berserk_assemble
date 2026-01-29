import { Brawler } from '../_models/brawler';
import { Passport } from '../_models/passport';

const _default_avatar = '/assets/avatar-profile.jpg';

export function getAvatarUrl(passport: Passport | undefined): string {
  if (passport && passport.avatar_url) return passport.avatar_url;
  if (passport && passport.display_name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(passport.display_name)}&background=random`;
  }
  return _default_avatar;
}

/**
 * Decode JWT token and extract user_id from 'sub' claim
 * Note: This does NOT verify the signature, only decodes the payload
 */
export function getUserIdFromToken(token: string | undefined): number | null {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    const userId = parseInt(payload.sub, 10);
    return isNaN(userId) ? null : userId;
  } catch (e) {
    console.error('Failed to decode JWT', e);
    return null;
  }
}
