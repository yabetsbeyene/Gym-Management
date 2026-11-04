export type MembershipStatus = "ACTIVE" | "EXPIRED" | "FROZEN" | "SUSPENDED";

export type Plan = { id: string; name: string; durationDays: number; price: string | number };

export type Membership = {
  id: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  plan?: Plan;
};

export type Member = {
  id: string;
  memberNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  memberships: Membership[];
  checkIns?: { id: string; type: "MEMBER" | "DAY_PASS"; checkInTime: string }[];
};

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