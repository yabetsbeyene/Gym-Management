export type AuditReq = {
  method: string;
  route?: { path?: string };
  params: Record<string, string>;
  body?: Record<string, any>;
};
export type Described = { action: string; summary: string; entityType?: string; entityId?: string };

const nameOf = (p: any) => p?.fullName ?? [p?.firstName, p?.lastName].filter(Boolean).join(' ');

/** key = "METHOD /route/pattern"; anything not listed still gets logged with a generic sentence. */
const RULES: Record<string, (req: AuditReq, res: any) => Described> = {
  'POST /members': (_, r) => ({ action: 'member.create', summary: `Created member ${nameOf(r)}`, entityType: 'Member', entityId: r?.id }),
  'PATCH /members/:id': (q, r) => ({ action: 'member.update', summary: `Edited the profile of ${nameOf(r)}`, entityType: 'Member', entityId: q.params.id }),
  'PATCH /members/:id/status': (q) => ({
    action: 'member.status',
    summary: `Set membership status to ${q.body?.status}${q.body?.reason ? ` (${q.body.reason})` : ''}`,
    entityType: 'Member',
    entityId: q.params.id,
  }),
  'POST /members/:id/renew': (q, r) => ({
    action: 'member.renew',
    summary: `Added a membership${r?.plan?.name ? ` "${r.plan.name}"` : ''}`,
    entityType: 'Member',
    entityId: q.params.id,
  }),
  'POST /members/:id/archive': (q) => ({ action: 'member.archive', summary: 'Archived a member', entityType: 'Member', entityId: q.params.id }),
  'POST /members/:id/restore': (q) => ({ action: 'member.restore', summary: 'Restored a member', entityType: 'Member', entityId: q.params.id }),

  'POST /plans': (_, r) => ({ action: 'plan.create', summary: `Created package ${r?.name}`, entityType: 'Plan', entityId: r?.id }),
  'PATCH /plans/:id': (q, r) => ({ action: 'plan.update', summary: `Updated package ${r?.name}`, entityType: 'Plan', entityId: q.params.id }),

  'POST /day-passes': (_, r) => ({ action: 'daypass.create', summary: `Sold a day pass (${r?.code})`, entityType: 'DayPass', entityId: r?.id }),

  'POST /check-ins': (q, r) => {
    const who = nameOf(r?.person) || String(q.body?.personIdentifier ?? 'unknown');
    const kind = !r?.allowed ? 'denied' : r.duplicate ? 'duplicate' : 'ok';
    return {
      action: kind === 'ok' ? 'checkin' : `checkin.${kind}`,
      summary: kind === 'denied' ? `Denied entry to ${who}: ${r?.reason}` : kind === 'duplicate' ? `Repeat scan of ${who}` : `Checked in ${who}`,
      entityType: r?.person ? (r.person.kind === 'MEMBER' ? 'Member' : 'DayPass') : undefined,
      entityId: r?.person?.id,
    };
  },

  'POST /sms/send': (q, r) => ({ action: 'sms.send', summary: `Sent an SMS (${r?.status})`, entityType: q.body?.memberId ? 'Member' : undefined, entityId: q.body?.memberId }),

  'POST /staff': (_, r) => ({ action: 'staff.create', summary: `Created receptionist account for ${r?.name}`, entityType: 'Staff', entityId: r?.id }),
  'PATCH /staff/:id': (q, r) => ({ action: 'staff.update', summary: `Edited receptionist ${r?.name}`, entityType: 'Staff', entityId: q.params.id }),
  'POST /staff/:id/activate': (q, r) => ({ action: 'staff.activate', summary: `Activated receptionist ${r?.name}`, entityType: 'Staff', entityId: q.params.id }),
  'POST /staff/:id/deactivate': (q, r) => ({ action: 'staff.deactivate', summary: `Deactivated receptionist ${r?.name}`, entityType: 'Staff', entityId: q.params.id }),
  'POST /staff/:id/reset-password': (q, r) => ({ action: 'staff.reset_password', summary: `Reset the password of ${r?.name}`, entityType: 'Staff', entityId: q.params.id }),
  'DELETE /staff/:id': (q, r) => ({ action: 'staff.delete', summary: `Deleted receptionist ${r?.name}`, entityType: 'Staff', entityId: q.params.id }),
};

export function describe(req: AuditReq, res: unknown): Described {
  const path = req.route?.path ?? 'unknown';
  const rule = RULES[`${req.method} ${path}`];
  return rule ? rule(req, res) : { action: `${req.method.toLowerCase()}:${path}`, summary: `${req.method} ${path}` };
}

/** Keeps what was submitted, minus anything sensitive or huge. */
export function sanitize(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (/password/i.test(key)) out[key] = '[hidden]';
    else if (key === 'photoUrl') out[key] = value ? '[photo]' : null;
    else out[key] = typeof value === 'string' && value.length > 200 ? `${value.slice(0, 200)}…` : value;
  }
  return Object.keys(out).length ? out : undefined;
}