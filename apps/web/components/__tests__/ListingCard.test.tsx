import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListingCard } from '../ListingCard';
import { RoomType } from '@sakany/shared';

// Mock next/image — it doesn't work in jsdom
vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock FavoriteButton (client-side only, not relevant for these tests)
vi.mock('../FavoriteButton', () => ({
  FavoriteButton: () => <button aria-label="Ajouter aux favoris" />,
}));

// Mock VerifiedBadge
vi.mock('../VerifiedBadge', () => ({
  VerifiedBadge: () => <span>Vérifié</span>,
}));

const baseListing = {
  id: 'listing-1',
  landlordId: 'landlord-1',
  title: 'Studio proche ESPRIT',
  description: 'Un beau studio.',
  lat: 36.898,
  lng: 10.188,
  distanceToCampus: 0.3,
  pricePerMonth: 450,
  roomType: RoomType.STUDIO,
  furnished: true,
  verified: true,
  featured: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  photos: [{ id: 'p1', listingId: 'listing-1', url: '/photo.jpg', sortOrder: 0 }],
};

describe('ListingCard', () => {
  it('renders the listing title', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByRole('heading', { name: 'Studio proche ESPRIT' })).toBeInTheDocument();
  });

  it('renders the price', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText(/450/)).toBeInTheDocument();
  });

  it('renders the room type label', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText('Studio')).toBeInTheDocument();
  });

  it('renders "Meublé" badge when furnished', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText('Meublé')).toBeInTheDocument();
  });

  it('does NOT render "Meublé" badge when not furnished', () => {
    render(<ListingCard listing={{ ...baseListing, furnished: false }} />);
    expect(screen.queryByText('Meublé')).not.toBeInTheDocument();
  });

  it('renders verified badge when listing is verified', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText('Vérifié')).toBeInTheDocument();
  });

  it('does NOT render verified badge when listing is not verified', () => {
    render(<ListingCard listing={{ ...baseListing, verified: false }} />);
    expect(screen.queryByText('Vérifié')).not.toBeInTheDocument();
  });

  it('shows "Pas de photo" when there are no photos', () => {
    render(<ListingCard listing={{ ...baseListing, photos: [] }} />);
    expect(screen.getByLabelText('Aucune photo disponible')).toBeInTheDocument();
  });

  it('has an accessible article label containing the title and price', () => {
    render(<ListingCard listing={baseListing} />);
    const article = screen.getByRole('article', {
      name: /Studio proche ESPRIT/i,
    });
    expect(article).toBeInTheDocument();
  });

  it('renders distance to campus', () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText(/0\.3 km/)).toBeInTheDocument();
  });
});
