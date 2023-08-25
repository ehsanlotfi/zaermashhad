import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from 'src/app/global.service';
import * as models from 'src/app/global.model';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {

  teamData:
    {
      name: string,

      totalZaer: number,
      totalZaerMan: number,
      totalZaerWoman: number,

      totalTraffic: number,
      totalTrafficMan: number,
      totalTrafficWoman: number,

      totalInside: number,
      totalInsideMan: number,
      totalInsideWoman: number,

      totalRegister: number,
      totalRegisterMan: number,
      totalRegisterWoman: number,

    }[] = [];

  countAll: { class: string, name: string, value: number }[] = [];
  countAllZaer: number = 0;
  countReport = {
    totalZaer: 0,

    totalTrafficMan: 0,
    totalTrafficWoman: 0,
    totalTraffic: 0,

    totalRegister: 0,
    totalRegisterWoman: 0,
    totalRegisterMan: 0,

    totalInside: 0,
    totalInsideWoman: 0,
    totalInsideMan: 0

  }

  constructor(
    private readonly router: Router,
    private readonly globalSvc: GlobalService,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this.teamReport();
  }

  teamReport() {
    this.globalSvc.teamReport().subscribe(data => {
      const group = data.reduce(
        (result: any, item) => ({
          ...result,
          [item["team"]]: [
            ...(result[item["team"]] || []),
            item,
          ],
        }),
        {},
      );

      this.teamData = Object.entries(group).map((f: any) => {

        return {
          name: f[0],

          totalZaer: f[1].map((t: models.TeamReportModel) => t.totalZaer).reduce((a: number, b: number) => a + b, 0),
          totalZaerMan: f[1].filter((t: models.TeamReportModel) => t.sex == 1).map((t: models.TeamReportModel) => t.totalZaer).reduce((a: number, b: number) => a + b, 0),
          totalZaerWoman: f[1].filter((t: models.TeamReportModel) => t.sex == 0).map((t: models.TeamReportModel) => t.totalZaer).reduce((a: number, b: number) => a + b, 0),

          totalTraffic: f[1].map((t: models.TeamReportModel) => t.totalTraffic).reduce((a: number, b: number) => a + b, 0),
          totalTrafficMan: Math.round(f[1].filter((t: models.TeamReportModel) => t.sex == 1).map((t: models.TeamReportModel) => t.totalTraffic).reduce((a: number, b: number) => a + b, 0)),
          totalTrafficWoman: Math.round(f[1].filter((t: models.TeamReportModel) => t.sex == 0).map((t: models.TeamReportModel) => t.totalTraffic).reduce((a: number, b: number) => a + b, 0)),

          totalInside: f[1].map((t: models.TeamReportModel) => t.totalInside).reduce((a: number, b: number) => a + b, 0),
          totalInsideMan: Math.round(f[1].filter((t: models.TeamReportModel) => t.sex == 1).map((t: models.TeamReportModel) => t.totalInside).reduce((a: number, b: number) => a + b, 0)),
          totalInsideWoman: Math.round(f[1].filter((t: models.TeamReportModel) => t.sex == 0).map((t: models.TeamReportModel) => t.totalInside).reduce((a: number, b: number) => a + b, 0)),

          totalRegister: f[1].map((t: models.TeamReportModel) => t.totalRegister).reduce((a: number, b: number) => a + b, 0),
          totalRegisterMan: Math.round(f[1].filter((t: models.TeamReportModel) => t.sex == 1).map((t: models.TeamReportModel) => t.totalRegister).reduce((a: number, b: number) => a + b, 0)),
          totalRegisterWoman: Math.round(f[1].filter((t: models.TeamReportModel) => t.sex == 0).map((t: models.TeamReportModel) => t.totalRegister).reduce((a: number, b: number) => a + b, 0)),


        }

      });
      this.countAllZaer = this.teamData.map(f => f.totalZaer).reduce((a, b) => a + b);
      this.countAll = [
        { class: "color-1", name: "تعداد تردد", value: this.teamData.map(f => f.totalTraffic).reduce((a, b) => a + b) },
        { class: "color-1", name: "تردد آقا", value: this.teamData.map(f => f.totalTrafficMan).reduce((a, b) => a + b) },
        { class: "color-1", name: "تردد خانم", value: this.teamData.map(f => f.totalTrafficWoman).reduce((a, b) => a + b) },

        { class: "color-2", name: "پذیرش", value: this.teamData.map(f => f.totalRegister).reduce((a, b) => a + b) },
        { class: "color-2", name: "پذیرش آقا", value: this.teamData.map(f => f.totalRegisterMan).reduce((a, b) => a + b) },
        { class: "color-2", name: "پذیرش خانم", value: this.teamData.map(f => f.totalRegisterWoman).reduce((a, b) => a + b) },

        { class: "color-3", name: "مقیم", value: this.teamData.map(f => f.totalInside).reduce((a, b) => a + b) },
        { class: "color-3", name: "مقیم آقا", value: this.teamData.map(f => f.totalInsideMan).reduce((a, b) => a + b) },
        { class: "color-3", name: "مقیم خانم", value: this.teamData.map(f => f.totalInsideWoman).reduce((a, b) => a + b) },
      ]


    })
  }

}
