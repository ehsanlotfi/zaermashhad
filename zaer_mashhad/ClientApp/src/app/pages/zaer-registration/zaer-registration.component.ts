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
export class ZaerRegistrationComponent implements OnInit
{

  @ViewChild('nationalCodeDom', { static: true }) nationalCodeDom: ElementRef;
  loading: boolean = false;
  caravans: models.CaravanModel[] = [];

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

  ngOnInit(): void
  {
    this.globalSvc.getCaravans().subscribe(caravans =>
    {
      this.caravans = caravans;
      this.getZaerList();
    })
  }

  saveZaer()
  {
    this.loading = true;
    this.globalSvc.saveZaer(this.zaer).subscribe((id: string) =>
    {
      this.toastr.success("عملیات با موفقیت انجام شد");
    }, err =>
    {
      this.toastr.error("خطایی رخ داده است");
    }, () =>
    {
      this.zaer.fullname = "";
      this.zaer.nationalCode = "";
      this.zaer.image = "";
      this.renderer.selectRootElement(this.nationalCodeDom.nativeElement).focus();
      this.getZaerList();
    });
  }

  editZaer(zaer: models.ZaerModel)
  {
    this.zaer = zaer;
  }

  deleteZaer(id: number)
  {
    this.loading = true;
    this.globalSvc.deleteZaer(id).subscribe(list =>
    {
      this.getZaerList();
    })
  }

  getZaerList()
  {
    this.loading = true;
    this.globalSvc.zaerList(this.zaer.caravanId!).subscribe(list =>
    {
      this.zaerList = list;
      this.loading = false;
    })
  }

  onFileSelected(event: any): void
  {
    const file: File = event.target.files[0];
    const maxSizeInBytes = 100 * 1024; // 100 kb
    const latestmaxSizeInBytes = 2000 * 1024; // 100 kb

    if (file.size <= maxSizeInBytes)
    {
      const reader: FileReader = new FileReader();

      reader.onload = (e: any) =>
      {
        this.zaer.image = e.target.result;
      };

      reader.readAsDataURL(file);
    } else if (file.size <= latestmaxSizeInBytes)
    {
      this.toastr.warning("در حال فشرده سازی عکس");
      this.loading = true;
      this.globalSvc.compressImgae(file).subscribe(result =>
      {
        this.zaer.image = result;
        this.loading = false;
      });
    } else
    {
      this.toastr.error("حجم فایل بیش از حد بزرگ است");
    }
  }

  exportExcel(): void
  {
    const fileName = "data.xlsx";
    const worksheetName = "Sheet1";
    const data: any[] = [];

    this.zaerList.forEach((item: models.ZaerModel) =>
    {
      data.push({
        "بارکد": item.id,
        "نام و نام خانوادگی": item.fullname,
        "کد ملی": item.nationalCode,
        "جنسیت": item.sex ? "آقا" : "خانم",
        "نام کاروان": this.caravans.find(f => f.id == item.caravanId)?.name,
        "نام مدیر": this.caravans.find(f => f.id == item.caravanId)?.admin,
      })
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(excelBlob, fileName);
  }

}
