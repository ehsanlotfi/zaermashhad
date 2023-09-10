import { Component, ElementRef, OnInit, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from 'src/app/global.service';
import * as models from 'src/app/global.model';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.css']
})
export class PrintComponent implements OnInit {

  @ViewChild('nationalCodeDom', { static: true }) nationalCodeDom: ElementRef;
  loading: boolean = false;

  sexs = [
    { id: 0, name: "خانم" },
    { id: 1, name: "آقا" },
  ]

  caravanId: number;
  zaerId: number;
  type: number = 0;
  zaerList: models.ZaerModel[][] = [];
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly globalSvc: GlobalService,
    private renderer: Renderer2,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this.caravanId = +this.route.snapshot.params["caravanId"];
    this.zaerId = +this.route.snapshot.params["zaerId"];
    this.type = +this.route.snapshot.params["type"];
    this.getZaerList();

  }

  getZaerList() {
    this.loading = true;
    const itemPerPage = this.type == 0 ? 8 : 6;
    this.globalSvc.getCaravans().subscribe(caravans => {
      this.globalSvc.zaerList(this.caravanId!).subscribe((list: any[]) => {

        if (this.zaerId && this.zaerId! - 1) {
          list = list.filter(f => f.id == this.zaerId);
        }

        const added = (list.length % itemPerPage) ? (itemPerPage - (list.length % itemPerPage)) : 0;
        if (added) {
          new Array(added).fill(0).forEach(f => {
            list.push(new models.ZaerModel());
          });
        }

        list.forEach(item => {
          item.caravanName = caravans.find(f => f.id == item.caravanId)?.name;
        })

        this.zaerList = list.reduce((rows, key, index) => (index % itemPerPage == 0 ? rows.push([key])
          : rows[rows.length - 1].push(key)) && rows, []);
        this.loading = false;
      })
    })
  }


}
