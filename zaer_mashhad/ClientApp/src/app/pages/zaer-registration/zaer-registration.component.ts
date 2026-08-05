import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from 'src/app/global.service';
import * as models from 'src/app/global.model';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-zaer-registration',
  templateUrl: './zaer-registration.component.html',
  styleUrls: ['./zaer-registration.component.css'],
})
export class ZaerRegistrationComponent implements OnInit {
  @ViewChild('nationalCodeDom', { static: true })
  nationalCodeDom!: ElementRef;

  loading = false;

  caravans: models.CaravanModel[] = [];

  sexs = [
    {
      id: 0,
      name: 'خانم',
    },
    {
      id: 1,
      name: 'آقا',
    },
  ];

  zaer: models.ZaerModel = new models.ZaerModel();
  temp_caravanID: any = -1;

  zaerList: models.ZaerModel[] = [];

  selectedImage?: File;

  searchAny = '';
  excel = false;

  constructor(
    private readonly globalSvc: GlobalService,
    private readonly renderer: Renderer2,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadCaravans();
  }

  loadCaravans() {
    this.globalSvc.getCaravans().subscribe(
      (caravans) => {
        this.caravans = caravans;
        if (this.caravans && this.caravans.length) {
          this.zaer.caravanId = this.caravans[0].id;
        }
      },
      (err) => {
        this.toastr.error('خطا در دریافت کاروان‌ها');
      },
    );
  }

  saveZaer() {
    if (!this.zaer.fullname) {
      this.toastr.warning('نام و نام خانوادگی را وارد کنید');
      return;
    }

    if (!this.zaer.caravanId) {
      this.toastr.warning('کاروان را انتخاب کنید');
      return;
    }

    this.loading = true;

    this.globalSvc.saveZaer(this.zaer).subscribe(
      (id: any) => {
        this.finishSave();
      },
      (err) => {
        this.loading = false;
        this.toastr.error('خطا در ذخیره اطلاعات');
      },
    );
  }

  finishSave() {
    this.temp_caravanID = this.zaer.caravanId;
    this.loading = false;

    this.toastr.success('عملیات با موفقیت انجام شد');

    this.zaer = new models.ZaerModel();

    this.zaer.caravanId = this.temp_caravanID;
    this.selectedImage = undefined;

    this.renderer.selectRootElement(this.nationalCodeDom.nativeElement).focus();

    this.getZaerList();
  }

  editZaer(zaer: models.ZaerModel) {
    this.zaer = {
      ...zaer,
    };

    this.selectedImage = undefined;
  }

  deleteZaer(id: string) {
    this.loading = true;

    this.globalSvc.deleteZaer(id).subscribe(
      () => {
        this.toastr.success('زائر حذف شد');

        this.getZaerList();
      },
      (err) => {
        this.loading = false;

        this.toastr.error('خطا در حذف زائر');
      },
    );
  }

  getZaerList() {
    if (!this.zaer.caravanId) return;

    this.loading = true;

    if (this.excel) {
      this.globalSvc
        .zaerExcel(this.zaer.caravanId, this.searchAny)
        .subscribe((file) => {
          const url = window.URL.createObjectURL(file);

          const link = document.createElement('a');

          link.href = url;
          link.download = 'zaer-list.xlsx';

          link.click();

          window.URL.revokeObjectURL(url);

          this.loading = false;
        });

      return;
    }

    this.globalSvc
      .zaerList(this.zaer.caravanId, this.searchAny)
      .subscribe((list) => {
        this.zaerList = list;

        this.loading = false;
      });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith('image')) {
      this.toastr.error('فایل انتخاب شده تصویر نیست');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastr.error('حجم تصویر زیاد است');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: any) => {
      this.zaer.image = e.target.result;
    };

    reader.readAsDataURL(file);
  }

  exportExcel(): void {
    const fileName = 'data.xlsx';
    const worksheetName = 'Sheet1';
    const data: any[] = [];

    this.zaerList.forEach((item: models.ZaerModel) => {
      data.push({
        بارکد: item.id,
        'نام و نام خانوادگی': item.fullname,
        'کد ملی': item.nationalCode,
        جنسیت: item.sex ? 'آقا' : 'خانم',
        'نام کاروان': this.caravans.find((f) => f.id == item.caravanId)?.name,
        'نام مدیر': this.caravans.find((f) => f.id == item.caravanId)?.admin,
      });
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const excelBlob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(excelBlob, fileName);
  }
}
