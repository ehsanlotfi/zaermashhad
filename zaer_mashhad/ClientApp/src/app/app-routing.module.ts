import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { TrafficRegistrationComponent } from './pages/traffic-registration/traffic-registration.component';
import { ZaerRegistrationComponent } from './pages/zaer-registration/zaer-registration.component';


const routes: Routes = [
  { path: '', redirectTo: 'trafic', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'reports', component: ReportsComponent, canActivate:[AuthGuard] },
  { path: 'trafic', component: TrafficRegistrationComponent, canActivate:[AuthGuard] },
  { path: 'zaer', component: ZaerRegistrationComponent, canActivate:[AuthGuard] },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }