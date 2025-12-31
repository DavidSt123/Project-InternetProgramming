import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { CompareComponent } from './pages/compare/compare';
import { FavoritesPage } from './pages/favorites/favorites';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'compare', component: CompareComponent },
  { path: 'favorites', component: FavoritesPage },
  { path: '**', redirectTo: '' }
];
