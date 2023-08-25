import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalService } from 'src/app/global.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  constructor(private readonly router: Router,
    private readonly globalSvc: GlobalService) { }

  ngOnInit() {
    if (!this.globalSvc.token) {
      this.router.navigate(['login']);
    } else {
      this.router.navigate([location.pathname]);
    }
  }

}
