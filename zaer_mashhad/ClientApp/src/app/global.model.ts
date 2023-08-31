export interface DateModel {
  date: string;
}

export interface RegisterModel {
  id?: number;
  fullname: string;
  nationalCode: string;
  sex?: number;
  caravanId: number;
  total: any;
  traffic: DateModel[];
}

export class ZaerModel {
  fullname: string = "";
  nationalCode: string = "";
  sex: number = 1;
  caravanId?: number = 1;
}

export interface TotalModel {
  total: number;
}

export interface TrafficSexModel {
  sex: number;
  total: number;
}

export interface TeamReportModel {
  caravanId: number,
  sex: number,
  totalTraffic: number,
  totalZaer: number,
  totalInside: number,
  totalRegister: number,
}

