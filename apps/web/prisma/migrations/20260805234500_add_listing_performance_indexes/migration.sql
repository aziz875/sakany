-- Speed up public listing sorting and owner dashboard queries.
CREATE INDEX "Listing_featured_createdAt_idx" ON "Listing"("featured", "createdAt");
CREATE INDEX "Listing_landlordId_featured_createdAt_idx" ON "Listing"("landlordId", "featured", "createdAt");
CREATE INDEX "Review_listingId_createdAt_idx" ON "Review"("listingId", "createdAt");
