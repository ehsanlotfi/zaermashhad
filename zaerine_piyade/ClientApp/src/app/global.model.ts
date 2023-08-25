export interface DateModel {
  date: string;
}

export interface RegisterModel {
  id?: number;
  fullname: string;
  nationalCode: string;
  sex?: number;
  team: string;
  teamAdmin: string;
  total: any;
  traffic: DateModel[];
}

export interface ZaerModel {
  id?: number;
  fullname: string;
  nationalCode: string;
  sex?: number;
  team?: string;
  teamAdmin?: string;
}

export interface TotalModel {
  total: number;
}

export interface TrafficSexModel {
  sex: number;
  total: number;
}

export interface TeamReportModel {
  team: string,
  sex: number,
  totalTraffic: number,
  totalZaer: number,
  totalInside: number,
  totalRegister: number,
}

