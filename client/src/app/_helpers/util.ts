import { Brawler } from '../_models/brawler';
import { Passport } from '../_models/passport';

const _default_avatar =
  'https://raw.githubusercontent.com/primefaces/primevue/master/public/layout/images/avatar/amyelsner.png';
// Actually user asked for "รูปบแบบบอท" (bot style) from PrimeNG.
// PrimeNG doesn't have a direct "bot image URL", but we can use a stylized avatar.
const _bot_avatar = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=vibe';

export function getAvatarUrl(passport: Passport | undefined): string {
  if (passport && passport.avatar_url) return passport.avatar_url;
  const seed = passport?.display_name || 'vibe';
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;
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
