import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from 'src/app/global.service';
import * as models from 'src/app/global.model';


@Component({
    selector: 'app-caravan-registration',
    template: `
    <div class="row">
      <div class="col-12 bg-white py-2 d-flex">
        <div class="d-flex w-100">
          <button class="btn text-info-custom d-flex" [routerLink]="['/trafic']">
            <i class="icon-fo-arrow-right-curved2 f-20 fw-bold ms-1"></i>
            بازگشت
          </button>
        </div>
        <div>
          <div *ngIf="loading" class="spinner-border text-primary"></div>
        </div>
      </div>
    </div>

    <div class="row mt-4 mx-4">

      <div class="col-3">
        <div class="bg-white p-3 rounded-4 d-flex gap-3 flex-column align-items-center min-h-80">

          <h6 class="w-100 text-muted mb-0">
            {{ caravan.id ? 'ویرایش کاروان' : 'افزودن کاروان جدید' }}
          </h6>

          <div class="w-100">
            <input type="text" class="form-control w-100" #nameDom [(ngModel)]="caravan.name"
              placeholder="نام کاروان">
          </div>

          <div class="w-100">
            <input type="text" class="form-control w-100" [(ngModel)]="caravan.admin"
              placeholder="نام مدیر کاروان">
          </div>

          <div class="w-100">
            <input type="text" class="form-control w-100" [(ngModel)]="caravan.city"
              placeholder="شهر">
          </div>

          <div class="w-100">
            <button class="btn btn-success w-100" [disabled]="!caravan.name || !caravan.admin"
              (click)="saveCaravan()">
              {{ caravan.id ? 'ذخیره تغییرات' : 'ثبت کاروان' }}
            </button>
          </div>

          <div class="w-100" *ngIf="caravan.id">
            <button class="btn btn-outline-secondary w-100" (click)="resetForm()">
              انصراف از ویرایش
            </button>
          </div>

        </div>
      </div>

      <div class="col-9">
        <div class="bg-white p-3 rounded-4 min-h-80">
          <table class="table table-bordered w-100">
            <thead>
              <tr>
                <th class="text-muted text-center">#</th>
                <th class="text-muted text-center">نام کاروان</th>
                <th class="text-muted text-center">مدیر کاروان</th>
                <th class="text-muted text-center">شهر</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of caravanList; let i = index" [class.table-warning]="caravan.id === item.id">
                <td class="text-center">{{ i + 1 }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.admin }}</td>
                <td>{{ item.city }}</td>
                <th class="text-center">
                  <button class="btn btn-sm btn-warning" (click)="editCaravan(item)">
                    <i class="fa fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-danger me-2" (click)="deleteCaravan(item.id!)">
                    <i class="fa fa-times"></i>
                  </button>
                </th>
              </tr>
              <tr *ngIf="!loading && !caravanList.length">
                <td colspan="5" class="text-center text-muted py-4">کاروانی ثبت نشده است</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
    styles: [`
    :host {
      display: block;
    }

    .min-h-80 {
      min-height: 80vh;
    }
  `]
})
export class CaravanRegistrationComponent implements OnInit
{

    @ViewChild('nameDom', { static: true })
    nameDom!: ElementRef;


    loading = false;


    caravan: models.CaravanModel = {
        id: null,
        name: "",
        admin: "",
        city: ""
    }


    caravanList: models.CaravanModel[] = [];


    constructor(
        private readonly globalSvc: GlobalService,
        private readonly renderer: Renderer2,
        private readonly toastr: ToastrService
    )
    {

    }


    ngOnInit(): void
    {
        this.getCaravanList();
    }


    getCaravanList()
    {
        this.loading = true;


        this.globalSvc.getCaravans()
            .subscribe(
                list =>
                {
                    this.caravanList = list;
                    this.loading = false;
                },
                err =>
                {
                    this.loading = false;

                    this.toastr.error(
                        "خطا در دریافت کاروان‌ها"
                    );
                }
            );
    }


    saveCaravan()
    {
        if (!this.caravan.name)
        {
            this.toastr.warning("نام کاروان را وارد کنید");
            return;
        }


        if (!this.caravan.admin)
        {
            this.toastr.warning("نام مدیر کاروان را وارد کنید");
            return;
        }


        this.loading = true;


        this.globalSvc.saveCaravan(this.caravan)
            .subscribe(
                (result: number) =>
                {
                    if (result === 1)
                    {
                        this.finishSave();
                    }
                    else
                    {
                        this.loading = false;

                        this.toastr.error(
                            "خطا در ذخیره اطلاعات"
                        );
                    }
                },
                err =>
                {
                    this.loading = false;

                    this.toastr.error(
                        "خطا در ذخیره اطلاعات"
                    );
                }
            );
    }


    finishSave()
    {
        this.loading = false;


        this.toastr.success(
            "عملیات با موفقیت انجام شد"
        );


        this.resetForm();


        this.getCaravanList();
    }


    editCaravan(caravan: models.CaravanModel)
    {
        this.caravan = {
            ...caravan
        };


        this.renderer
            .selectRootElement(
                this.nameDom.nativeElement
            )
            .focus();
    }


    resetForm()
    {
        this.caravan = {
            id: null,
            name: "",
            admin: "",
            city: ""
        };


        this.renderer
            .selectRootElement(
                this.nameDom.nativeElement
            )
            .focus();
    }


    deleteCaravan(id: number)
    {
        if (!confirm("با حذف کاروان، تمام زائرین ثبت‌شده در آن نیز حذف خواهند شد. آیا مطمئن هستید؟"))
            return;


        this.loading = true;


        this.globalSvc.deleteCaravan(id)
            .subscribe(
                (result: number) =>
                {
                    if (result === 1)
                    {
                        this.toastr.success(
                            "کاروان حذف شد"
                        );


                        if (this.caravan.id === id)
                        {
                            this.resetForm();
                        }


                        this.getCaravanList();
                    }
                    else
                    {
                        this.loading = false;

                        this.toastr.error(
                            "خطا در حذف کاروان"
                        );
                    }
                },
                err =>
                {
                    this.loading = false;

                    this.toastr.error(
                        "خطا در حذف کاروان"
                    );
                }
            );
    }

}