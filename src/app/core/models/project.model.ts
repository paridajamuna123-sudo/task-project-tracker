export type ProjectDerivedStatus = 'Completed' | 'In Progress' | 'Not Started';

export interface Project {
  userId: number;
  title: string;
  taskCount: number;
  completedCount: number;
  pendingCount: number;
  status: ProjectDerivedStatus;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}
