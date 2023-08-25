import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ROUTERAPI } from 'src/app/_api-router';
import * as models from 'src/app/global.model';

@Injectable({
    providedIn: "root"
})
export class GlobalService {

    token: string | null = null;

    constructor(
        private readonly router: Router,
        private readonly http: HttpClient) { }

    getAuthToken(): string {
        return localStorage.getItem('token') as string;
    }

    checkUser() {
        localStorage.getItem("token");
        this.token = localStorage.getItem("token");
        return this.token ? of(true) : of(false);
    }

    login(username: string, password: string) {
        return this.http.post(ROUTERAPI.auth, { username, password });
    }

    logout() {
        this.token = null;
        localStorage.removeItem("token");
        this.router.navigate(['login']);
    }



    registrZaer(zaerId: number) {
        return this.http.get<models.RegisterModel[]>(`${ROUTERAPI.registr}${zaerId}`);
    }

    deleteZaer(zaerId: number) {
        return this.http.get(`${ROUTERAPI.delete}${zaerId}`);
    }

    saveZaer(model: models.ZaerModel) {
        return this.http.post<number>(ROUTERAPI.saveZaer, model);
    }

    getAllZaer() {
        return this.http.get<models.TotalModel[]>(ROUTERAPI.getAllZaer);
    }

    trafficReport() {
        return this.http.get<models.TrafficSexModel[]>(ROUTERAPI.trafficReport);
    }

    teamReport() {
        return this.http.get<models.TeamReportModel[]>(ROUTERAPI.teamReport);
    }

}
