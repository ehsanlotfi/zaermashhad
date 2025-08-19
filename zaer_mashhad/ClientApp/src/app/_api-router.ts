import { environment } from 'src/environments/environment';

export const ROUTERAPI = {
    auth: `${environment.origin}api/auth`,
    logout: `${environment.origin}api/auth/logout`,
    getHash: `${environment.origin}api/auth/gethash/`,
    registr: `${environment.origin}api/zaer/registr/`,
    delete: `${environment.origin}api/zaer/delete/`,
    compress: `${environment.origin}api/zaer/compress/`,
    saveZaer: `${environment.origin}api/zaer/save-zaer`,
    upload: `${environment.origin}api/zaer/upload/`,
    zaer: `${environment.origin}api/zaer`,
    getAllZaer: `${environment.origin}api/zaer/get-all-zaer`,
    zaerList: `${environment.origin}api/zaer/zaer-list/`,
    trafficReport: `${environment.origin}api/zaer/traffic-report`,
    teamReport: `${environment.origin}api/zaer/team-report`,
}
