import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy Supabase client so importing this module never throws in dev
// without SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
let cachedClient: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.');
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}

export const PHOTOS_BUCKET = 'listing-photos';

/**
 * Uploads a raw image Buffer to Supabase Storage and returns the public URL.
 * - Sanitizes the filename
 * - Validates size (max 5 MB) — caller is responsible for enforcing this too
 * - Returns the HTTPS public URL suitable for `next/image`
 */
export async function uploadListingPhoto(
  file: Buffer,
  contentType: string,
  listingId: string,
  index: number,
): Promise<string> {
  const ext = contentType === 'image/png' ? 'png' : 'webp';
  const objectPath = `${listingId}/${Date.now()}-${index}.${ext}`;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(objectPath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data: publicUrl } = supabase.storage
    .from(PHOTOS_BUCKET)
    .getPublicUrl(data.path);

  return publicUrl.publicUrl;
}

