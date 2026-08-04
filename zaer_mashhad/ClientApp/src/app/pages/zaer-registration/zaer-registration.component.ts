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
        if (this.selectedImage) {
          this.uploadImage(id);
        } else {
          this.finishSave();
        }
      },
      (err) => {
        this.loading = false;
        this.toastr.error('خطا در ذخیره اطلاعات');
      },
    );
  }

  uploadImage(id: number) {
    const formData = new FormData();

    formData.append('file', this.selectedImage!, this.selectedImage!.name);

    this.globalSvc.uploadZaerImage(id, formData).subscribe(
      () => {
        this.finishSave();
      },
      (err) => {
        this.loading = false;

        this.toastr.warning('اطلاعات ذخیره شد ولی تصویر ارسال نشد');

        this.finishSave();
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

  deleteZaer(id: number) {
    if (!confirm('آیا از حذف این زائر مطمئن هستید؟')) return;

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

    this.globalSvc.zaerList(this.zaer.caravanId).subscribe((list) => {
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

    const maxSize = 2 * 1024 * 1024; // 2MB

    if (file.size > maxSize) {
      this.toastr.error('حجم تصویر نباید بیشتر از ۲ مگابایت باشد');

      return;
    }

    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      this.zaer.image = e.target.result;
    };

    reader.readAsDataURL(file);

    this.selectedImage = file;
  }
  exportExcel() {
    if (!this.zaer.caravanId) {
      this.toastr.warning('ابتدا کاروان را انتخاب کنید');
      return;
    }

    this.globalSvc.zaerExcel(this.zaer.caravanId).subscribe((file) => {
      const url = window.URL.createObjectURL(file);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'zaer-list.xlsx';

      link.click();

      window.URL.revokeObjectURL(url);
    });
  }
}
