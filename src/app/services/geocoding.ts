import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private readonly baseUrl =
    'https://geocoding-api.open-meteo.com/v1/search';

  constructor(private http: HttpClient) {}

  search(name: string): Observable<GeocodingResponse> {
    const url =
      `${this.baseUrl}?name=${encodeURIComponent(name)}&count=5&language=en&format=json`;

    return this.http.get<GeocodingResponse>(url);
  }
}
