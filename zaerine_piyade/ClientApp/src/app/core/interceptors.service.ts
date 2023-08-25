import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { GlobalService } from 'src/app/global.service';


@Injectable()
export class InterceptorService implements HttpInterceptor {

  constructor(private authSvc: GlobalService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${this.authSvc.getAuthToken()}`
      }
    });

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.authSvc.logout();
        return throwError([]);
      })
    ) as Observable<HttpEvent<any>>;


  }
}