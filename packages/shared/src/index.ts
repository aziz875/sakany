export enum UserRole {
  STUDENT = 'STUDENT',
  LANDLORD = 'LANDLORD',
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

export interface ListingFilters {
  minPrice?: number;
  maxPrice?: number;
  roomType?: RoomType;
  maxDistanceKm?: number;
  furnished?: boolean;
  verifiedOnly?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
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

export * from './zod-schemas';
