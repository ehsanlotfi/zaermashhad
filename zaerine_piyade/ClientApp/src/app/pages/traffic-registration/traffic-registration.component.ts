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

  zaerId: any = null;
  loading: boolean = false;
  editMode: boolean = false;

  model: models.RegisterModel = {
    fullname: "",
    nationalCode: "",
    sex: undefined,
    team: "",
    teamAdmin: "",
    total: null,
    traffic: []
  };

  modelForm: models.RegisterModel = {
    fullname: "",
    nationalCode: "",
    sex: undefined,
    team: "",
    teamAdmin: "",
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
    if (this.zaerId.toString().length != 4) return;
    this.loading = true;


    this.globalSvc.registrZaer(+this.zaerId).subscribe((data: models.RegisterModel[]) => {

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

    this.zaerId = null;
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
      team: "",
      teamAdmin: "",
      total: null,
      traffic: []
    };
  }

  editZaer() {
    this.editMode = true;
    this.modelForm = JSON.parse(JSON.stringify(this.model));
  }

  saveZaer() {
    this.globalSvc.saveZaer(this.modelForm).subscribe((id: number) => {
      this.model.id = id;
      this.modelForm.id = id;
      this.model = JSON.parse(JSON.stringify(this.modelForm));
      this.editMode = false;
      this.toastr.success("عملیات با موفقیت انجام شد");
    }, err => {
      this.toastr.error("خطایی رخ داده است");
    });
  }

  deleteZaer() {
    this.globalSvc.deleteZaer(this.modelForm.id as number).subscribe((id: any) => {
      this.editMode = false;
      this.clearModle();
      this.toastr.success("عملیات با موفقیت انجام شد");
    }, err => {
      this.toastr.error("خطایی رخ داده است");
    });
  }

  clearModle() {
    this.model = {
      fullname: "",
      nationalCode: "",
      sex: undefined,
      team: "",
      teamAdmin: "",
      total: null,
      traffic: []
    };
  }

  logout() {
    this.globalSvc.logout();
  }


}
