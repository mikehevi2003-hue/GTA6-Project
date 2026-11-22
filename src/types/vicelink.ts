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
  preferredLang: Language;
  createdAt: string;
};

export type UserProgress = {
  favorites: string[];
  unlockedCheats: string[];
  foundPins: string[];
  plannedVehicles: string[];
  plannedProps: string[];
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
};
