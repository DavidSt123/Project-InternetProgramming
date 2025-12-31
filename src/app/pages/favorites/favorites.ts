import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FavoritesService, Favorite } from '../../services/favorites';
import { AirQualityService } from '../../services/air-quality';

interface FavoriteWithData extends Favorite {
  pm10?: number | null;
  pm25?: number | null;
  lastUpdated?: string | null;
  loadingData?: boolean;
  dataError?: string | null;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
  imports: [CommonModule, DecimalPipe],
})
export class FavoritesPage implements OnInit {
  favorites: FavoriteWithData[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private favoritesService: FavoritesService,
    private airQuality: AirQualityService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    this.loading = true;
    this.error = null;

    this.favoritesService.getFavorites().subscribe({
      next: (data: Favorite[]) => {
        // copy into our extended type
        this.favorites = data.map((f) => ({ ...f, loadingData: true }));
        this.loading = false;
        this.cdr.detectChanges();

        // fetch air data for each favorite
        this.favorites.forEach((fav) => this.fetchDataForFavorite(fav));
      },
      error: (err: unknown) => {
        console.error('Error loading favorites:', err);
        this.error = 'Failed to load favorites.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private fetchDataForFavorite(fav: FavoriteWithData): void {
    fav.loadingData = true;
    fav.dataError = null;

    this.airQuality
      .getAirQualityByCoordinates(fav.latitude, fav.longitude)
      .subscribe({
        next: (data: any) => {
          const hourly = data?.hourly;
          const pm10Array: number[] | undefined = hourly?.pm10;
          const pm25Array: number[] | undefined = hourly?.pm2_5;
          const timeArray: string[] | undefined = hourly?.time;

          if (
            pm10Array && pm10Array.length > 0 &&
            pm25Array && pm25Array.length > 0
          ) {
            fav.pm10 = pm10Array[pm10Array.length - 1];
            fav.pm25 = pm25Array[pm25Array.length - 1];

            if (timeArray && timeArray.length === pm10Array.length) {
              fav.lastUpdated = timeArray[timeArray.length - 1];
            }
          } else {
            fav.dataError = 'No air quality data available.';
          }

          fav.loadingData = false;
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('Error loading favorite air data:', err);
          fav.dataError = 'Failed to load air data.';
          fav.loadingData = false;
          this.cdr.detectChanges();
        },
      });
  }

  openOnHome(fav: FavoriteWithData): void {
    // For now we just navigate back to Home.
    // (If you want, we can later send the coordinates and auto-load it there.)
    this.router.navigate(['/']);
  }

  removeFavorite(fav: FavoriteWithData): void {
    if (fav.id == null) return;

    this.favoritesService.removeFavorite(fav.id).subscribe({
      next: () => {
        this.favorites = this.favorites.filter((f) => f.id !== fav.id);
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Error removing favorite', err);
      },
    });
  }
}
