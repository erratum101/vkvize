export interface LocalProfile {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

const STORAGE_KEY = 'vkvize:local-profile';

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export const TELEGRAM_AVATAR_COLORS = [
  '#e17076',
  '#faa357',
  '#7bc862',
  '#65aadd',
  '#a695e7',
  '#ee7aae',
  '#6ec9cb',
  '#f2c94c',
  '#56ccf2',
  '#bb6bd9',
  '#2f80ed',
  '#27ae60',
  '#eb5757',
  '#f2994a',
  '#9b51e0',
  '#00b894',
];

export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

export function getInitial(name?: string | null) {
  const normalized = normalizeName(name || '');
  return (normalized[0] || '?').toUpperCase();
}

export function getAvatarColor(name?: string | null) {
  const initial = getInitial(name);
  const code = initial.charCodeAt(0);
  return TELEGRAM_AVATAR_COLORS[code % TELEGRAM_AVATAR_COLORS.length];
}

export function getStoredProfile(): LocalProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Omit<LocalProfile, 'id'> & { id?: string }) {
  const current = getStoredProfile();
  const next: LocalProfile = {
    id: profile.id || current?.id || createId(),
    name: normalizeName(profile.name),
    avatarUrl: profile.avatarUrl || null,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('vkvize:profile-updated', { detail: next }));
  return next;
}

export function clearProfile() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('vkvize:profile-updated'));
}

export function getProfileHeaders(): Record<string, string> {
  const profile = getStoredProfile();
  if (!profile?.id || !profile.name) return {};
  return {
    'x-profile-id': profile.id,
    'x-profile-name': encodeURIComponent(profile.name),
    ...(profile.avatarUrl ? { 'x-profile-avatar': encodeURIComponent(profile.avatarUrl) } : {}),
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
