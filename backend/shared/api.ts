import { Allow, EntityFilter, repo } from "remult";
import { Customer, tableEntities, ContactLog, EmailTemplateName, Invoice, InvoiceSummary, SchemaCollection, Payment, Reminder, Address, Defaults } from "./schema";
import { BackendMethod, Controller, remult } from "remult";
import { addDays, capitalizeWords, getDays, getDaysDiffTo, uppercaseWords } from "./helpers";

declare module 'remult' {
  export interface RemultContext {
    request?: Express.Request
  }
}

function makeInvoiceSummaryData(i: Invoice){
  return ({
    id: i.id,
    items: i.items,
    status: i.status,
    due_date: i.due_date,
    due_total: i.due_total,
    payment_date: i.payments?.at(-1)?.created_at,
    payment_amount: i.payment_total,
    customer: undefined,
    site: undefined,
    billing: undefined,
    site_line_one: i.site?.line_one || '',
    site_city: i.site?.city || '',
    customer_name: i.customer?.company && !(i.customer?.name) ? i.customer.company : (i.customer?.name + (i.customer?.company ? ` (${i.customer?.company})` : '')),
    updated_at: i.updated_at,
    unspent_auto_reminders: i.unspent_auto_reminders,
    auto_reminders: i.auto_reminders
  } as InvoiceSummary)
}

@Controller("invoice")
export class InvoiceController {
  @BackendMethod({ allowed: Allow.authenticated })
  static async getInvoiceById(id: string) {
    const invoice = await remult.repo(Invoice).findFirst(
      { id },
      {
        include: {
          reminders: {
            // include: {
            //   contact: true
            // },
            orderBy: {id: 'desc'}
          },
          payments: true
        },
      }
    );

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    return invoice;
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async getInvoices(
    page: number = 1,
    pageSize: number = 10,
    query?: any
  ) {
    const repo = remult.repo(Invoice);
    
    const [invoices, totalItems] = await Promise.all([
      repo.find({
        where: query,
        limit: pageSize,
        page: page,
        include: {
          payments: true,
        },
        orderBy: { id: 'desc' },
      }),
      repo.count(query),
    ]);

    //console.log(invoices)

    return {
      items: invoices.map(makeInvoiceSummaryData),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    } as SchemaCollection<InvoiceSummary>;
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async getOverdueInvoices(page: number = 1,
    pageSize: number = 10){
      const repo = remult.repo(Invoice);
    
      const [invoices, totalItems] = await Promise.all([
        (async () => {
          const data = await repo.find({where: InvoiceController.queryStatusUnpaid})
          const overdue = data.filter(i => getDaysDiffTo(i.due_date) < 0)
          return overdue;
        })(),
        repo.count(InvoiceController.queryStatusUnpaid),
      ]);

    const data = invoices.slice((page-1)*pageSize, pageSize + ((page-1)*pageSize))
    const recountedTotalItems = invoices.length
    
    return {
      items: data.map(makeInvoiceSummaryData),
      pagination: {
        currentPage: page*pageSize > recountedTotalItems ? 1 : page,
        pageSize,
        totalItems: recountedTotalItems,
        totalPages: Math.ceil(recountedTotalItems / pageSize),
      },
    }
  }

  static async validate(data: Partial<Invoice>){
    await remult.repo(Customer).validate(data.customer)

    try{
      await remult.repo(Address).validate(data.billing)
    }
    catch(e){
      throw new Error('billing-'+e.message)
    }

    try{
      await remult.repo(Address).validate(data.site)
    }
    catch(e){
      throw new Error('site-'+e.message)
    }

    await remult.repo(Invoice).validate(data)
  }

  @BackendMethod({ allowed: Allow.authenticated  })
  static async createInvoice(data: Invoice) {
    // const job = await remult.repo(Job).findFirst({ id: jobId });
    // if (!job) {
    //   throw new Error("Job not found");
    // }

    // const paymentAccount = await remult.repo(PaymentAccount).findFirst({ id: paymentAccountId });
    // if (!paymentAccount) {
    //   throw new Error("Payment account not found");
    // }

    // Calculate total price
    // const totalPrice = data.job_items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    // if(!data.job_id || !data.job){
    // // Find existing customer or create new one for standalone invoices
    
    for(const key in Object.keys(data.customer)){
      if(key !== 'email')
      data.customer[key] = capitalizeWords(data.customer[key])
    }

    for(const key in Object.keys(data.billing))
      data.billing[key] = capitalizeWords(data.billing[key])

    for(const key in Object.keys(data.site))
      data.site[key] = capitalizeWords(data.site[key])

    data.site.postcode = uppercaseWords(data.site.postcode)
    data.billing.postcode = uppercaseWords(data.billing.postcode)
    data.customer.billing_reference = uppercaseWords(data.customer.billing_reference)
    
    let customer: Customer;
    let billingAddress: Address;
    let siteAddress: Address;



    // Find or create customer
    if (data.customer) {
      customer = await remult.repo(Customer).findFirst({
      $or: [
        { email: data.customer.email },
        { phone: data.customer.phone }
      ],
      name: data.customer.name
      });

      if (!customer) {
        customer = await remult.repo(Customer).insert({
          ...data.customer,
          billing_address: billingAddress
        } as Customer);
      }
    }
    

    // Find or create site address
    if (data.site) {
      siteAddress = await remult.repo(Address).findFirst({
      line_one: data.site.line_one,
      postcode: data.site.postcode,
      city: data.site.city
      });
      
      if (!siteAddress) {
        siteAddress = await remult.repo(Address).insert({
        ...data.site,
        } as Address);
      }
    }

    // Find or create billing address
    if (data.billing) {
      billingAddress = await remult.repo(Address).findFirst({
      line_one: data.billing.line_one,
      postcode: data.billing.postcode,
      city: data.billing.city,
      });

      if (!billingAddress) {
        billingAddress = await remult.repo(Address).insert({
          ...data.billing,
        } as Address);
      }
    }

    // Calculate due date based on completion date and payment days
    if (data.created_at && data.payment_window) {
      const dueDate = new Date(data.created_at);
      dueDate.setDate(dueDate.getDate() + data.payment_window);
      data.due_date = dueDate;
    }

    // Create invoice
    const invoice_data = {
      ...data,
      due_total: data.items.reduce((sum, item) => sum + (item.unit_price || 0), 0),
      customer: {
        name: data.customer?.name || '',
        email: data.customer?.email || '',
        phone: data.customer?.phone || '',
        company: data.customer?.company || '',
        billing_reference: data.customer?.billing_reference || '',
      },
      site: {
        line_one: data.site?.line_one || '',
        postcode: data.site?.postcode || '',
        city: data.site?.city || '',
      },
      billing: {
        line_one: data.billing?.line_one || '',
        postcode: data.billing?.postcode || '',
        city: data.billing?.city || '',
      },
    }
    const invoice = await remult.repo(Invoice).insert(invoice_data);

    console.log("created",invoice.id)
    
    return invoice;
  }

  @BackendMethod({ allowed: Allow.authenticated})
  static async recordPayment(data: Partial<Invoice>, paymentAmount: number, reset_payment_window: boolean){
   
    const remaining = data.due_total - (data.payment_total!);
    const payment = await remult.repo(Payment).insert({
      invoice: data as Invoice,
      remaining,
      amount: paymentAmount,
    })
    console.log("payment recorded, ",payment.id, payment.invoice_id)
    if(reset_payment_window){
      const newDate = addDays(new Date(), data.payment_window || 30)
      data.due_date = newDate;
    }

    await InvoiceController.updateInvoice(data)
    return payment
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async updateInvoice(data: Partial<Invoice>) {
    const repo = remult.repo(Invoice);

    const inv = await repo.update(data.id, {
      ...data,
      customer: {
        name: data.customer?.name || '',
        email: data.customer?.email || '',
        phone: data.customer?.phone || '',
        company: data.customer?.company || '',
        billing_reference: data.customer?.billing_reference || '',
      },
      site: {
        line_one: data.site?.line_one || '',
        postcode: data.site?.postcode || '',
        city: data.site?.city || '',
      },
      billing: {
        line_one: data.site?.line_one || '',
        postcode: data.site?.postcode || '',
        city: data.site?.city || '',
      },
      updated_at: new Date(),
    });

    return inv;
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async recordReminder(id: string) {
    const repo = remult.repo(Invoice);
    const invoice = await repo.findFirst({ id });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Check if invoice is paid
    if (invoice.status === "paid") {
      throw new Error("Tried to remind paid invoice - operation not allowed");
    }
    
    const reminder = remult.repo(Reminder).insert({
      invoice,
      amount_due: invoice.due_total,
      amount_paid: invoice.payment_total,
      reason: getDaysDiffTo(invoice.due_date) <= 0 ? 'overdue' : 'standard',
    });

    return { status: "ok", message: "Invoice reminded successfully", reminder };
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async deleteInvoice(id: string) {
   
    const invoice = await remult.repo(Invoice).findFirst({ id });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await remult.repo(Invoice).delete(id);

    return { status: "ok", message: "Invoice deleted successfully" };
  }
  
  static queryStatusPaid = {status: ['paid'] } as EntityFilter<Invoice>;
  static queryStatusUnpaid = {status: ['unpaid'] } as EntityFilter<Invoice>;;

  @BackendMethod({ allowed: Allow.authenticated })
  static async countInvoiceStates() {
    const repo = remult.repo(Invoice);

    const [unpaidCount, paidCount, overdueCount] = await Promise.all([
      repo.count(InvoiceController.queryStatusUnpaid),
      repo.count(InvoiceController.queryStatusPaid),
      (async () => {
        const data = await repo.find({where: InvoiceController.queryStatusUnpaid})
        const overdue = data.filter(i => getDaysDiffTo(i.due_date) < 0)
        return overdue.length;
      })(),
    ]);

    return {
      unpaid: unpaidCount,
      paid: paidCount, 
      overdue: overdueCount,
      total: await repo.count()
    };
  }
  
  @BackendMethod({ allowed: Allow.authenticated })
  static async generatePdfData(id: string) {
    const invoice = await InvoiceController.getInvoiceById(id)
    if(!invoice)  throw new Error('Invoice not found for PDF creation')
    
    const data = await InvoiceController._generatePDFContent(invoice)
    
    return data
  }

  static _generatePDFContent = async (invoice: Partial<Invoice>)=> Promise.resolve({
    filename: `invoice_XXX.pdf`,
    content: {} as Buffer,
    contentType: 'application/pdf'
  })

}

// Add to the end of schema.ts
export interface FuzzySearchResult {
  id: string;
  type: 'customer' | 'address' | 'invoice';
  score: number;
  data: Partial<Customer> | Partial<Address> | Partial<Invoice>;
  display: string;
}

export interface FuzzySearchOptions {
  limit?: number;
  threshold?: number;
}

// Generic search service
@Controller("search")
export class SearchServiceController {
  
  @BackendMethod({ allowed: Allow.authenticated })
  static async tableInfo( table: string, query: any = {} ) {
    // console.log(table,query)
    const entitiy = tableEntities[table]
    const repoEntity = remult.repo(entitiy);
    const total = await repoEntity.count(query?.where)
    let fieldKeys = Object.keys(repoEntity.fields).filter(a => !['find', 'toArray'].includes(a));

    const fields = fieldKeys.map((f:string) => {
      const props = (repoEntity.fields as any)[f]
      // console.log(f,props)
      const hasFieldRelationInfo = Object.getOwnPropertySymbols(props).some(sym => {
        return sym.toString() === 'Symbol(fieldRelationInfo)';
      });
      const relation = (hasFieldRelationInfo 
        ? (props[Symbol.for("fieldRelationInfo")]?.toEntity?.[Symbol.for('entityInfo_key')])
        : undefined)
      return ({
        key: f, 
        relation
      })
    }).filter(v => !v.relation)
    // console.log(fields)
    return {total, fields}
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async tableFind(
    searchTerm: string, 
    table: string, 
    query: any,
    searchFields: string[], 
    pagination: {page?: number, limit?: number} = {}
  ) {
    const entity = tableEntities[table];
    const repoEntity = remult.repo(entity);
    
    const where = searchFields.map(s => ({
      [s]: { $contains: searchTerm, ...query?.where }
    }));
    
    const [items, total] = await Promise.all([
      repoEntity.find({
        where: {$or: where},
        limit: pagination.limit,
        page: pagination.page,
      }),
      repoEntity.count({$or: where})
    ]);
  
    return {
      data: items,
      total: total,
      page: pagination.page || 1,
      pageSize: pagination.limit || 10
    };
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async tableGet(table: string, query: any, pagination: {page?: number, limit?: number} = {}) {
    const entity = tableEntities[table];
    const repoEntity = remult.repo(entity);
    
    const [items, total] = await Promise.all([
      repoEntity.find({
        limit: pagination.limit,
        page: pagination.page, ...query
      }),
      repoEntity.count(query?.where)
    ]);
  
    return {
      data: items,
      total: total,
      page: pagination.page || 1,
      pageSize: pagination.limit || 10
    };
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async fuzzyFindAny(
    searchTerm: string, 
    pagination: {page?: number, limit?: number} = {},
  ) {

    
    const addresses = await repo(Address).find({
      limit: 100,
    });

    const filteredAddresses = addresses.filter(a => 
      (a?.id + '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      a?.line_one?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a?.postcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a?.property_features?.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const customers = await repo(Customer).find({
      limit: 100,
    });

    const filteredCustomers = customers.filter(c =>
      (c?.id + '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c?.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );


    
    const invoices = await repo(Invoice).find({
      limit: 100,
    });

    const filteredInvoices = invoices.filter(inv =>
      (inv.id + '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.site?.line_one?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.site?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.due_date && inv.due_date.toISOString().includes(searchTerm))
    );

    const totalData = [...filteredCustomers, ...filteredInvoices, ...filteredAddresses];
    const page = pagination.page || 1;
    const pageSize = pagination.limit || 10;
    const pagedData = totalData.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: pagedData,
      total: totalData.length,
      page,
      pageSize,
    };
  }
  

  @BackendMethod({ allowed: Allow.authenticated })
  static async fuzzySearchJob(
    searchTerm: string,
    options: FuzzySearchOptions = {}
  ): Promise<FuzzySearchResult[]> {
    const { limit = 10, threshold = 0.3 } = options;

    const search = searchTerm.toLowerCase();    
   
    const invoices = await repo(Invoice).find({
      limit: 100, include: {customer: true, billing: true, site: true}
    });

    const filteredInvoices = invoices.filter(inv =>
      (inv.id + '').toLowerCase().includes(search) ||
      inv.customer?.name?.toLowerCase().includes(search) ||
      inv.customer?.email?.toLowerCase().includes(search) ||
      inv.customer?.phone?.toLowerCase().includes(search) ||
      inv.customer?.company?.toLowerCase().includes(search) ||
      inv.site?.line_one?.toLowerCase().includes(search) ||
      inv.site?.city?.toLowerCase().includes(search) ||
      inv.site?.postcode?.toLowerCase().includes(search) ||
      inv.billing?.line_one?.toLowerCase().includes(search) ||
      inv.billing?.city?.toLowerCase().includes(search) ||
      inv.billing?.postcode?.toLowerCase().includes(search) 
    );


    // console.log("found: inv - ", filteredInvoices)

    // Search customers
    const customers = await repo(Customer)
    .find({
      limit: 100,
    });
    
    // Search addresses
    const addresses = await repo(Address).find({
      limit: 100,
    });
    
    // Normalize search term
    const normalizedTerm = searchTerm.toLowerCase().trim();
    
    // Score and rank results
    const results: FuzzySearchResult[] = [];
    
    // Score customers
    for (const customer of customers) {
      const score = SearchServiceController.calculateCustomerScore(customer, normalizedTerm);
      if (score >= threshold) {
        results.push({
          id: 'customer-'+customer.id,
          type: 'customer',
          score,
          data: customer,
          display: SearchServiceController.formatCustomerDisplay(customer),
        });
      }
    }
    
    // Score addresses
    for (const address of addresses) {
      const score = SearchServiceController.calculateAddressScore(address, normalizedTerm);
      if (score >= threshold) {
        results.push({
          id: 'address-'+address.id,
          type: 'address',
          score,
          data: address,
          display: SearchServiceController.formatAddressDisplay(address),
        });
      }
    }
    
    for(const inv of filteredInvoices){
      results.push({
        id: 'invoice-'+inv.id,
        type: 'invoice',
        score: 1,
        data: inv,
        display: `${inv.site.line_one} · ${inv.site.city} · ${inv.id}`
      })
    }

    // console.log("search res: ", results)


    // Sort by score and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  private static calculateCustomerScore(customer: Customer, searchTerm: string): number {
    const fields = [
      { value: customer.name, weight: 0.4 },
      { value: customer.company, weight: 0.3 },
      { value: customer.email, weight: 0.2 },
      { value: customer.phone, weight: 0.2 },
      { value: customer.billing_address?.line_one, weight: 0.1 },
      { value: customer.billing_address?.postcode, weight: 0.1 },
    ];
    
    return SearchServiceController.calculateFieldScores(fields, searchTerm);
  }
  
  private static calculateAddressScore(address: Address, searchTerm: string): number {
    const fields = [
      { value: address.line_one, weight: 0.5 },
      { value: address.postcode, weight: 0.3 },
      { value: address.city, weight: 0.2 },
    ];
    
    return SearchServiceController.calculateFieldScores(fields, searchTerm);
  }

  private static calculateInvoiceScore(invoice: Invoice, searchTerm: string): number {
    const fields = [
      { value: invoice.site.line_one, weight: 0.5 },
      { value: invoice.site.postcode, weight: 0.3 },
      { value: invoice.site.city, weight: 0.2 },
    ];
    
    return SearchServiceController.calculateFieldScores(fields, searchTerm);
  }
  
  private static calculateFieldScores(fields: {value?: string, weight: number}[], searchTerm: string): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const field of fields) {
      if (!field.value) continue;
      
      const normalizedValue = field.value.toLowerCase();
      let score = 0;
      
      // Exact match
      if (normalizedValue === searchTerm) {
        score = 1;
      }
      // Contains match
      else if (normalizedValue.includes(searchTerm)) {
        score = 0.8;
      }
      // Fuzzy match (simple version)
      else {
        const termParts = searchTerm.split(/\s+/);
        const valueParts = normalizedValue.split(/\s+/);
        
        const matchedParts = termParts.filter(termPart => 
          valueParts.some(valuePart => valuePart.includes(termPart))
        );
        
        score = matchedParts.length / termParts.length * 0.6;
      }
      
      totalScore += score * field.weight;
      totalWeight += field.weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
  
  private static formatCustomerDisplay(customer: Customer): string {
    return [
      customer.company || customer.name,
      customer.billing_address?.line_one,
      customer.billing_address?.postcode,
      customer.email,
      customer.phone,
    ].filter(Boolean).join(' · ');
  }
  
  private static formatAddressDisplay(address: Address): string {
    return [
      address.line_one,
      address.line_two,
      address.postcode,
      address.city,
    ].filter(Boolean).join(', ');
  }
  
 
}

export type GenericEmailProps = {body:string, title:string, customer: Customer}
export type TemplateTargetType = (Partial<Invoice> | GenericEmailProps) & {templateMetadata?: any} & {metadata?: any};

@Controller("messaging")
export class MessagingController {

  static _buildEmail = async (template: EmailTemplateName, target: any) => ({title: '', html: '', text: ''});
  static _sendEmail  = async (options: any) => Promise.resolve({ success: true, message: 'Email sent' });

  static _getCustomer = (target: Partial<Invoice>) => {
    return target.customer
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async generateContent(
    documentType: EmailTemplateName,
    target: TemplateTargetType & { metadata?: any }
  ) {
    return MessagingController._buildEmail(documentType, target);
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async sendEmail(
    documentType: EmailTemplateName,
    target: TemplateTargetType,
    auto?: boolean,
    attachmentRequest?: any
  ) {
    const customer = MessagingController._getCustomer(target);

    const content = await MessagingController._buildEmail(documentType, target);
    

    let entry = { 
      invoice: target,
      forStatus: documentType,
      manual: !auto,
    }

    let attachments = undefined
    if(attachmentRequest && attachmentRequest?.type === 'invoice'){
        const pdf = await InvoiceController._generatePDFContent(target as Partial<Invoice>)
        attachments = [pdf]
        // console.log("GENERATEd ATTACHEMENT INV",attachments)
    }

    try {
      let res = 204
      if (auto && customer.email) {
        const defs = await repo(Defaults).findFirst({platform: process.env.PLATFORM_NAME})

        let bcc = defs.emails.forward_to
        if(!target.metadata?.bcc_auto_reminders && ['invoice-reminder', 'invoice-final-notice'].includes(documentType))
          bcc = null

        const r = await MessagingController._sendEmail({
          to: process.env?.MAIL_TO || customer.email,
          from: process.env.MAIL_FROM,
          bcc: bcc,
          replyTo: defs.emails.reply_to,
          subject: content.title,
          html: content.html,
          text: content.text,
          attachments
        });
        // console.log("send res", r)
        if(r.success) res = 200
        else res = 500
      }

      const entryLog = {
        ...entry,
        method: 'email',
        status: res
      } as ContactLog
      const log = await remult.repo(ContactLog).insert(entryLog);
      // console.log("send email insert", log)

      const r =  { success: res !== 500, log: log.id, content: encodeURIComponent(content.text)};
      // console.log("ok",r)
      return r
    } catch (error) {
      console.error(error,target)
      const log = await remult.repo(ContactLog).insert({
        ...entry, 
        status: 500, 
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      } as Partial<ContactLog>);
      return { success: false, content: null, log: log.id };
    }
  }


  @BackendMethod({ allowed: Allow.authenticated })
  static async sendSms(
    documentType: EmailTemplateName,
    target: TemplateTargetType,
    auto?: boolean
  ) {

    // console.log("send sms entry begin")
    let entry = { 
      invoice: target,
      forStatus: documentType,
      manual: !auto,
    }

    // console.log("send sms generate begin")
    let content = null
    if(auto)
      content = await MessagingController._buildEmail(documentType, target);
    
    const entryLog = {
      ...entry,
      method: 'sms',
      status: auto ? 200 : 204
    } as ContactLog
    // console.log("send sms insert", entryLog)
    const id = await remult.repo(ContactLog).insert(entryLog);
  
    // console.log("send sms end")
    return {
      content: !content?.text ? `` : encodeURIComponent(content.text),
      log: id,
      success: true,
    };
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async sendOther(
    documentType: EmailTemplateName,
    target: TemplateTargetType,
  ) {

    let entry = { 
      invoice: target,
      forStatus: documentType,
      manual: true,
    }

    const id = await remult.repo(ContactLog).insert({ 
      ...entry,
      method: 'other',
      status: 204
    } as ContactLog);
  
    return {
      success: true,
      id
    };
  }



  @BackendMethod({ allowed: Allow.authenticated })
  static async deleteContactLog(contactLogId: string) {
    await remult.repo(ContactLog).delete(contactLogId);
    return { success: true };
  }

}