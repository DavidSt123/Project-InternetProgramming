import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AirQualityService } from '../../services/air-quality';

type CardState = {
  loading: boolean;
  error: string | null;
  pm10: number | null;
  pm25: number | null;
  lastUpdated: string | null;
  statusLabel: string | null;
  statusClass: string;
};

type SearchResultCity = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

@Component({
  selector: 'app-compare',
  standalone: true,
  templateUrl: './compare.html',
  styleUrl: './compare.css',
  imports: [CommonModule, DecimalPipe],
})
export class CompareComponent implements OnInit {

  // What we show above each card
  topCityLabel = 'Skopje';
  bottomCityLabel = 'London';

  // Card data
  top: CardState = this.createEmptyCard();
  bottom: CardState = this.createEmptyCard();

  // Search state for TOP city
  topSearchLoading = false;
  topSearchMessage: string | null = null;
  topSearchError: string | null = null;
  topSearchResults: SearchResultCity[] = [];

  // Search state for BOTTOM city
  bottomSearchLoading = false;
  bottomSearchMessage: string | null = null;
  bottomSearchError: string | null = null;
  bottomSearchResults: SearchResultCity[] = [];

  constructor(
    private airQuality: AirQualityService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // default comparison Skopje vs London using coordinates
    this.loadFor('top', 41.9981, 21.4254, 'Skopje');
    this.loadFor('bottom', 51.5074, -0.1278, 'London');
  }

  // ------------ UI helpers ------------

  get pm25Difference(): number | null {
    if (this.top.pm25 == null || this.bottom.pm25 == null) return null;
    return Math.abs(this.top.pm25 - this.bottom.pm25);
  }

  get summarySentence(): string | null {
    if (this.top.pm25 == null || this.bottom.pm25 == null) return null;

    const topName = this.topCityLabel;
    const bottomName = this.bottomCityLabel;

    if (this.top.pm25 < this.bottom.pm25) {
      return `${topName} currently has cleaner air than ${bottomName}.`;
    } else if (this.top.pm25 > this.bottom.pm25) {
      return `${bottomName} currently has cleaner air than ${topName}.`;
    } else {
      return `${topName} and ${bottomName} currently have similar PM2.5 levels.`;
    }
  }

  // ------------ Search any city (top / bottom) ------------

  onSearchCity(position: 'top' | 'bottom', rawQuery: string): void {
    const query = rawQuery.trim();
    if (!query) return;

    const url = 'https://geocoding-api.open-meteo.com/v1/search';

    const setLoading = (value: boolean) => {
      if (position === 'top') this.topSearchLoading = value;
      else this.bottomSearchLoading = value;
    };
    const setError = (msg: string | null) => {
      if (position === 'top') this.topSearchError = msg;
      else this.bottomSearchError = msg;
    };
    const setMessage = (msg: string | null) => {
      if (position === 'top') this.topSearchMessage = msg;
      else this.bottomSearchMessage = msg;
    };
    const setResults = (results: SearchResultCity[]) => {
      if (position === 'top') this.topSearchResults = results;
      else this.bottomSearchResults = results;
    };

    setLoading(true);
    setError(null);
    setMessage(null);
    setResults([]);

    this.http.get<any>(url, {
      params: {
        name: query,
        count: 5,
        language: 'en',
        format: 'json'
      }
    }).subscribe({
      next: (response: any) => {
        const list: any[] = response?.results ?? [];
        if (!list.length) {
          setMessage('No cities found.');
        } else {
          const mapped: SearchResultCity[] = list.map((r, index) => ({
            id: String(r.id ?? `${r.name}-${r.latitude}-${r.longitude}-${index}`),
            name: r.name,
            country: r.country ?? '',
            latitude: r.latitude,
            longitude: r.longitude
          }));
          setResults(mapped);
          setMessage(`Found ${mapped.length} option(s).`);
        }
        setLoading(false);
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Compare city search error', err);
        setError('Failed to search city. Please try again.');
        setLoading(false);
        this.cdr.detectChanges();
      }
    });
  }

  useSearchResult(position: 'top' | 'bottom', city: SearchResultCity): void {
    const label = city.country ? `${city.name}, ${city.country}` : city.name;
    this.loadFor(position, city.latitude, city.longitude, label);

    // hide results after choosing
    if (position === 'top') {
      this.topSearchResults = [];
      this.topSearchMessage = null;
    } else {
      this.bottomSearchResults = [];
      this.bottomSearchMessage = null;
    }
  }

  // ------------ Loading logic ------------

  private createEmptyCard(): CardState {
    return {
      loading: true,
      error: null,
      pm10: null,
      pm25: null,
      lastUpdated: null,
      statusLabel: null,
      statusClass: '',
    };
  }

  /**
   * position: 'top' or 'bottom'
   * label: what to show as city name above the card
   */
  private loadFor(
    position: 'top' | 'bottom',
    latitude: number,
    longitude: number,
    label: string
  ): void {
    const card = position === 'top' ? this.top : this.bottom;

    // update label
    if (position === 'top') {
      this.topCityLabel = label;
    } else {
      this.bottomCityLabel = label;
    }

    // reset state for this card
    card.loading = true;
    card.error = null;
    card.pm10 = null;
    card.pm25 = null;
    card.lastUpdated = null;
    card.statusLabel = null;
    card.statusClass = '';

    this.airQuality
      .getAirQualityByCoordinates(latitude, longitude)
      .subscribe({
        next: (data: any) => {
          try {
            const hourly = data?.hourly;
            const pm10Array: number[] | undefined = hourly?.pm10;
            const pm25Array: number[] | undefined = hourly?.pm2_5;
            const timeArray: string[] | undefined = hourly?.time;

            if (
              pm10Array && pm10Array.length > 0 &&
              pm25Array && pm25Array.length > 0
            ) {
              card.pm10 = pm10Array[pm10Array.length - 1];
              card.pm25 = pm25Array[pm25Array.length - 1];

              if (timeArray && timeArray.length === pm10Array.length) {
                card.lastUpdated = timeArray[timeArray.length - 1];
              }

              this.updateStatus(card);
            } else {
              card.error = 'No air quality data available';
            }
          } catch (e) {
            console.error('Compare parse error', e);
            card.error = 'Failed to parse air quality data';
          } finally {
            card.loading = false;
            this.cdr.detectChanges();
          }
        },
        error: (err: unknown) => {
          console.error('Compare error', err);
          card.error = 'Failed to load air quality data';
          card.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // same thresholds as Home
  private updateStatus(card: CardState): void {
    if (card.pm25 == null) {
      card.statusLabel = null;
      card.statusClass = '';
      return;
    }

    const pm = card.pm25;

    if (pm <= 12) {
      card.statusLabel = 'Good';
      card.statusClass = 'status-good';
    } else if (pm <= 35) {
      card.statusLabel = 'Moderate';
      card.statusClass = 'status-moderate';
    } else if (pm <= 55) {
      card.statusLabel = 'Unhealthy for sensitive groups';
      card.statusClass = 'status-usg';
    } else {
      card.statusLabel = 'Unhealthy';
      card.statusClass = 'status-unhealthy';
    }
  }
}
