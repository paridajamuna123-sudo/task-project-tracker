import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { TaskProjectService } from '../services/task-project.service';

export const projectExistsGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const service = inject(TaskProjectService);

  const rawId = route.paramMap.get('userId');
  const userId = Number(rawId);

  if (!rawId || !Number.isInteger(userId) || userId <= 0) {
    return router.createUrlTree(['/projects']);
  }

  service.loadProjects();

  return service.projects$.pipe(
    take(1),
    map((projects) => {
      if (projects.length === 0) {
        return true;
      }
      const exists = projects.some((p) => p.userId === userId);
      return exists ? true : router.createUrlTree(['/projects']);
    })
  );
};