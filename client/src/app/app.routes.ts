import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Profile } from './profile/profile';
import { ServerError } from './server-error/server-error';
import { NotFound } from './not-found/not-found';
import { authGuard } from './_guard/auth-guard';
import { Missions } from './missions/missions';
import { MissionManager } from './missions/mission-manager/mission-manager';
import { MyCrew } from './my-crew/my-crew';
import { Dashboard } from './dashboard/dashboard';
import { Network } from './network/network';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'network', component: Network, canActivate: [authGuard] },
  {
    path: 'profile',
    component: Profile,
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'profile/:id',
    component: Profile,
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'missions',
    component: Missions,
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'chief',
    component: MissionManager,
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'my-crew',
    component: MyCrew,
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
  },
  {
    path: 'missions/:id',
    loadComponent: () =>
      import('./missions/mission-detail/mission-detail').then((m) => m.MissionDetail),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    runGuardsAndResolvers: 'always',
  },
  { path: 'server-error', component: ServerError },
  { path: '**', component: NotFound },
];
