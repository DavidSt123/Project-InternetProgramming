import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AirQualityService {

  private readonly baseUrl =
    'https://air-quality-api.open-meteo.com/v1/air-quality';

  constructor(private http: HttpClient) {}

  getAirQualityByCoordinates(
    latitude: number,
    longitude: number
  ): Observable<any> {

    const url = `${this.baseUrl}` +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&hourly=pm10,pm2_5`;

    return this.http.get<any>(url);
  }
}
