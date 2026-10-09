export const AVATARS = [
  'default',
  'anby',
  'nicole',
  'billy',
  'nekomata',
  'grace',
] as const;

export type AvatarId = typeof AVATARS[number];

export function isValidAvatar(value:unknown): value is AvatarId {
    return typeof value === 'string' && (AVATARS as readonly string[]).includes(value);
}

export function avatarPath(id:AvatarId):string {
    return `/avatars/${id}.png`;
};