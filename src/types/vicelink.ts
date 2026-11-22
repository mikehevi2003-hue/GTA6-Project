export type UserTier = "free" | "street" | "kingpin";

export type Language = "en" | "es";

export type LocalizedText = {
  en: string;
  es: string;
};

export type UserProfile = {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  tier: UserTier;
  isAdmin: boolean;
  preferredLang: Language;
  createdAt: string;
};

export type UserProgress = {
  favorites: string[];
  unlockedCheats: string[];
  foundPins: string[];
  plannedVehicles: string[];
  plannedProps: string[];
  unlockedTrophies: string[];
};

export type PaymentProvider = "yappy" | "tilopay" | "paguelofacil" | "stripe";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type PaymentReceipt = {
  id: string;
  provider: PaymentProvider;
  providerOrderId: string;
  tier: UserTier;
  amountUsd: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
};

export type YappyCheckoutResponse = {
  orderId: string;
  transactionId: string;
  token: string;
  documentName: string;
  amountUsd: number;
};

export type MePayload = {
  profile: UserProfile;
  progress: UserProgress;
  payments: PaymentReceipt[];
};

export type CheatCategory = "Player" | "Combat" | "Vehicles" | "World";

export type DirectionKey = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type CheatItem = {
  id: string;
  title: LocalizedText;
  category: CheatCategory;
  unlock: LocalizedText;
  howToUnlock: LocalizedText;
  desc: LocalizedText;
  seq: DirectionKey[];
};

export type PinType =
  | "Money"
  | "ATM"
  | "RareCar"
  | "Fence"
  | "EasterEgg"
  | "Collectible";

export type MapPin = {
  id: string;
  tier: UserTier;
  name: LocalizedText;
  region: string;
  type: PinType;
  icon: string;
  x: number;
  y: number;
  note: LocalizedText;
  locked?: boolean;
};

export type GlitchCategory = "Money" | "Camera" | "Stealth" | "Physics";

export type GlitchItem = {
  id: string;
  category: GlitchCategory;
  status: LocalizedText;
  isPatched?: boolean;
  title: LocalizedText;
  votes: number;
  voted?: boolean;
  warning: LocalizedText;
  steps: {
    en: string[];
    es: string[];
  };
};

export type TheoryComment = {
  id: string;
  author: string;
  authorTier?: UserTier;
  text: string;
  gifId: string;
  likes: number;
  liked?: boolean;
  createdAt: string;
};

export type TheoryPost = {
  id: string;
  title: LocalizedText;
  tag: string;
  author: string;
  authorTier?: UserTier;
  coords: string;
  body: LocalizedText;
  votes: number;
  upvoted?: boolean;
  reactions: Record<string, number>;
  comments: TheoryComment[];
  timestamp: number;
};

export type VehicleClass =
  | "Super"
  | "Sports"
  | "Muscle"
  | "Off-Road & SUV"
  | "Motorcycle"
  | "Marine"
  | "Aircraft";

export type VehicleItem = {
  id: string;
  name: string;
  class: VehicleClass;
  price: number;
  topSpeed: number;
  speedPct: number;
  accelPct: number;
  handlingPct: number;
  note: LocalizedText;
};

export type PropertyItem = {
  id: string;
  name: LocalizedText;
  region: string;
  price: number;
  dailyIncome: number;
  slots: number;
  roiDays: number;
  note: LocalizedText;
};

export type MechanicItem = {
  id: string;
  tag: LocalizedText;
  title: LocalizedText;
  desc: LocalizedText;
};

export type AnimatedGif = {
  id: string;
  icon: string;
  label: LocalizedText;
};

export type SpoilerChapter = "ch1" | "ch2" | "ch3" | "endgame";

export type AiQuotaInfo = {
  used: number;
  limit: number | null;
  unlimited: boolean;
};

export type ControlCategory =
  | "On-Foot"
  | "Combat & Weapons"
  | "Driving & Cars"
  | "Boats & Trailers"
  | "Planes & Parachuting";

export type HiddenControlItem = {
  id: string;
  category: ControlCategory;
  title: LocalizedText;
  ps5: LocalizedText;
  xbox: LocalizedText;
  ps5Keys: string[];
  xboxKeys: string[];
  tip: LocalizedText;
};

export type RadioGenre =
  | "Urbano / Reggaeton"
  | "Hip-Hop / Dirty South"
  | "World / Jazz"
  | "Afrobeats"
  | "Rock / Metal"
  | "Country"
  | "80s Pop"
  | "Electronic / Club"
  | "Talk & News"
  | "Unlockable";

export type RadioTrack = {
  id: string;
  title: string;
  artist: string;
  year?: string;
  featured?: boolean;
};

export type RadioStation = {
  id: string;
  name: string;
  genre: RadioGenre;
  hosts: string;
  vibe: LocalizedText;
  unlockNote?: LocalizedText;
  tracks: RadioTrack[];
};

export type TrophyGrade = "platinum" | "gold" | "silver" | "bronze";

export type TrophyItem = {
  id: string;
  grade: TrophyGrade;
  secret: boolean;
  missable: boolean;
  chapter?: string;
  title: LocalizedText;
  desc: LocalizedText;
  guide: LocalizedText;
};

export type CriminalProfileTier = {
  id: "professional" | "hardened" | "violent" | "psycho" | "irredeemable";
  rank: number;
  name: LocalizedText;
  badgeColor: string;
  icon: string;
  permanent?: boolean;
  behavior: LocalizedText;
  focusPerk: LocalizedText;
  policeResponse: LocalizedText;
};

export type SubmissionType =
  | "money_spot"
  | "glitch_report"
  | "easter_egg"
  | "cheat_combo"
  | "site_feedback";

export type SubmissionStatus = "pending" | "approved" | "implemented" | "rejected";

export type CommunitySubmission = {
  id: string;
  authorHandle: string;
  authorTier?: UserTier;
  submissionType: SubmissionType;
  regionOrCategory: string;
  title: string;
  details: string;
  status: SubmissionStatus;
  adminNotes: string;
  votes: number;
  upvoted?: boolean;
  isMine?: boolean;
  createdAt: string;
};

export type AdminUserRecord = {
  userId: string;
  email: string;
  handle: string;
  displayName: string;
  tier: UserTier;
  isAdmin: boolean;
  createdAt: string;
};

export type ContentPayload = {
  tier: UserTier;
  cheats: CheatItem[];
  pins: MapPin[];
  glitches: GlitchItem[];
  glitchesLocked: boolean;
  vehicles: VehicleItem[];
  vehiclesLocked: boolean;
  totalVehiclesCount: number;
  properties: PropertyItem[];
  propertiesLocked: boolean;
  socialStudioLocked: boolean;
  mechanics: MechanicItem[];
  aiQuota: AiQuotaInfo;
  controls: HiddenControlItem[];
  radioStations: RadioStation[];
  trophies: TrophyItem[];
  trophiesLocked: boolean;
  totalTrophiesCount: number;
  criminalProfileTiers: CriminalProfileTier[];
};
