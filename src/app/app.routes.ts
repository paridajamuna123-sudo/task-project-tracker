import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { ProjectList } from './features/project-list/project-list';
import { ProjectDetail } from './features/project-detail/project-detail';
import { projectExistsGuard } from './core/guards/project-exists-guard';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'projects', component: ProjectList },
  {
    path: 'projects/:userId',
    component: ProjectDetail,
    canActivate: [projectExistsGuard],
  },
  { path: '**', redirectTo: '' },
];