import { HttpClient } from '@angular/common/http';
import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ROUTERAPI } from 'src/app/_api-router';
import * as models from 'src/app/global.model';

@Injectable({
  providedIn: 'root',
})
export class GlobalService {
  token: string | null = null;

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient
  ) {}

  getAuthToken(): string {
    return localStorage.getItem('token') as string;
  }

  checkUser() {
    localStorage.getItem('token');
    this.token = localStorage.getItem('token');
    return this.token ? of(true) : of(false);
  }

  login(username: string, password: string) {
    return this.http.post(ROUTERAPI.auth, { username, password });
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    this.router.navigate(['login']);
  }

  registrZaer(barcode: string) {
    return this.http.get<models.RegisterModel[]>(
      `${ROUTERAPI.registr}${barcode}`
    );
  }

  deleteZaer(id: number) {
    return this.http.get(`${ROUTERAPI.delete}${id}`);
  }

  compressImgae(imageFile: File) {
    const formData = new FormData();
    formData.append('imageFile', imageFile);

    return this.http.post(ROUTERAPI.compress, formData, {
      responseType: 'text',
    });
  }

  saveZaer(model: models.ZaerModel) {
    return this.http.post<string>(ROUTERAPI.saveZaer, model);
  }

  uploadZaerImage(zaerId: number, formData: FormData): Observable<any> {
    return this.http.post(ROUTERAPI.upload + zaerId, formData);
  }

  deleteZaerImage(zaerId: number): Observable<any> {
    return this.http.delete(ROUTERAPI.saveZaer);
  }

  getAllZaer() {
    return this.http.get<models.TotalModel[]>(ROUTERAPI.getAllZaer);
  }

  zaerList(caravanId: number) {
    return this.http.get<models.ZaerModel[]>(
      `${ROUTERAPI.zaerList}${caravanId}`
    );
  }

  trafficReport() {
    return this.http.get<models.TrafficSexModel[]>(ROUTERAPI.trafficReport);
  }

  teamReport() {
    return this.http.get<models.TeamReportModel[]>(ROUTERAPI.teamReport);
  }

  getCaravans(): Observable<models.CaravanModel[]> {
    return of([
      { id: 1, name: 'انصارالمهدی', admin: 'آقای یعقوبی' },
      { id: 2, name: 'محبان حضرت معصومه (س)', admin: 'خانم اصغری' },
      { id: 3, name: 'چهارده معصوم (ع)', admin: 'خانم اسکندری ثانی' },
      { id: 4, name: 'حضرت رقیه (س)', admin: 'خانم فرزین' },
      { id: 5, name: 'منتظران ظهور', admin: 'آقای اسکندری' },
      { id: 6, name: 'منتظران ظهور2', admin: 'خانم اسکندری' },
      // { id: 7, name: "قمر بنی هاشم (ع)", admin: "آقای یادگاری" },
      { id: 8, name: 'حضرت فاطمه الزهرا (س)', admin: 'خانم عرب خزایی' },
      { id: 9, name: 'ثارالله', admin: 'خانم توکلی' },
      { id: 10, name: 'ثاره الله2', admin: 'آقای کراتی' },
      { id: 11, name: 'حضرت معصومه (س)', admin: 'خانم بذرگر' },
      { id: 12, name: 'امام زین العابدین', admin: 'خانم زین العابدین' },
      { id: 13, name: 'پیروان حضرت زهرا (س)', admin: 'آقای دهقان پور' },
      { id: 14, name: 'خدام خواهران', admin: 'خانم علوی' },
      { id: 15, name: 'خدام برادران', admin: 'آقای حسین زاده' },
      { id: 16, name: 'حضرت زینب (س)', admin: 'زهرا آذری' },
      { id: 17, name: 'خادمین', admin: 'هئیت' },
      { id: 18, name: 'متوسلین حضرت رقیه', admin: 'خانم شهربانو بهلولی' },
      { id: 19, name: 'عاشقان ثارالله', admin: 'حسن آذریان' },
      { id: 20, name: 'حضرت علی اکبر علیه السلام', admin: 'حسین علیمیرزایی' },
    ]);
  }
}

@Pipe({
  name: 'caravan',
})
export class CaravanIdiPipe implements PipeTransform {
  transform(caravanId: number, type: 'name' | 'admin'): string {
    if (!caravanId) return '';

    const caravans = [
      { id: 1, name: 'انصارالمهدی', admin: 'آقای یعقوبی' },
      { id: 2, name: 'محبان حضرت معصومه (س)', admin: 'خانم اصغری' },
      { id: 3, name: 'چهارده معصوم (ع)', admin: 'خانم اسکندری ثانی' },
      { id: 4, name: 'حضرت رقیه (س)', admin: 'خانم فرزین' },
      { id: 5, name: 'منتظران ظهور', admin: 'آقای اسکندری' },
      { id: 6, name: 'منتظران ظهور', admin: 'خانم اسکندری' },
      // { id: 7, name: 'قمر بنی هاشم (ع)', admin: 'آقای یادگاری' },
      { id: 8, name: 'حضرت فاطمه الزهرا (س)', admin: 'خانم عرب قرایی' },
      { id: 9, name: 'ثارالله', admin: 'خانم توکلی' },
      { id: 10, name: 'ثاره الله', admin: 'آقای کراتی' },
      { id: 11, name: 'حضرت معصومه (س)', admin: 'خانم برزگر' },
      { id: 12, name: 'امام زین العابدین', admin: 'خانم زین العابدین' },
      { id: 13, name: 'پیروا حضرت زهرا (س)', admin: 'آقای دهقان پور' },
      { id: 14, name: 'خدام خواهران', admin: 'خانم علوی' },
      { id: 15, name: 'خدام برادران', admin: 'آقای حسین زاده' },
      { id: 16, name: 'حضرت زینب (س)', admin: 'زهرا آذری' },
      { id: 17, name: 'خادمین', admin: 'هئیت' },
      { id: 18, name: 'متوسلین حضرت رقیه', admin: 'خانم شهربانو بهلولی' },
      { id: 19, name: 'عاشقان ثارالله', admin: 'حسن آذریان' },
      { id: 20, name: 'حضرت علی اکبر علیه السلام', admin: 'حسین علیمیرزایی' }
    ];

    return caravans.find((f) => f.id == caravanId)![type].toString();
  }
}
