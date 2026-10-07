import { getUniversities } from '@/lib/server-queries';
import { success } from '@/lib/auth-helpers';

// GET /api/universities — list all universities
export async function GET() {
  const universities = await getUniversities();
  return success(universities);
}
