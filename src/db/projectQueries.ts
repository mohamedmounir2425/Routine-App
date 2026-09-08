import { db } from './database';
import { HomeProject, ProjectStep } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncSingleProject, syncSingleProjectDelete } from './syncEngine';

/**
 * Helper to deterministically compute the next action and status of a project based on its steps.
 */
export function advanceToNextAction(project: HomeProject): HomeProject {
  const steps = [...(project.steps || [])].sort((a, b) => a.order - b.order);
  const nextIncomplete = steps.find((s) => !s.isCompleted);

  if (nextIncomplete) {
    return {
      ...project,
      steps,
      nextActionId: nextIncomplete.id,
      nextActionTitle: nextIncomplete.title,
      status: project.status === 'completed' ? 'in_progress' : project.status,
    };
  }

  // All steps completed or no steps
  if (steps.length > 0 && steps.every((s) => s.isCompleted)) {
    return {
      ...project,
      steps,
      nextActionId: undefined,
      nextActionTitle: undefined,
      status: 'completed',
      completedAt: project.completedAt || new Date().toISOString(),
    };
  }

  return {
    ...project,
    steps,
    nextActionId: undefined,
    nextActionTitle: undefined,
  };
}

/**
 * Create a new home project with embedded steps.
 */
export async function createProject(
  projectData: Omit<HomeProject, 'id' | 'createdAt'> & { id?: string }
): Promise<HomeProject> {
  const id = projectData.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = new Date().toISOString();

  let project: HomeProject = {
    ...projectData,
    id,
    spaceId: projectData.spaceId || 'home',
    status: projectData.status || 'in_progress',
    steps: projectData.steps || [],
    createdAt,
  };

  project = advanceToNextAction(project);

  try {
    await db.projects.put(project);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleProject(session.user.id, project);
        }
      });
    }

    return project;
  } catch (error) {
    console.error('Failed to create project:', error);
    return project;
  }
}

/**
 * Update an existing project.
 */
export async function updateProject(id: string, partial: Partial<HomeProject>): Promise<HomeProject | null> {
  try {
    const existing = await db.projects.get(id);
    if (!existing) return null;

    let updated: HomeProject = {
      ...existing,
      ...partial,
      id,
    };

    if (partial.steps) {
      updated = advanceToNextAction(updated);
    }

    await db.projects.put(updated);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleProject(session.user.id, updated);
        }
      });
    }

    return updated;
  } catch (error) {
    console.error('Failed to update project:', error);
    return null;
  }
}

/**
 * Delete a project and optionally its linked tasks.
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    await db.projects.delete(id);
    await db.tasks.where('projectId').equals(id).delete();

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleProjectDelete(session.user.id, id);
        }
      });
    }
  } catch (error) {
    console.error('Failed to delete project:', error);
  }
}

/**
 * Get projects, optionally filtered by space ('home' | 'work').
 * Legacy records without spaceId are treated as 'home'.
 */
export async function getProjects(spaceId?: 'home' | 'work'): Promise<HomeProject[]> {
  try {
    const all = await db.projects.orderBy('createdAt').reverse().toArray();
    if (!spaceId) return all;
    return all.filter((p) => {
      const pSpace = p.spaceId || 'home';
      return pSpace === spaceId;
    });
  } catch (error) {
    console.error('Failed to get projects:', error);
    return [];
  }
}

/**
 * Get only active (non-completed) projects, optionally filtered by space ('home' | 'work').
 * Legacy records without spaceId are treated as 'home'.
 */
export async function getActiveProjects(spaceId?: 'home' | 'work'): Promise<HomeProject[]> {
  try {
    const all = await db.projects.toArray();
    return all.filter((p) => {
      if (p.status === 'completed') return false;
      if (spaceId) {
        const pSpace = p.spaceId || 'home';
        return pSpace === spaceId;
      }
      return true;
    });
  } catch (error) {
    console.error('Failed to get active projects:', error);
    return [];
  }
}

/**
 * Convenience queries for Work projects
 */
export async function getWorkProjects(): Promise<HomeProject[]> {
  return getProjects('work');
}

export async function getActiveWorkProjects(): Promise<HomeProject[]> {
  return getActiveProjects('work');
}

export async function createWorkProject(
  projectData: Omit<HomeProject, 'id' | 'createdAt' | 'spaceId'> & { id?: string }
): Promise<HomeProject> {
  return createProject({ ...projectData, spaceId: 'work' });
}

/**
 * Convenience queries for Home projects
 */
export async function getHomeProjects(): Promise<HomeProject[]> {
  return getProjects('home');
}

export async function getActiveHomeProjects(): Promise<HomeProject[]> {
  return getActiveProjects('home');
}

export async function createHomeProject(
  projectData: Omit<HomeProject, 'id' | 'createdAt' | 'spaceId'> & { id?: string }
): Promise<HomeProject> {
  return createProject({ ...projectData, spaceId: 'home' });
}

/**
 * Complete a single step in a home project and deterministically advance to the next step.
 */
export async function completeProjectStep(projectId: string, stepId: string): Promise<HomeProject | null> {
  try {
    const project = await db.projects.get(projectId);
    if (!project) return null;

    const updatedSteps: ProjectStep[] = (project.steps || []).map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
      }
      return step;
    });

    const updated = advanceToNextAction({
      ...project,
      steps: updatedSteps,
    });

    await db.projects.put(updated);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleProject(session.user.id, updated);
        }
      });
    }

    return updated;
  } catch (error) {
    console.error('Failed to complete project step:', error);
    return null;
  }
}
