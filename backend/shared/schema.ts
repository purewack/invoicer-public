import { nanoid } from "nanoid";
import { repo } from "remult";
import { Allow, Entity, FieldOptions, Fields, IdEntity, Relations } from "remult";

export function NanoIdField<entityType = any>(
  ...options: FieldOptions<entityType, string>[]
) {
  return Fields.string<entityType>(
    {
      allowApiUpdate: false, // Disallow updating the ID through the API
      defaultValue: () => nanoid(), // Generate a new NanoID as the default value
      saving: (_, record) => {
        if (!record.value) {
          record.value = nanoid() // Generate a new NanoID if the value is not set
        }
      },
    },
    ...options,
  )
}

export function _getYearID(){
  return (new Date().getFullYear()).toString().slice(2);
}
@Entity("x_counters", { allowApiCrud: false })
export class Counter extends IdEntity {
  @Fields.string()
  table = "";

  @Fields.string()
  year = _getYearID();

  @Fields.integer()
  value = 0;
}
export function AutoIncrementAnnualID<entityType = any>(
  tableName: string,
  ...options: FieldOptions<entityType, string>[]
) {
  return Fields.string<entityType>({
    allowApiUpdate: false,
    saving: async (_, record) => {
      if (!record.value) {
        const year = _getYearID();
        const counterRepo = repo(Counter);
        let counter = await counterRepo.findFirst({ table: tableName, year });
        if (!counter) {
          counter = await counterRepo.insert({ table: tableName, year, value: 1 });
        } else {
          counter.value += 1;
          await counterRepo.save(counter);
        }
        record.value = `NWGC${year}-${tableName === 'invoices' ? 'INV' : 'JOB'}-${String(counter.value).padStart(4, "0")}`;
      }
    },
  }, ...options);
}


export const _CommsFlags = ['reviewed', 'arranged', 'confirmed', 'ongoing', 'completed', 'concluded', 'postponed', 'rejected'];
export type CommsFlags = (typeof _CommsFlags)[number];
export type CommsFlagSet = { 
  [key in CommsFlags]?: {
    date: Date,
    status: number
  }
};
export const _InvoicableJobTypes = ['ongoing','completed','concluded'];

export const _InvoiceStatus = ["unpaid","paid"] as const;
export type InvoiceStatus = (typeof _InvoiceStatus)[number];

export const _PaymentMethod = ["direct_debit", "bank_transfer", "cheque", "cash"] as const;
export type PaymentMethod = (typeof _PaymentMethod)[number];

export const _JobItemCategory = ['windows', 'gutters', 'soffits', 'gutters-package', 'interior'] as const;
export type JobItemCategory = typeof _JobItemCategory[number];


export interface JobPayment {
  id: string,
  paid: boolean,
  overdue: boolean
}

export type JobDates = {
  cycles: (Date | string)[],
  cycle_start: Date | null
}

export const servicesAliases = {
  'windows': 'Window Cleaning',
  'gutters-package':'Full Package Gutter Cleaning',
  'gutters':'Gutter & Downspout Cleaning',
  'soffits':'Soffit & Fascia Cleaning'
} as {[key:string]: string}


export const _EmailTemplateName = [
  'invoice-standard',
  'invoice-payment',
  'invoice-reminder',
  'invoice-final-notice',
  'generic'
] as const;
export type EmailTemplateName = (typeof _EmailTemplateName)[number];


export const tableEntities: any = {}

@Entity("addresses", { allowApiCrud: Allow.authenticated,
  validation: async (address: Address, e) => {
    if(address.line_one.length < 3){
      throw new Error("address-line_one:Address must be longer than 3 characters")
    }
    if(address.postcode.length < 5){
      throw new Error("address-postcode:Postcode must be at least 5 characters")
    }
    if(address.city.length < 3){
      throw new Error("address-city:City/Town must be at least 3 characters")
    }
  }
})
export class Address extends IdEntity {
  @Fields.autoIncrement()
  id = '';
  
  @Fields.string({ required: true })
  line_one = "";

  @Fields.string({ allowNull:true })
  line_two = "";

  @Fields.string({ required: true  })
  postcode = "";

  @Fields.string({ required: true  })
  city = "";

  @Fields.string({ allowNull: true })
  property_type = "";

  @Fields.string({ allowNull: true })
  property_features = "";

  @Fields.integer({ allowNull: true })
  property_bedrooms = 0;

  @Fields.string({ allowNull: true })
  notes = "";
}
tableEntities['addresses'] = Address

@Entity("customers", {allowApiCrud: Allow.authenticated,
  validation: async (customer: Customer, e) => {
    if (customer.name?.length < 3 && customer.company?.length < 3) {
      throw new Error("customer-name:Either contact name or company name, or both must be provided");
    }
    if (!customer.email && !customer.phone) {
      throw new Error("customer-email:Either email or phone number must be provided");
    }
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      throw new Error("customer-email:Invalid email format");
    }
    if (customer.phone && customer.phone.length < 7) {
      throw new Error("customer-phone:Phone number too short");
    }
    if (customer.phone && !/^[\d\s()+-]+$/.test(customer.phone)) {
      throw new Error("customer-phone:Phone number contains invalid characters");
    }
  }
})
export class Customer extends IdEntity {
  @Fields.autoIncrement()
  id = '';

  @Fields.string({ allowNull: true })
  name = "";

  @Fields.string({ allowNull: true  })
  email = "";

  @Fields.string({ allowNull: true })
  company = "";

  @Fields.string()
  phone = "";

  @Fields.string({ allowNull: true })
  notes = "";

  @Fields.date({ allowApiUpdate: false })
  created_at = new Date();
  
  @Fields.string() 
  billing_address_id = "";
  @Relations.toOne<Customer, Address>(()=> Address, 'billing_address_id')
  billing_address!: Address

  @Fields.string({ allowNull: true })
  billing_reference?:string = "";
}
tableEntities['customers'] = Customer

export interface HistoryJobItem {
  date: Date;
  changes: string[];
  job_items?: {
    uuid: string;
    title: string;
    price: number | [number, number, number];
    cycle: number;
  }[];
}

export interface JobItem {
  uuid: string;
  monthly_price?: number;
  bimonthly_price?: number;
  unit_price: number;
  original_price?:number;
  cycle_months: number;
  title: string;
  detail: (string | null);
};


export type SchemaCollection<T> = {
  items: T[],
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  }
}


export const jobCycles = {
  0: { text: 'One-Time', color: 'grey' },
  1: { text: 'Monthly', color: 'green' },
  2: { text: 'Bi-Monthly', color: 'orange' },
  6: { text: 'Semi-Annual', color: 'blue' },
  12: { text: 'Annual', color: 'purple' },
} as {[key: number]: {text: string; color: string}};


@Entity("x_job_item_titles", {allowApiCrud: Allow.authenticated})
export class JobItemTitle extends IdEntity {
  @Fields.autoIncrement()
  id = '';

  @Fields.string()
  title = "";

  @Fields.string()
  detail = "";

  @Fields.number()
  cycle = 0;

  @Fields.json({ allowNull: true })
  category?: JobItemCategory[];
  
}
tableEntities['job_item_titles'] = JobItemTitle

export function getReferenceNumber(data: string, type: 'invoice'|'quote'|'job'){
  return data
  // switch(type){
  //   case 'invoice': 
  //     return `NWGC-INV-${data}`;
  //   case 'quote':
  //     return `NWGC-SQ-${data}`;
  //   case 'job':
  //     return `NWGC-SJ-${data}`;
  // }
  // return `NWGC-${data}`;
}


export interface InvoiceItem {
  uuid: string;
  unit_price: number;
  title: string;
  detail: (string | null);
};

@Entity("invoices", {allowApiCrud: Allow.authenticated, 
  validation: async (data: Invoice, e) => {
    if (!data.items?.length) {
      throw new Error("invoice-items:No invoice items on list");
    }
  }
})
export class Invoice extends IdEntity {
  @AutoIncrementAnnualID('invoices')
  id = '';

  @Fields.string({ allowNull: true })
  notes = "";

  @Fields.json()
  billing: {
    line_one: string;
    postcode: string;
    city: string;
  };

  @Fields.json()
  site: {
    line_one: string;
    postcode: string;
    city: string;
  };

  @Fields.json()
  customer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    billing_reference?: string;
  };

  @Fields.json()
  items: InvoiceItem[] = [];

  @Fields.literal(()=>_InvoiceStatus)
  status: InvoiceStatus = "unpaid";

  @Relations.toMany<Invoice, Payment>(() => Payment) 
  payments: Payment[] = [];

  @Relations.toMany<Invoice, Reminder>(() => Reminder) 
  reminders: Reminder[] = [];

  @Fields.integer()
  unspent_auto_reminders = 0

  @Fields.boolean()
  auto_reminders = true;


  @Fields.integer()
  warning_window = 7;

  @Fields.integer()
  payment_window = 7;

  @Fields.number({ allowNull: true })
  payment_total?: number = null;

  @Fields.number()
  due_total = 0;

  @Fields.date({allowNull: true })
  payment_date?: Date | null = null;

  @Fields.date()
  due_date = new Date();  

  @Fields.date()
  completion_date = new Date();

  @Fields.date()
  created_at = new Date();

  @Fields.date({ allowApiUpdate: false })
  updated_at = new Date();
  
  @Fields.json()
  metadata: {
    owner_uid?: string,
    bcc_auto_reminders?: boolean
  } | any = {};
}
tableEntities['invoices'] = Invoice


export interface InvoiceSummary {
  id: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  due_date: Date;
  due_total: number;
  payment_date?: Date;
  payment_amount?: number;
  site_line_one: string;
  site_city: string;
  customer_name: string;
  updated_at: Date;
  auto_reminders: boolean;
  unspent_auto_reminders: number;
}

export interface PaymentBankDetails {
  name: string;
  sort: string;
  account: string;
  bank?: string;
}

export interface BillingAddressDetails {
  line_one: string;
  city: string;
  postcode: string;
}

export type InvoiceRenderable = Omit<Partial<Invoice>,"metadata"> & {
  metadata?: {
    self_payment_account: PaymentBankDetails, 
    self_billing_address: BillingAddressDetails,
    signoff: string,
    signature: string
  }
}

@Entity("reminders", {allowApiCrud: Allow.authenticated})
export class Reminder extends IdEntity {
  @Fields.autoIncrement()
  id = '';

  @Fields.string() 
  invoice_id = "";
  @Relations.toOne<Reminder, Invoice>(()=> Invoice, 'invoice_id')
  invoice?: Invoice

  @Fields.string() 
  contact_id = "";
  @Relations.toOne<Reminder, ContactLog>(()=> ContactLog,'contact_id')
  contact?: ContactLog;

  @Fields.string()
  reason: 'standard' | 'overdue';

  @Fields.string({allowNull: true})
  messageContent?: string = null;

  @Fields.number()
  amount_paid: number = 0;

  @Fields.number()
  amount_due: number = 0;

  @Fields.date()
  created_at = new Date();
}

@Entity("payments", {allowApiCrud: Allow.authenticated})
export class Payment extends IdEntity {
  @Fields.autoIncrement()
  id = '';

  @Fields.string() 
  invoice_id = "";
  @Relations.toOne<Payment, Invoice>(()=> Invoice, 'invoice_id')
  invoice?: Invoice

  @Fields.number()
  amount = 0;

  @Fields.number()
  remaining = 0;

  @Fields.date({ defaultValue: () => new Date() })
  payment_date = new Date();

  @Fields.date({ allowApiUpdate: false })
  created_at = new Date();
}
tableEntities['payments'] = Payment



export const _ContactLogSourceType = ["email","sms","other"] as const;
export type ContactLogSource = typeof _ContactLogSourceType[number]

export const _ContactLogTopicType = [..._EmailTemplateName] as const;
export type ContactLogTopicType = typeof _ContactLogTopicType[number]


@Entity("contact_logs", {allowApiCrud: false})
export class ContactLog extends IdEntity {
  @Fields.autoIncrement()
  id = '';

  @Fields.string()
  type = 'invoice';

  @Fields.string({allowNull: true})
  invoice_id?: string = "";
  @Relations.toOne<ContactLog, Invoice>(() => Invoice, 'invoice_id')
  invoice!: Invoice;

  @Fields.string()
  forStatus: InvoiceStatus | EmailTemplateName;

  @Fields.literal(()=>_ContactLogSourceType)
  method: ContactLogSource;

  @Fields.number()
  status: 200 | 204 | 400 | 500 | 0 = 0;

  @Fields.boolean()
  manual: boolean = false;

  @Fields.json()
  metadata?: any;

  @Fields.date({ allowApiUpdate: false })
  created_at = new Date();
}
tableEntities['contact_logs'] = ContactLog



@Entity("archive_invoices", {allowApiCrud: Allow.authenticated})
export class ArchiveInvoice extends Invoice{
}


@Entity("x_defaults", {allowApiCrud: Allow.authenticated})
export class Defaults extends IdEntity{
  @Fields.string()
  platform: string;


  @Fields.json()
  cron:{
  };


  @Fields.json()
  links:{
    email_logo: string,
    email_footer: string,
    logo_icon: string,
  };

  @Fields.json()
  emails:{
    signoff: string,
    signature: string,
    forward_to: string,
    reply_to: string,
  };;

  @Fields.json()
  finance:{
    payment_account: string,
    payment_sortcode: string,
    payment_name: string,
    payment_bank?: string,
    billing_line_one: string,
    billing_city: string,
    billing_postcode: string,
  }

  @Fields.json()
  prefs: {
    default_payment_window: number,
    default_payment_warnings: number,
    bcc_auto_reminders: boolean,
    cron_invoice_reminders: number,
    cron_archive: number
  } = {
    default_payment_warnings: 3,
    default_payment_window: 5,
    bcc_auto_reminders: true,
    cron_invoice_reminders: 0,
    cron_archive: 0
  }

}
