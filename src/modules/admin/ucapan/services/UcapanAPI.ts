import supabase from '@/lib/supabaseClient';
import { Ucapan, UcapanWithReplies, CreateUcapanData } from '../types/Ucapan.types';

class UcapanAPI {
  /**
   * Get all ucapan with replies (threaded)
   */
  async getUcapan(): Promise<UcapanWithReplies[]> {
    try {
      // Get all parent messages (where parent_id is null)
      const { data: parents, error: parentsError } = await supabase
        .from('ucapan')
        .select('*')
        .is('parent_id', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (parentsError) throw parentsError;

      // Get ALL replies (not just direct children)
      const { data: allReplies, error: repliesError } = await supabase
        .from('ucapan')
        .select('*')
        .not('parent_id', 'is', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // For each parent, collect ALL replies in its thread
      const ucapanWithReplies: UcapanWithReplies[] = (parents || []).map((parent) => {
        // Find all replies that belong to this thread
        const threadReplies: any[] = [];
        const replyMap = new Map();
        
        // Build a map of all replies
        (allReplies || []).forEach(reply => {
          replyMap.set(reply.id, reply);
        });
        
        // Collect all replies in this thread (recursively find all descendants)
        const collectReplies = (parentId: string) => {
          (allReplies || []).forEach(reply => {
            if (reply.parent_id === parentId && !threadReplies.find(r => r.id === reply.id)) {
              threadReplies.push(reply);
              // Recursively collect replies to this reply
              collectReplies(reply.id);
            }
          });
        };
        
        collectReplies(parent.id);
        
        return {
          ...parent,
          replies: threadReplies,
        };
      });

      return ucapanWithReplies;
    } catch (error: any) {
      console.error('Error fetching ucapan:', error);
      throw new Error(error.message || 'Failed to fetch ucapan');
    }
  }

  /**
   * Get ucapan for public display (non-deleted, with replies)
   */
  async getPublicUcapan(): Promise<UcapanWithReplies[]> {
    return this.getUcapan();
  }

  /**
   * Get specific ucapan by ID with its thread
   */
  async getUcapanById(id: string): Promise<UcapanWithReplies | null> {
    try {
      const { data: ucapan, error: ucapanError } = await supabase
        .from('ucapan')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (ucapanError) throw ucapanError;
      if (!ucapan) return null;

      // Get replies if this is a parent message
      const { data: replies, error: repliesError } = await supabase
        .from('ucapan')
        .select('*')
        .eq('parent_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      return {
        ...ucapan,
        replies: replies || [],
      };
    } catch (error: any) {
      console.error('Error fetching ucapan by ID:', error);
      throw new Error(error.message || 'Failed to fetch ucapan');
    }
  }

  /**
   * Create new ucapan (guest or admin)
   */
  async createUcapan(data: CreateUcapanData): Promise<Ucapan> {
    try {
      const { data: ucapan, error } = await supabase
        .from('ucapan')
        .insert([
          {
            nama: data.nama,
            pesan: data.pesan,
            tamu_id: data.tamu_id || null,
            user_id: data.user_id || null,
            parent_id: data.parent_id || null,
            is_admin: data.is_admin || false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return ucapan;
    } catch (error: any) {
      console.error('Error creating ucapan:', error);
      throw new Error(error.message || 'Failed to create ucapan');
    }
  }

  /**
   * Reply to existing ucapan
   */
  async replyToUcapan(parentId: string, data: CreateUcapanData): Promise<Ucapan> {
    return this.createUcapan({
      ...data,
      parent_id: parentId,
    });
  }

  /**
   * Soft delete ucapan
   */
  async deleteUcapan(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ucapan')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting ucapan:', error);
      throw new Error(error.message || 'Failed to delete ucapan');
    }
  }

  /**
   * Get unanswered ucapan (no replies from admin)
   */
  async getUnansweredUcapan(): Promise<Ucapan[]> {
    try {
      // Get all parent messages
      const { data: parents, error: parentsError } = await supabase
        .from('ucapan')
        .select('*')
        .is('parent_id', null)
        .is('deleted_at', null)
        .eq('is_admin', false)
        .order('created_at', { ascending: false });

      if (parentsError) throw parentsError;

      // Get all admin replies
      const { data: adminReplies, error: repliesError } = await supabase
        .from('ucapan')
        .select('parent_id')
        .eq('is_admin', true)
        .is('deleted_at', null);

      if (repliesError) throw repliesError;

      // Filter out parents that have admin replies
      const repliedParentIds = new Set((adminReplies || []).map((r) => r.parent_id));
      const unanswered = (parents || []).filter((p) => !repliedParentIds.has(p.id));

      return unanswered;
    } catch (error: any) {
      console.error('Error fetching unanswered ucapan:', error);
      throw new Error(error.message || 'Failed to fetch unanswered ucapan');
    }
  }
}

export default UcapanAPI;
