import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AirQualityService } from '../../services/air-quality';
import { FavoritesService, Favorite } from '../../services/favorites';
import { GeolocationService } from '../../services/geolocation';

type SearchResultCity = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.css',
  imports: [CommonModule, DecimalPipe],
})
export class HomeComponent implements OnInit {
  // what the card is currently showing
  cityName = 'Skopje';
  currentLat: number | null = 41.9981;
  currentLon: number | null = 21.4254;

  pm10: number | null = null;
  pm25: number | null = null;
  lastUpdated: string | null = null;

  loading = true;
  error: string | null = null;

  statusLabel: string | null = null;
  statusClass = '';
  statusAdvice: string | null = null;

  favorites: Favorite[] = [];

  // chart
  pm25History: number[] = [];
  pm25Min: number | null = null;
  pm25Max: number | null = null;
  sparklinePoints: string | null = null;

  // geolocation
  locationLoading = false;
  locationMessage: string | null = null;

  // search-any-city
  searchLoading = false;
  searchMessage: string | null = null;
  searchError: string | null = null;
  searchResults: SearchResultCity[] = [];

  // ⭐ is the *current coordinates* in favorites?
  get isCurrentFavorite(): boolean {
    if (this.currentLat == null || this.currentLon == null) return false;

    return this.favorites.some(
      (f) =>
        Math.abs(f.latitude - this.currentLat!) < 0.0001 &&
        Math.abs(f.longitude - this.currentLon!) < 0.0001
    );
  }

  constructor(
    private airQualityService: AirQualityService,
    private favoritesService: FavoritesService,
    private geo: GeolocationService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  // ---------- Lifecycle ----------

  ngOnInit(): void {
    this.loadFavorites();

    this.route.queryParams.subscribe((params) => {
      const latParam = params['lat'];
      const lonParam = params['lon'];
      const labelParam = params['label'];

      if (latParam != null && lonParam != null) {
        const lat = Number(latParam);
        const lon = Number(lonParam);

        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          this.cityName = labelParam || 'Selected location';
          this.currentLat = lat;
          this.currentLon = lon;
          this.locationMessage = null;

          this.resetMainState();
          this.fetchAirQuality(lat, lon);
          return;
        }
      }

      // Default initial load (Skopje / whatever currentLat,currentLon are)
      if (this.currentLat != null && this.currentLon != null) {
        this.resetMainState();
        this.fetchAirQuality(this.currentLat, this.currentLon);
      }
    });
  }

  // ---------- Main fetch / state helpers ----------

  private resetMainState(): void {
    this.loading = true;
    this.error = null;
    this.pm10 = null;
    this.pm25 = null;
    this.lastUpdated = null;
    this.statusLabel = null;
    this.statusClass = '';
    this.statusAdvice = null;
    this.pm25History = [];
    this.pm25Min = null;
    this.pm25Max = null;
    this.sparklinePoints = null;
  }

  private fetchAirQuality(latitude: number, longitude: number): void {
    this.airQualityService
      .getAirQualityByCoordinates(latitude, longitude)
      .subscribe({
        next: (data: any) => {
          const hourly = data?.hourly;
          const pm10Array: number[] | undefined = hourly?.pm10;
          const pm25Array: number[] | undefined = hourly?.pm2_5;
          const timeArray: string[] | undefined = hourly?.time;

          if (pm10Array && pm10Array.length > 0 &&
              pm25Array && pm25Array.length > 0) {
            this.pm10 = pm10Array[pm10Array.length - 1];
            this.pm25 = pm25Array[pm25Array.length - 1];

            if (timeArray && timeArray.length === pm10Array.length) {
              this.lastUpdated = timeArray[timeArray.length - 1];
            }

            this.updateFromHourlyData(pm25Array);
            this.updateStatus();
          } else {
            this.error = 'No air quality data available';
          }

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('Error fetching air quality data:', err);
          this.error = 'Failed to load air quality data';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private updateFromHourlyData(pm25Array: number[]): void {
    const sliceCount = Math.min(12, pm25Array.length);
    this.pm25History = pm25Array.slice(pm25Array.length - sliceCount);

    if (this.pm25History.length === 0) {
      this.pm25Min = null;
      this.pm25Max = null;
      this.sparklinePoints = null;
      return;
    }

    this.pm25Min = Math.min(...this.pm25History);
    this.pm25Max = Math.max(...this.pm25History);

    const range = (this.pm25Max - this.pm25Min) || 1;
    const stepX = 100 / Math.max(this.pm25History.length - 1, 1);

    const pts = this.pm25History.map((value, index) => {
      const x = index * stepX;
      const normalized = (value - (this.pm25Min as number)) / range;
      const y = 40 - normalized * 30; // keep a bit of top padding
      return `${x},${y}`;
    });

    this.sparklinePoints = pts.join(' ');
  }

  // ---------- Favorites (by label + coordinates) ----------

  private loadFavorites(): void {
    this.favoritesService.getFavorites().subscribe({
      next: (data: Favorite[]) => {
        this.favorites = data;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Error loading favorites:', err);
      },
    });
  }

  toggleFavorite(): void {
    if (this.currentLat == null || this.currentLon == null) return;

    const existing = this.favorites.find(
      (f) =>
        Math.abs(f.latitude - this.currentLat!) < 0.0001 &&
        Math.abs(f.longitude - this.currentLon!) < 0.0001
    );

    if (existing && existing.id != null) {
      // remove
      this.favoritesService.removeFavorite(existing.id).subscribe({
        next: () => {
          this.favorites = this.favorites.filter((f) => f.id !== existing.id);
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('❌ Error removing favorite:', err);
        },
      });
    } else {
      // add
      const payload = {
        label: this.cityName,
        latitude: this.currentLat,
        longitude: this.currentLon,
      };

      this.favoritesService.addFavorite(payload).subscribe({
        next: (created: Favorite) => {
          this.favorites.push(created);
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('❌ Error adding favorite:', err);
        },
      });
    }
  }

  useFavorite(fav: Favorite): void {
    this.cityName = fav.label;
    this.currentLat = fav.latitude;
    this.currentLon = fav.longitude;
    this.locationMessage = null;

    this.resetMainState();
    this.fetchAirQuality(fav.latitude, fav.longitude);
  }

  // ---------- Status / advice ----------

  private updateStatus(): void {
    if (this.pm25 == null) {
      this.statusLabel = null;
      this.statusClass = '';
      this.statusAdvice = null;
      return;
    }

    const pm = this.pm25;

    if (pm <= 12) {
      this.statusLabel = 'Good';
      this.statusClass = 'status-good';
      this.statusAdvice = 'Air quality is good. Enjoy outdoor activities.';
    } else if (pm <= 35) {
      this.statusLabel = 'Moderate';
      this.statusClass = 'status-moderate';
      this.statusAdvice =
        'Air quality is acceptable. Sensitive groups should limit long outdoor exertion.';
    } else if (pm <= 55) {
      this.statusLabel = 'Unhealthy for sensitive groups';
      this.statusClass = 'status-usg';
      this.statusAdvice =
        'Sensitive groups should avoid prolonged outdoor exertion; others should reduce it if possible.';
    } else {
      this.statusLabel = 'Unhealthy';
      this.statusClass = 'status-unhealthy';
      this.statusAdvice =
        'Everyone should reduce outdoor exertion and consider staying indoors with windows closed.';
    }
  }

  // ---------- Geolocation (Use my location) ----------

  detectMyLocation(): void {
    if (this.locationLoading) return;

    this.locationMessage = null;
    this.locationLoading = true;
    this.cdr.detectChanges();

    this.geo.getCurrentPosition().subscribe({
      next: ({ latitude, longitude }) => {
        this.cityName = 'Your location';
        this.currentLat = latitude;
        this.currentLon = longitude;
        this.locationMessage = 'Using your device location.';

        this.resetMainState();
        this.fetchAirQuality(latitude, longitude);

        this.locationLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Geolocation error:', err);
        if (err && err.code === 1) {
          this.locationMessage = 'Location permission was denied.';
        } else {
          this.locationMessage = 'Could not detect your location.';
        }
        this.locationLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ---------- Global search (Open-Meteo geocoding) ----------

  onSearchCity(rawQuery: string): void {
    const query = rawQuery.trim();
    if (!query) return;

    this.searchLoading = true;
    this.searchError = null;
    this.searchMessage = null;
    this.searchResults = [];

    const url = 'https://geocoding-api.open-meteo.com/v1/search';

    this.http
      .get<any>(url, {
        params: {
          name: query,
          count: 5,
          language: 'en',
          format: 'json',
        },
      })
      .subscribe({
        next: (response: any) => {
          const list: any[] = response?.results ?? [];
          if (!list.length) {
            this.searchMessage = 'No cities found.';
          } else {
            this.searchResults = list.map((r, index) => ({
              id: String(
                r.id ?? `${r.name}-${r.latitude}-${r.longitude}-${index}`
              ),
              name: r.name,
              country: r.country ?? '',
              latitude: r.latitude,
              longitude: r.longitude,
            }));
            this.searchMessage = `Found ${this.searchResults.length} option(s).`;
          }
          this.searchLoading = false;
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          console.error('City search error', err);
          this.searchError = 'Failed to search city. Please try again.';
          this.searchLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  useSearchResult(city: SearchResultCity): void {
    this.cityName = city.country
      ? `${city.name}, ${city.country}`
      : city.name;

    this.currentLat = city.latitude;
    this.currentLon = city.longitude;

    this.resetMainState();
    this.fetchAirQuality(city.latitude, city.longitude);
  }
}
