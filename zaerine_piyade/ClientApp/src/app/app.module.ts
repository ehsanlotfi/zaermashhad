import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { TrafficRegistrationComponent } from './pages/traffic-registration/traffic-registration.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { GlobalService } from 'src/app/global.service';
import { OnlyNumberDirective } from 'src/app/directives/only-number.directive';
import { JalaliPipe } from 'src/app/pipes/moment.pipe';
import { AuthGuard } from 'src/app/guards/auth.guard';
import { InterceptorService } from './core/interceptors.service';
import { ConfirmationPopoverModule } from "angular-confirmation-popover";
export function initWithDependencyFactory(
  globalSvc: GlobalService
) {

  return () => {
    return new Promise<void>(async (resolve) => {
      globalSvc.checkUser().subscribe(
        () => { resolve(); },
        () => { resolve(); },
      )
    });
  };
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ReportsComponent,
    TrafficRegistrationComponent,
    OnlyNumberDirective,
    JalaliPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-center',
      preventDuplicates: true,
    }),
    ConfirmationPopoverModule.forRoot({
      confirmButtonType: "danger",
      closeOnOutsideClick: true,
      popoverTitle: "حذف‌کنم؟",
      popoverMessage: "",
      placement: "bottom",
      cancelText: "بیخیال",
      confirmText: "بله",
    }),
  ],
  providers: [
    AuthGuard,
    GlobalService,
    {
      provide: APP_INITIALIZER,
      useFactory: initWithDependencyFactory,
      deps: [GlobalService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptorService,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

