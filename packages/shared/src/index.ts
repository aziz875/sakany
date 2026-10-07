export enum UserRole {
  STUDENT = 'STUDENT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export enum RoomType {
  CHAMBRE_COLOC = 'CHAMBRE_COLOC',
  STUDIO = 'STUDIO',
  APPARTEMENT = 'APPARTEMENT',
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  schoolVerified: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface Photo {
  id: string;
  listingId: string;
  url: string;
  sortOrder: number;
}

export interface University {
  id: string;
  name: string;
  shortName?: string | null;
  lat: number;
  lng: number;
}

export interface ListingUniversityDistance {
  universityId: string;
  universityName: string;
  distanceKm: number;
}

export interface Listing {
  id: string;
  landlordId: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  distanceToCampus: number;
  pricePerMonth: number;
  roomType: RoomType;
  furnished: boolean;
  verified: boolean;
  featured: boolean;
  createdAt: string;
  photos?: Photo[];
  landlord?: Pick<User, 'id' | 'fullName'>;
  reviewCount?: number;
  averageRating?: number;
  nearbyUniversities?: ListingUniversityDistance[];
}

export interface Review {
  id: string;
  authorId: string;
  listingId: string;
  rating: number;
  comment: string;
  createdAt: string;
  author?: Pick<User, 'id' | 'fullName'>;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface ListingFilters {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  roomType?: RoomType;
  maxDistanceKm?: number;
  furnished?: boolean;
  verifiedOnly?: boolean;
  universityId?: string;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  refreshToken?: string;
}

export interface RoommateProfile {
  id: string;
  userId: string;
  bio: string;
  budgetMin: number;
  budgetMax: number;
  targetCity: string;
  university?: string;
  moveInDate?: string;
  sleepSchedule?: string;
  cleanlinessLevel?: string;
  smokingPolicy?: string;
  guestsPolicy?: string;
  gender?: string;
  age?: number;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
  user?: Pick<User, 'id' | 'fullName'>;
}

export interface RoommateFilters {
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  university?: string;
  gender?: string;
  smokingPolicy?: string;
}

export interface ConversationSummary {
  id: string;
  otherUser: Pick<User, 'id' | 'fullName'>;
  lastMessage?: { content: string; createdAt: string; senderId: string };
  unreadCount: number;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: Pick<User, 'id' | 'fullName'>;
}

export enum NotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEW_APPLICATION = 'NEW_APPLICATION',
  APPLICATION_ACCEPTED = 'APPLICATION_ACCEPTED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
  GENERAL = 'GENERAL',
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export const ESPRIT_CAMPUS = {
  lat: 36.8981,
  lng: 10.1872,
  name: 'ESPRIT',
} as const;

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [RoomType.CHAMBRE_COLOC]: 'Chambre en colocation',
  [RoomType.STUDIO]: 'Studio',
  [RoomType.APPARTEMENT]: 'Appartement',
};

export const SLEEP_SCHEDULE_LABELS: Record<string, string> = {
  early_bird: 'Lève-tôt 🌅',
  night_owl: 'Couche-tard 🌙',
  flexible: 'Flexible 🔄',
};

export const CLEANLINESS_LABELS: Record<string, string> = {
  very_clean: 'Très propre ✨',
  moderate: 'Modéré 🧹',
  relaxed: 'Détendu 😎',
};

export const SMOKING_LABELS: Record<string, string> = {
  no_smoking: 'Non-fumeur 🚭',
  outside_ok: 'Dehors OK 🚬',
  no_preference: 'Pas de préférence',
};

export const GUESTS_LABELS: Record<string, string> = {
  no_guests: 'Pas d\'invités',
  occasional: 'Occasionnellement 👥',
  anytime: 'Quand ils veulent 🎉',
};

export * from './zod-schemas';
