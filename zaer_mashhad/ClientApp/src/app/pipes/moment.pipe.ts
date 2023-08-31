import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'jalali-moment';

@Pipe({
  name: 'jalali'
})
export class JalaliPipe implements PipeTransform {
  transform(value: any, format?: string, args?: any): any {

    if (!value) return value;
    if (value.length < 9) return value;
    if (!moment(value).isValid()) return value;
    return moment.from(value, 'en', 'YYYY-MM-DDTHH:mm:ss').locale('fa').format(format ? format : 'HH:mm:ss   YYYY/MM/DD')
    
  }
}
