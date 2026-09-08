import { db } from './database';
import { GoalPlan, PlanMilestone } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  syncSinglePlan, 
  syncSinglePlanDelete, 
  syncSingleMilestone, 
  syncSingleMilestoneDelete 
} from './syncEngine';

/**
 * Deterministically calculate a plan's progress percentage:
 * - Macro Milestones represent equal segments of the overall roadmap (100% / N).
 * - Open milestones earn proportional progress from their completed micro-tasks (milestoneId).
 * - Fully completed milestones lock in 100% of their segment.
 * - If no milestones exist, falls back to direct linked task completion percentage.
 */
export async function calculatePlanProgress(planId: string): Promise<number> {
  try {
    const milestones = await db.planMilestones.where('planId').equals(planId).sortBy('order');
    const linkedTasks = await db.tasks.where('planId').equals(planId).toArray();

    // Case 1: Plan has defined roadmap milestones
    if (milestones.length > 0) {
      let totalMilestoneScore = 0;

      for (const m of milestones) {
        if (m.isCompleted) {
          totalMilestoneScore += 1.0;
        } else {
          // Check micro-tasks specifically assigned to this milestone
          const milestoneTasks = linkedTasks.filter((t) => t.milestoneId === m.id);
          if (milestoneTasks.length > 0) {
            const completedCount = milestoneTasks.filter((t) => t.isCompleted).length;
            totalMilestoneScore += completedCount / milestoneTasks.length;
          }
        }
      }

      return Math.min(100, Math.max(0, Math.round((totalMilestoneScore / milestones.length) * 100)));
    }

    // Case 2: Plan has no milestones, only direct linked tasks
    if (linkedTasks.length > 0) {
      const completedTasks = linkedTasks.filter((t) => t.isCompleted).length;
      return Math.min(100, Math.max(0, Math.round((completedTasks / linkedTasks.length) * 100)));
    }

    return 0;
  } catch (error) {
    console.error(`Failed to calculate progress for plan ${planId}:`, error);
    return 0;
  }
}

/**
 * Create a new goal plan and optionally its initial milestones.
 */
export async function createPlan(
  planData: Omit<GoalPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  initialMilestones?: Array<Omit<PlanMilestone, 'id' | 'planId' | 'isCompleted'> & { id?: string; isCompleted?: boolean }>
): Promise<GoalPlan> {
  const planId = planData.id || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const plan: GoalPlan = {
    ...planData,
    id: planId,
    status: planData.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.plans.put(plan);

    if (initialMilestones && initialMilestones.length > 0) {
      const milestonesToInsert: PlanMilestone[] = initialMilestones.map((m, idx) => ({
        ...m,
        id: m.id || `ms_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        planId,
        order: m.order !== undefined ? m.order : idx,
        isCompleted: m.isCompleted ?? false,
      }));

      await db.planMilestones.bulkPut(milestonesToInsert);

      if (isSupabaseConfigured()) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            syncSinglePlan(session.user.id, plan);
            milestonesToInsert.forEach((ms) => syncSingleMilestone(session.user.id, ms));
          }
        });
      }
    } else if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSinglePlan(session.user.id, plan);
        }
      });
    }

    return plan;
  } catch (error) {
    console.error('Failed to create plan:', error);
    return plan;
  }
}

/**
 * Update a plan's metadata.
 */
export async function updatePlan(id: string, partial: Partial<GoalPlan>): Promise<GoalPlan | null> {
  try {
    const existing = await db.plans.get(id);
    if (!existing) return null;

    const updated: GoalPlan = {
      ...existing,
      ...partial,
      id,
      updatedAt: new Date().toISOString(),
    };

    await db.plans.put(updated);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSinglePlan(session.user.id, updated);
        }
      });
    }

    return updated;
  } catch (error) {
    console.error('Failed to update plan:', error);
    return null;
  }
}

/**
 * Delete a plan and clean up all its milestones and linked tasks.
 */
export async function deletePlan(id: string): Promise<void> {
  try {
    await db.plans.delete(id);
    await db.planMilestones.where('planId').equals(id).delete();
    await db.tasks.where('planId').equals(id).delete();

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSinglePlanDelete(session.user.id, id);
        }
      });
    }
  } catch (error) {
    console.error('Failed to delete plan:', error);
  }
}

/**
 * Get all plans.
 */
export async function getPlans(): Promise<GoalPlan[]> {
  try {
    return await db.plans.orderBy('createdAt').reverse().toArray();
  } catch (error) {
    console.error('Failed to get plans:', error);
    return [];
  }
}

/**
 * Get active plans.
 */
export async function getActivePlans(): Promise<GoalPlan[]> {
  try {
    const all = await db.plans.toArray();
    return all.filter((p) => p.status === 'active');
  } catch (error) {
    console.error('Failed to get active plans:', error);
    return [];
  }
}

/**
 * Get milestones for a given plan.
 */
export async function getPlanMilestones(planId: string): Promise<PlanMilestone[]> {
  try {
    return await db.planMilestones.where('planId').equals(planId).sortBy('order');
  } catch (error) {
    console.error(`Failed to get milestones for plan ${planId}:`, error);
    return [];
  }
}

/**
 * Save or update a milestone.
 */
export async function saveMilestone(
  milestoneData: Omit<PlanMilestone, 'id'> & { id?: string }
): Promise<PlanMilestone> {
  const milestone: PlanMilestone = {
    ...milestoneData,
    id: milestoneData.id || `ms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };

  try {
    await db.planMilestones.put(milestone);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleMilestone(session.user.id, milestone);
        }
      });
    }

    return milestone;
  } catch (error) {
    console.error('Failed to save milestone:', error);
    return milestone;
  }
}

/**
 * Delete a single milestone.
 */
export async function deleteMilestone(milestoneId: string): Promise<void> {
  try {
    await db.planMilestones.delete(milestoneId);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleMilestoneDelete(session.user.id, milestoneId);
        }
      });
    }
  } catch (error) {
    console.error('Failed to delete milestone:', error);
  }
}

/**
 * Toggle a milestone's completion status.
 */
export async function toggleMilestoneCompletion(id: string): Promise<PlanMilestone | null> {
  try {
    const milestone = await db.planMilestones.get(id);
    if (!milestone) return null;

    const isCompleted = !milestone.isCompleted;
    const updated: PlanMilestone = {
      ...milestone,
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    };

    await db.planMilestones.put(updated);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleMilestone(session.user.id, updated);
        }
      });
    }

    return updated;
  } catch (error) {
    console.error('Failed to toggle milestone completion:', error);
    return null;
  }
}
