export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 64;
export type PasswordContext = { email?: string; name?: string };

const COMMON = [
  "password", "passw0rd", "qwerty", "azerty", "letmein", "welcome", "admin", "login", "iloveyou", "monkey",
  "dragon", "football", "abc123", "123456", "111111", "000000", "gym", "reception", "powergym", "changeme", "secret",
];
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"];
const LEET: Record<string, string> = { "@": "a", "4": "a", "0": "o", "1": "l", "!": "i", "3": "e", $: "s", "5": "s", "7": "t" };

function hasSequence(p: string) {
  const s = p.toLowerCase();
  for (let i = 0; i + 4 <= s.length; i++) {
    const w = s.slice(i, i + 4);
    if (!/^[a-z0-9]{4}$/.test(w)) continue;
    const d = [1, 2, 3].map((k) => w.charCodeAt(k) - w.charCodeAt(k - 1));
    if (d.every((x) => x === 1) || d.every((x) => x === -1)) return true;
    if (ROWS.some((r) => r.includes(w) || [...r].reverse().join("").includes(w))) return true;
  }
  return false;
}

function isCommon(p: string) {
  const raw = p.toLowerCase();
  const leet = [...raw].map((c) => LEET[c] ?? c).join("");
  return COMMON.some((w) => raw.includes(w) || leet.includes(w));
}

function hasPersonalInfo(p: string, ctx: PasswordContext) {
  const tokens = [ctx.email?.split("@")[0], ...(ctx.name?.split(/\s+/) ?? [])]
    .filter((t): t is string => !!t && t.length >= 3)
    .map((t) => t.toLowerCase());
  return tokens.some((t) => p.toLowerCase().includes(t));
}

export const PASSWORD_RULES: { label: string; ok: (p: string, ctx: PasswordContext) => boolean }[] = [
  { label: `${PASSWORD_MIN} to ${PASSWORD_MAX} characters`, ok: (p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX },
  { label: "A lowercase letter (a–z)", ok: (p) => /[a-z]/.test(p) },
  { label: "An uppercase letter (A–Z)", ok: (p) => /[A-Z]/.test(p) },
  { label: "A number (0–9)", ok: (p) => /\d/.test(p) },
  { label: "A symbol (! @ # $ % …)", ok: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { label: "No spaces", ok: (p) => !/\s/.test(p) },
  { label: "No repeats (aaa) or sequences (1234, abcd)", ok: (p) => !/(.)\1{2,}/.test(p) && !hasSequence(p) },
  { label: "Not a common word, your name or email", ok: (p, ctx) => !isCommon(p) && !hasPersonalInfo(p, ctx) },
];

/** Labels of the rules that are not met yet (empty array = strong). */
export const passwordProblems = (p: string, ctx: PasswordContext = {}) =>
  PASSWORD_RULES.filter((r) => !p || !r.ok(p, ctx)).map((r) => r.label);

const POOLS = ["abcdefghjkmnpqrstuvwxyz", "ABCDEFGHJKMNPQRSTUVWXYZ", "23456789", "!@#$%^&*-_=+?"];

/** Random password that always satisfies every rule. */
export function generatePassword(length = 16) {
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const all = POOLS.join("");
  for (;;) {
    const chars = POOLS.map((pool) => pool[rnd(pool.length)]);
    while (chars.length < length) chars.push(all[rnd(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const pw = chars.join("");
    if (passwordProblems(pw).length === 0) return pw;
  }
}