export type MembershipTier = "gold" | "platinum" | "diamond" | "emerald";
export type MembershipStatus =
  | "pending"
  | "pending-24h"
  | "pending-48h"
  | "active"
  | "dormant"
  | "cancelled"
  | "expired"
  | "suspended";

export interface StatusHistoryEntry {
  status: MembershipStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export type CardTheme = "gold" | "black" | "platinum" | "diamond" | "emerald";

export interface MemberPersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  address?: string;
  dateOfBirth?: string;
  profilePhoto?: string;
}

export interface MemberCredentials {
  username: string;
  passwordHash: string;
  temporaryPassword: string;
  passwordUpdatedAt?: string;
}

export type ArtistStatus = "active" | "inactive" | "archived";

export interface Artist {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  contactEmail?: string;
  primaryColor?: string;
  status: ArtistStatus;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberCard {
  id: string;
  membershipNumber: string;
  theme: CardTheme;
  issueDate: string;
  expirationDate: string;
  qrCodeUrl: string;
  status: MembershipStatus;
}

export interface Membership {
  tier: MembershipTier;
  number: string;
  startDate: string;
  expirationDate: string;
  status: MembershipStatus;
  notes?: string;
  pendingExpiresAt?: string;
  dormantAt?: string;
  statusHistory?: StatusHistoryEntry[];
}

export interface Member {
  id: string;
  artistId?: string;
  personal: MemberPersonalInfo;
  membership: Membership;
  card: MemberCard;
  credentials: MemberCredentials;
  createdAt: string;
  updatedAt: string;
  role: "member";
}

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin";
}

export interface TierConfig {
  id: MembershipTier;
  name: string;
  price: number;
  color: string;
  benefits: string[];
}

export const MEMBERSHIP_TIERS: TierConfig[] = [
  {
    id: "gold",
    name: "Gold",
    price: 1000,
    color: "#c9a84c",
    benefits: [
      "Early ticket access",
      "Exclusive merchandise",
      "Behind-the-scenes content",
      "Member discounts",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 2000,
    color: "#e5e4e2",
    benefits: [
      "All Gold benefits",
      "VIP events",
      "Meet & Greet invitations",
      "Digital downloads",
      "Priority support",
    ],
  },
  {
    id: "diamond",
    name: "Diamond",
    price: 5000,
    color: "#b9f2ff",
    benefits: [
      "All Platinum benefits",
      "Private soundcheck access",
      "Limited edition collectibles",
      "Personalized video messages",
      "Concierge service",
    ],
  },
  {
    id: "emerald",
    name: "Emerald",
    price: 7500,
    color: "#50c878",
    benefits: [
      "All Diamond benefits",
      "Private dinners",
      "Backstage tours",
      "Lifetime recognition",
      "Dedicated account manager",
    ],
  },
];

export const MOCK_ADMIN: AdminUser = {
  id: "admin-1",
  email: "admin@robertplant.com",
  passwordHash: "admin123",
  role: "admin",
};

export const MOCK_MEMBER: Member = {
  id: "member-1",
  role: "member",
  personal: {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "+1 555 123 4567",
    country: "United States",
    address: "123 Music Row, Nashville, TN",
    dateOfBirth: "1985-06-15",
    profilePhoto: "https://i.pravatar.cc/150?img=5",
  },
  membership: {
    tier: "platinum",
    number: "RP-9A2B4C",
    startDate: "2026-01-15",
    expirationDate: "2027-01-15",
    status: "active",
    notes: "VIP member since 2026.",
    pendingExpiresAt: undefined,
    dormantAt: undefined,
    statusHistory: [],
  },
  card: {
    id: "card-a1b2c3d4",
    membershipNumber: "RP-9A2B4C",
    theme: "platinum",
    issueDate: "2026-01-15",
    expirationDate: "2027-01-15",
    qrCodeUrl: "https://robertplant-vip.com/verify/RP-9A2B4C",
    status: "active",
  },
  credentials: {
    username: "jane@example.com",
    passwordHash: "temp123",
    temporaryPassword: "temp123",
  },
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
};

export type EventType = "imported" | "vip";
export type EventStatus = "upcoming" | "sold_out" | "cancelled" | "postponed";

export interface PlatformEvent {
  id: string;
  artistId?: string;
  title: string;
  date: string;
  time?: string;
  venue: string;
  city: string;
  country: string;
  imageUrl?: string;
  ticketUrl?: string;
  bandsintownUrl?: string;
  type: EventType;
  status: EventStatus;
  featured: boolean;
  visible: boolean;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventRsvp {
  id: string;
  memberId: string;
  eventId: string;
  status: "going" | "interested" | "not_going";
  createdAt: string;
  updatedAt: string;
}

export interface SyncStatus {
  id: string;
  source: string;
  status: "success" | "error" | "fallback" | "disabled";
  endpoint: string;
  importedCount: number;
  createdCount: number;
  updatedCount: number;
  apiStatus?: number;
  errorMessage?: string;
  isDemoData: boolean;
  syncedAt: string;
}

export interface Analytics {
  totalMembers: number;
  activeMembers: number;
  expiredMemberships: number;
  upcomingRenewals: number;
  revenue: number;
  emailDeliveries: number;
  qrScans: number;
  growth: number;
}

export const UPCOMING_EVENTS = [
  {
    id: "evt-1",
    title: "VIP Listening Session",
    date: "2026-07-15",
    location: "London",
    description: "Exclusive preview of unreleased tracks.",
  },
  {
    id: "evt-2",
    title: "Summer Tour Pre-Sale",
    date: "2026-08-01",
    location: "Online",
    description: "Early access to tour tickets.",
  },
  {
    id: "evt-3",
    title: "Meet & Greet",
    date: "2026-09-20",
    location: "New York",
    description: "Private meet & greet before the show.",
  },
];

export const EXCLUSIVE_CONTENT = [
  {
    id: "cnt-1",
    type: "video",
    title: "Studio Diaries",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
    excerpt: "Behind the scenes in the recording studio.",
  },
  {
    id: "cnt-2",
    type: "photo",
    title: "Tour Gallery",
    thumbnail: "https://images.unsplash.com/photo-1493225255756-d9584f8606e8?w=800",
    excerpt: "Rare photos from the latest tour.",
  },
  {
    id: "cnt-3",
    type: "audio",
    title: "Acoustic Sessions",
    thumbnail: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
    excerpt: "Unplugged recordings available for download.",
  },
];
