import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from 'src/app/global.service';
import * as models from 'src/app/global.model';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  showPass: boolean = false;

  model: { username: string, password: string } = {
    username: "",
    password: ""
  }

  constructor(
    private readonly router: Router,
    private readonly globalSvc: GlobalService,
    private toastr: ToastrService) { }

  ngOnInit(): void {
  }

  login() {
    this.globalSvc.login(this.model.username, this.model.password).subscribe((res: any) => {
      localStorage.setItem("token", res.token);
      this.globalSvc.checkUser().subscribe();
      this.router.navigate(['/']);
    }, err => {
      this.toastr.error('خطا !', 'کاربر یافت نشد');
    });
  }

}
