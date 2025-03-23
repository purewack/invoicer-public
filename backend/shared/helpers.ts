import { ContactLog, EmailTemplateName, Invoice, JobItem } from "@shared/schema.js";
import shortUUID from "short-uuid";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
}

export function capitalizeWords(str: string): string {
    if (!str) return '';
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function uppercaseWords(str: string): string {
  if (!str) return '';
  return str
      .split(' ')
      .map(word => word.toUpperCase())
      .join(' ');
}


export function lowerWords(str: string): string {
    if (!str) return '';
    return str
        .split(' ')
        .map(word => word.charAt(0).toLowerCase() + word.slice(1))
        .join(' ');
}

export function toDateString(d: Date | string) {
  if (!d) return null;
  
  const dateObj = d instanceof Date ? d : new Date(d.includes('/') ? 
    new Date(d.split('/').reverse().join('-')) : 
    new Date(d)
  );
  
  if (isNaN(dateObj.getTime())) return null;
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
}

export function toDateObject(d: Date | string) {
  // If already a Date object, return it directly
  if (d instanceof Date) {
    return new Date(d.getTime()); // Return a new copy to avoid reference issues
  }
  // Handle string input (dd/mm/yyyy format)
  if (typeof d === 'string') {
    const str = d.trim();
    // dd/mm/yyyy
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length !== 3) return null;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      const date = new Date(year, month, day);
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
      ) {
        return null;
      }
      return date;
    }

    // ISO / RFC / other parseable formats (e.g. 2025-12-02T09:00:00.000Z)
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;

    return null;
  }

  // Return null for any other input type
  return null;
}

export function addDays(date: Date, days: number) {
    if (!(date instanceof Date)) {
        throw new TypeError('First argument must be a Date object');
    }
    if (typeof days !== 'number' || isNaN(days)) {
        throw new TypeError('Second argument must be a number');
    }

    // Create a copy to avoid mutating the original date
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function getDays(dateStr1:Date|number|string, dateStr2?:Date|number|string) {
  // Parse the date strings into Date objects
  const date1 = new Date(dateStr1);
  const date2 = dateStr2 ? new Date(dateStr2) : (new Date());
  
  // Validate the dates
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    throw new Error('Invalid date format provided');
  }
  
  // Calculate the difference in milliseconds
  const timeDiff = Math.abs(date1.getTime() - date2.getTime());
  
  // Convert milliseconds to days and return
  return Math.round(timeDiff / (1000 * 60 * 60 * 24));
}

/*
Returns the number of days (positive) over date1 to date2 (today)
or days to (negative) date1 to date2 (today)
*/
export function getDaysDiffTo(dateStr1:Date|number|string, dateStr2?:Date|number|string) {
  
  if(typeof dateStr1 === 'string' && !dateStr1.includes('T')){
    let [day, month, year] = dateStr1.split('/')
    dateStr1 = `${year}-${month}-${day}`;
  }
  if(typeof dateStr2 === 'string' && !dateStr2.includes('T')){
    let [day, month, year] = dateStr2.split('/')
    dateStr2 = `${year}-${month}-${day}`;
  }

  const d1 = new Date(dateStr1)
  let d2 = new Date()
  if(dateStr2) d2 = new Date(dateStr2)

  // Validate the dates
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    console.error('invalid date',{d1, d2,dateStr1,dateStr2})
    throw new Error('Invalid date format provided');
  }
  // Normalize to midnight (UTC) to ignore time components
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  
  // Calculate difference in days
  const diffMs = utc1 - utc2;
  const dt = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  // console.log({dt,d1,d2})
  return dt
}

export function isDaysToCome(dateStr1:Date|number|string, dateStr2?:Date|number|string){
  const dt = getDaysDiffTo(dateStr1,dateStr2)
  return dt >= 0
}

export function isDaysToComeAfterToday(dateStr1:Date|number|string, dateStr2?:Date|number|string){
  const dt = getDaysDiffTo(dateStr1,dateStr2)
  return dt > 0
}

export function isDaysPast(dateStr1:Date|number|string, dateStr2?:Date|number|string){
  const dt = getDaysDiffTo(dateStr1,dateStr2)
  return dt < 0
}

export function isDaysPastWithToday(dateStr1:Date|number|string, dateStr2?:Date|number|string){
  const dt = getDaysDiffTo(dateStr1,dateStr2)
  return dt <= 0
}

export function getDaysAgoText(dateStr: Date|number|string){
  const days = getDays(dateStr)
  if(!days || days < 1) return '--'
  else if(days == 1) return `${days} day ago`
  else return `${days} days ago`
}


export function checkContactLogState(data: ContactLog[], document: EmailTemplateName ) {
  return {
    email: !!data.find(c => c.forStatus === document && c.method === 'email')?.status,
    sms:   !!data.find(c => c.forStatus === document && c.method === 'sms')?.status,
    other: !!data.find(c => c.forStatus === document && c.method === 'other')?.status, 
  }
}

export function getUID(){
  return shortUUID().generate()
}
