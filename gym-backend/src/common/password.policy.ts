import { BadRequestException } from '@nestjs/common';

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 64;
export type PasswordContext = { email?: string; name?: string };

const COMMON = [
  'password', 'passw0rd', 'qwerty', 'azerty', 'letmein', 'welcome', 'admin', 'login', 'iloveyou', 'monkey',
  'dragon', 'football', 'abc123', '123456', '111111', '000000', 'gym', 'reception', 'powergym', 'changeme', 'secret',
];
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];
const LEET: Record<string, string> = { '@': 'a', '4': 'a', '0': 'o', '1': 'l', '!': 'i', '3': 'e', $: 's', '5': 's', '7': 't' };

const hasSequence = (p: string) => {
  const s = p.toLowerCase();
  for (let i = 0; i + 4 <= s.length; i++) {
    const w = s.slice(i, i + 4);
    if (!/^[a-z0-9]{4}$/.test(w)) continue;
    const d = [1, 2, 3].map((k) => w.charCodeAt(k) - w.charCodeAt(k - 1));
    if (d.every((x) => x === 1) || d.every((x) => x === -1)) return true; // abcd, 4321
    if (ROWS.some((r) => r.includes(w) || [...r].reverse().join('').includes(w))) return true; // qwer, poiu
  }
  return false;
};

const isCommon = (p: string) => {
  const raw = p.toLowerCase();
  const leet = [...raw].map((c) => LEET[c] ?? c).join('');
  return COMMON.some((w) => raw.includes(w) || leet.includes(w));
};

const hasPersonalInfo = (p: string, ctx: PasswordContext) => {
  const tokens = [ctx.email?.split('@')[0], ...(ctx.name?.split(/\s+/) ?? [])]
    .filter((t): t is string => !!t && t.length >= 3)
    .map((t) => t.toLowerCase());
  return tokens.some((t) => p.toLowerCase().includes(t));
};

const RULES: { message: string; ok: (p: string, ctx: PasswordContext) => boolean }[] = [
  { message: `Use ${PASSWORD_MIN} to ${PASSWORD_MAX} characters`, ok: (p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX },
  { message: 'Add a lowercase letter', ok: (p) => /[a-z]/.test(p) },
  { message: 'Add an uppercase letter', ok: (p) => /[A-Z]/.test(p) },
  { message: 'Add a number', ok: (p) => /\d/.test(p) },
  { message: 'Add a symbol such as ! @ # $ %', ok: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { message: 'Remove spaces', ok: (p) => !/\s/.test(p) },
  { message: 'Avoid repeated characters (aaa) and sequences (1234, abcd, qwer)', ok: (p) => !/(.)\1{2,}/.test(p) && !hasSequence(p) },
  { message: 'Avoid common words and anything containing your name or email', ok: (p, ctx) => !isCommon(p) && !hasPersonalInfo(p, ctx) },
];

export const passwordProblems = (p: string, ctx: PasswordContext = {}) =>
  RULES.filter((r) => !r.ok(p, ctx)).map((r) => r.message);

export function assertStrongPassword(password: string, ctx: PasswordContext = {}) {
  const problems = passwordProblems(password, ctx);
  if (problems.length) throw new BadRequestException({ message: problems, error: 'Bad Request' });
}