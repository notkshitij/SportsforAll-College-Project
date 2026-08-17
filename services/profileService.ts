import { supabase } from './supabase';
import { User } from '../types';

/**
 * Maps a full app-level User object to the `profiles` table row shape.
 */
function toProfileRow(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    enrollment: user.enrollment,
    department: user.department,
    year: user.year ?? null,
    role: user.role,
    avatar_url: user.avatarUrl ?? null,
    phone: user.phone ?? null,
    created_at: user.createdAt,
  };
}

function fromProfileRow(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    enrollment: row.enrollment,
    department: row.department,
    year: row.year ?? undefined,
    role: row.role,
    avatarUrl: row.avatar_url ?? undefined,
    phone: row.phone ?? undefined,
    createdAt: row.created_at,
  };
}

export class ProfileService {
  /**
   * Insert or update the FULL profile screen data in Supabase.
   * Safe to call on every login and every profile edit.
   */
  static async upsertProfile(user: User): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(toProfileRow(user), { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('ProfileService.upsertProfile error:', error.message);
      throw new Error(error.message);
    }

    return fromProfileRow(data);
  }

  /**
   * Fetch a single profile by user id.
   */
  static async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('ProfileService.getProfile error:', error.message);
      throw new Error(error.message);
    }

    return data ? fromProfileRow(data) : null;
  }
}
