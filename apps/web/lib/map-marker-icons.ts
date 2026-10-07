import L from 'leaflet';

/**
 * Creates an aesthetic, branded, draggable location picker pin for MapInput.
 */
export function createPickerMarkerIcon(options?: { isDragging?: boolean; label?: string }): L.DivIcon {
  const isDragging = options?.isDragging ?? false;
  const label = options?.label ?? 'Emplacement';

  const html = `
    <div class="sakany-picker-marker ${isDragging ? 'is-dragging' : ''}" style="cursor: pointer; pointer-events: auto;">
      <!-- Ground Radar Pulse Effect -->
      <div class="marker-radar-ring"></div>
      <div class="marker-ground-dot"></div>

      <!-- Floating Guide Tooltip -->
      <div class="marker-helper-badge">
        <span class="badge-dot"></span>
        <span class="badge-text">${label}</span>
      </div>

      <!-- Teardrop SVG Pin -->
      <div class="marker-pin-body">
        <svg viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg" class="marker-svg">
          <defs>
            <linearGradient id="pickerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#E08A45" />
              <stop offset="100%" stop-color="#A85F27" />
            </linearGradient>
            <filter id="pinShadow" x="-20%" y="-10%" width="140%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#12303A" flood-opacity="0.25" />
            </filter>
          </defs>
          
          <!-- Outer Pin with Shadow -->
          <path
            d="M20 2C10.0589 2 2 10.0589 2 20C2 31.8 17.6 48.6 19.2 50.3C19.6 50.7 20.4 50.7 20.8 50.3C22.4 48.6 38 31.8 38 20C38 10.0589 29.9411 2 20 2Z"
            fill="url(#pickerGrad)"
            stroke="#FFFFFF"
            stroke-width="2.5"
            filter="url(#pinShadow)"
          />
          
          <!-- Inner White Disc -->
          <circle cx="20" cy="20" r="11" fill="#FFFFFF" />
          
          <!-- Stylized Home/Arch Icon inside -->
          <path
            d="M20 13.5L14 18V25.5C14 26.0523 14.4477 26.5 15 26.5H18V21.5C18 20.3954 18.8954 19.5 20 19.5C21.1046 19.5 22 20.3954 22 21.5V26.5H25C25.5523 26.5 26 26.0523 26 25.5V18L20 13.5Z"
            fill="#C97B3D"
          />
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'sakany-custom-div-icon',
    iconSize: [40, 52],
    iconAnchor: [20, 50],
    popupAnchor: [0, -48],
  });
}

/**
 * Creates an aesthetic, branded single listing pin for detail / overview pages.
 */
export function createListingPinIcon(options?: { isHovered?: boolean; title?: string; id?: string }): L.DivIcon {
  const isHovered = options?.isHovered ?? false;
  const id = options?.id ?? '';

  const html = `
    <div class="sakany-listing-marker ${isHovered ? 'is-hovered' : ''}" data-listing-id="${id}" style="cursor: pointer; pointer-events: auto;">
      <!-- Ground Radar Pulse -->
      <div class="marker-radar-ring ring-door"></div>
      <div class="marker-ground-dot dot-door"></div>

      <!-- Teardrop SVG Pin in Door Blue -->
      <div class="marker-pin-body">
        <svg viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="marker-svg">
          <defs>
            <linearGradient id="doorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2A73A6" />
              <stop offset="100%" stop-color="#164560" />
            </linearGradient>
            <filter id="doorShadow" x="-20%" y="-10%" width="140%" height="130%">
              <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#12303A" flood-opacity="0.22" />
            </filter>
          </defs>
          
          <path
            d="M18 2C9.16344 2 2 9.16344 2 18C2 28.5 15.8 44.8 17.2 46.3C17.6 46.7 18.4 46.7 18.8 46.3C20.2 44.8 34 28.5 34 18C34 9.16344 26.8366 2 18 2Z"
            fill="url(#doorGrad)"
            stroke="#FFFFFF"
            stroke-width="2.5"
            filter="url(#doorShadow)"
          />
          <circle cx="18" cy="18" r="9.5" fill="#FFFFFF" />
          <path
            d="M18 12.5L12.5 16.8V23C12.5 23.55 12.95 24 13.5 24H16V19.8C16 18.8 16.8 18 17.8 18H18.2C19.2 18 20 18.8 20 19.8V24H22.5C23.05 24 23.5 23.55 23.5 23V16.8L18 12.5Z"
            fill="#1F5C86"
          />
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'sakany-custom-div-icon',
    iconSize: [36, 48],
    iconAnchor: [18, 46],
    popupAnchor: [0, -44],
  });
}

/**
 * Creates an Airbnb-grade, highly aesthetic price pill marker for interactive maps.
 * Clickable, responsive, with precision ground anchor and smooth state transitions.
 */
export function createPricePillMarkerIcon(options: {
  id?: string;
  price?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  title?: string;
}): L.DivIcon {
  const { id = '', price, isHovered = false, isSelected = false } = options;
  const activeClass = isSelected ? 'is-selected is-hovered' : isHovered ? 'is-hovered' : '';

  if (!price) {
    // Fallback: Elegant compact micro-pin with house icon
    const html = `
      <div class="sakany-micro-marker ${activeClass}" data-listing-id="${id}" role="button" tabindex="0" style="cursor: pointer; pointer-events: auto;">
        <div class="micro-pin-bubble">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
            <path d="M8 1.5l-6 4.8v8.2a1 1 0 001 1h4v-5h2v5h4a1 1 0 001-1V6.3L8 1.5z"/>
          </svg>
        </div>
        <div class="marker-caret-bottom"></div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'sakany-pill-div-icon',
      iconSize: [36, 42],
      iconAnchor: [18, 40],
      popupAnchor: [0, -38],
    });
  }

  // Format price text (e.g., "450 DT" -> "450" + "DT")
  const cleanPrice = price.trim();
  const match = cleanPrice.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  const amount = match ? match[1] : cleanPrice;
  const unit = match && match[2] ? match[2] : 'DT';

  const html = `
    <div class="sakany-price-pill-marker ${activeClass}" data-listing-id="${id}" role="button" tabindex="0" style="cursor: pointer; pointer-events: auto;">
      ${isSelected ? `<div class="marker-active-ring"></div>` : ''}
      <div class="price-pill-content">
        <span class="price-dot"></span>
        <span class="price-val">${amount}</span>
        <span class="price-unit">${unit}</span>
      </div>
      <div class="price-pill-caret"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'sakany-pill-div-icon',
    iconSize: [84, 40],
    iconAnchor: [42, 38],
    popupAnchor: [0, -36],
  });
}

/**
 * Creates an aesthetic, branded University / Campus landmark icon.
 * Displays graduation cap + short name badge.
 */
export function createUniversityMarkerIcon(options: {
  name: string;
  shortName?: string;
  isHovered?: boolean;
}): L.DivIcon {
  const label = options.shortName || options.name;
  const isHovered = options.isHovered ?? false;

  const html = `
    <div class="sakany-university-marker ${isHovered ? 'is-hovered' : ''}" style="cursor: pointer; pointer-events: auto;">
      <div class="uni-marker-pill">
        <div class="uni-marker-icon-wrapper">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <span class="uni-marker-title">${label}</span>
      </div>
      <div class="uni-marker-caret"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'sakany-uni-div-icon',
    iconSize: [120, 36],
    iconAnchor: [60, 34],
    popupAnchor: [0, -32],
  });
}
