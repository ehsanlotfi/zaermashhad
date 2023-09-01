import { Component, ElementRef, OnInit, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from 'src/app/global.service';
import * as models from 'src/app/global.model';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-zaer-registration',
  templateUrl: './zaer-registration.component.html',
  styleUrls: ['./zaer-registration.component.css']
})
export class ZaerRegistrationComponent implements OnInit {

  @ViewChild('nationalCodeDom', { static: true }) nationalCodeDom: ElementRef;
  loading: boolean = false;
  caravans = [
    { id: 1, name: "انصارالمهدی", admin: "آقای یعقوبی" },
    { id: 2, name: "محبان حضرت فاطمه معصومه (س)", admin: "خانم اصغری" },
    { id: 3, name: "چهارده معصوم (ع)", admin: "خانم اسکندری ثانی" },
    { id: 4, name: "حضرت رقیه (س)", admin: "خانم فرزین" },
    { id: 5, name: "منتظران ظهور", admin: "آقای اسکندری" },
    { id: 6, name: "منتظران ظهور2", admin: "خانم اسکندری" },
    { id: 7, name: "قمر بنی هاشم (ع)", admin: "آقای یادگاری" },
    { id: 8, name: "حضرت فاطمه الزهرا (س)", admin: "خانم عرب قرایی" },
    { id: 9, name: "ثارالله", admin: "خانم توکلی" },
    { id: 10, name: "ثاره الله2", admin: "آقای کراتی" },
    { id: 11, name: "حضرت معصومه (س)", admin: "خانم بذرگر" },
    { id: 12, name: "امام زین العابدین", admin: "خانم زین العابدین" },
    { id: 13, name: "پیروان حضرت زهرا (س)", admin: "آقای دهقان پور" },
    { id: 14, name: "خدام خواهران", admin: "خانم علوی" },
    { id: 15, name: "خدام برادران", admin: "آقای حسین زاده" },
  ]

  sexs = [
    { id: 0, name: "خانم" },
    { id: 1, name: "آقا" },
  ]

  zaer: models.ZaerModel = new models.ZaerModel();
  zaerList: models.ZaerModel[] = [];
  constructor(
    private readonly router: Router,
    private readonly globalSvc: GlobalService,
    private renderer: Renderer2,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this.getZaerList();
  }

  saveZaer() {
    this.loading = true;
    this.globalSvc.saveZaer(this.zaer).subscribe((id: string) => {
      this.toastr.success("عملیات با موفقیت انجام شد");
    }, err => {
      this.toastr.error("خطایی رخ داده است");
    }, () => {
      this.zaer.fullname = "";
      this.zaer.nationalCode = "";
      this.zaer.image = "";
      this.renderer.selectRootElement(this.nationalCodeDom.nativeElement).focus();
      this.getZaerList();
    });
  }

  editZaer(zaer: models.ZaerModel) {
    this.zaer = zaer;
  }

  deleteZaer(nationalCode: string) {
    this.loading = true;
    this.globalSvc.deleteZaer(nationalCode).subscribe(list => {
      this.getZaerList();
    })
  }

  getZaerList() {
    this.loading = true;
    this.globalSvc.zaerList(this.zaer.caravanId!).subscribe(list => {
      this.zaerList = list;
      this.loading = false;
    })
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    const maxSizeInBytes = 100 * 1024; // 100 kb

    if (file.size <= maxSizeInBytes) {
      const reader: FileReader = new FileReader();

      reader.onload = (e: any) => {
        this.zaer.image = e.target.result;
      };

      reader.readAsDataURL(file);
    } else {
      this.toastr.error("حجم تصویر حداکثر باید 100 کیلوبایت باشد");
    }
  }

  exportExcel(): void {
    const fileName = "data.xlsx";
    const worksheetName = "Sheet1";
    const data = this.zaerList.map(({ image, ...f }) => f);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(excelBlob, fileName);
  }



}
