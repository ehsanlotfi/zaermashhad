import { Component, ElementRef, OnInit, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from 'src/app/global.service';
import * as models from 'src/app/global.model';

@Component({
  selector: 'app-traffic-registration',
  templateUrl: './traffic-registration.component.html',
  styleUrls: ['./traffic-registration.component.css']
})
export class TrafficRegistrationComponent implements OnInit {

  nationalCode: any = null;
  loading: boolean = false;
  editMode: boolean = false;

  model: models.RegisterModel = {
    fullname: "",
    nationalCode: "",
    sex: undefined,
    caravanId: 0,
    total: null,
    traffic: []
  };

  modelForm: models.RegisterModel = {
    fullname: "",
    nationalCode: "",
    sex: undefined,
    caravanId: 0,
    total: null,
    traffic: []
  };

  @ViewChildren('inputZaer') inputZaerElement: any;

  constructor(
    private readonly router: Router,
    private readonly globalSvc: GlobalService,
    private toastr: ToastrService) { }

  ngOnInit(): void {
  }

  registrZaer() {
    if (this.nationalCode.toString().length != 10) return;
    this.loading = true;


    this.globalSvc.registrZaer(this.nationalCode).subscribe((data: models.RegisterModel[]) => {

      if (data.length) {
        this.model = JSON.parse(JSON.stringify(data[0]));
        this.clear();
      } else {
        this.clear();
        this.toastr.error('خطا !', 'کاربر یافت نشد');
      }
    }, err => {
      this.clear();
      this.toastr.error('خطا !', 'کاربر یافت نشد');
    })

  }

  clear() {

    this.nationalCode = null;
    this.loading = false;
    setTimeout(() => {
      this.inputZaerElement.first.nativeElement.focus()
    }, 10)
  }

  newZaer() {
    this.editMode = true;
    this.modelForm = {
      fullname: "",
      nationalCode: "",
      sex: undefined,
      caravanId: 1,
      total: null,
      traffic: []
    };
  }

  editZaer() {
    this.editMode = true;
    this.modelForm = JSON.parse(JSON.stringify(this.model));
  }


  clearModle() {
    this.model = {
      fullname: "",
      nationalCode: "",
      sex: undefined,
      caravanId: 1,
      total: null,
      traffic: []
    };
  }

  logout() {
    this.globalSvc.logout();
  }


}
