export type MembershipStatus = "ACTIVE" | "EXPIRED" | "FROZEN" | "SUSPENDED";

export type Plan = {
  id: string;
  name: string;
  description?: string | null;
  durationDays: number;
  price: string | number;
  isActive: boolean;
};

export type Membership = {
  id: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  statusReason?: string | null;
  plan?: Plan;
};

export type SmsLog = { id: string; message: string; status: "QUEUED" | "SENT" | "FAILED"; createdAt: string };

export type Member = {
  id: string;
  memberNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  joinedAt: string;
  archivedAt?: string | null;
  memberships: Membership[];
  checkIns?: { id: string; type: "MEMBER" | "DAY_PASS"; checkInTime: string }[];
  notifications?: SmsLog[];
};

export type MemberList = { items: Member[]; total: number; page: number; pages: number };

export type CheckResult = {
  allowed: boolean;
  duplicate: boolean;
  reason: string;
  grantedBy: "MEMBERSHIP" | "DAY_PASS" | null;
  person: {
    kind: "MEMBER" | "DAY_PASS";
    id: string;
    memberNumber?: number;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string | null;
  } | null;
  checkIn: { id: string; checkInTime: string } | null;
};

export type CheckInRow = {
  id: string;
  type: "MEMBER" | "DAY_PASS";
  checkInTime: string;
  member?: { firstName: string; lastName: string } | null;
  dayPass?: { visitor?: { fullName: string } | null } | null;
};

export type AttemptRow = {
  id: string;
  identifier: string;
  reason: string;
  createdAt: string;
  member?: { firstName: string; lastName: string; memberNumber: number } | null;
  dayPass?: { visitor?: { fullName: string } | null } | null;
  createdBy: { name: string };
};
export type DashboardRange = "today" | "week" | "month";

export type DashboardOverview = {
  range: DashboardRange;
  revenue: { amount: number; previous: number; changePct: number | null; memberships: number; dayPasses: number };
  checkIns: { today: number; capacity: number; peakHour: number | null };
  members: { total: number; newInRange: number; active: number; activePct: number; expiringSoon: number };
  packages: {
    activePlans: number;
    top: { name: string; share: number } | null;
    breakdown: { id: string; name: string; price: number; durationDays: number; subscribers: number; share: number }[];
  };
  hourly: { hour: number; count: number }[];
  recent: {
    id: string;
    time: string;
    type: "MEMBER" | "DAY_PASS";
    memberId: string | null;
    name: string;
    photoUrl: string | null;
    code: string;
    plan: string;
  }[];
  insights: { tone: "good" | "warn" | "info"; text: string }[];
};
export type Staff = {
  id: string;
  name: string;
  email: string;
  role: "RECEPTIONIST";
  phone: string | null;
  address: string | null;
  photoUrl: string | null;
  notes: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
  _count?: { checkIns: number; dayPassesCreated: number };
};
export type StaffList = { items: Staff[]; max: number; used: number };

export type AuditRow = {
  id: string;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  summary: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};
export type AuditList = { items: AuditRow[]; total: number; page: number; pages: number };
export type AuditActor = { actorId: string | null; actorName: string; count: number };