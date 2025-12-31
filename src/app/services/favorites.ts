import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Favorite {
  id?: number;          // we’ll generate this
  label: string;        // city name, e.g. "Skopje" or "Berlin, Germany"
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'aqt:favorites';

  constructor() {}

  // --- helpers to read/write localStorage ---

  private readFavorites(): Favorite[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  }

  private writeFavorites(list: Favorite[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore quota / private mode errors
    }
  }

  private nextId(list: Favorite[]): number {
    const max = list.reduce(
      (acc, f) => (typeof f.id === 'number' && f.id > acc ? f.id : acc),
      0
    );
    return max + 1;
  }

  // --- public API used by Home & Favorites pages ---

  getFavorites(): Observable<Favorite[]> {
    const list = this.readFavorites();
    return of(list);
  }

  addFavorite(fav: Omit<Favorite, 'id'>): Observable<Favorite> {
    const list = this.readFavorites();
    const newFav: Favorite = {
      ...fav,
      id: this.nextId(list),
    };
    const updated = [...list, newFav];
    this.writeFavorites(updated);
    return of(newFav);
  }

  removeFavorite(id: number): Observable<void> {
    const list = this.readFavorites();
    const updated = list.filter((f) => f.id !== id);
    this.writeFavorites(updated);
    return of(void 0);
  }
}
