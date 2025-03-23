import { prefillDatabase } from "./data/preinit"
import { remultExpress, RemultExpressServer } from "remult/remult-express";
import { Address, ContactLog, Counter, Customer, Invoice, ArchiveInvoice, JobItemTitle, Payment, Reminder, Defaults } from "@/shared/schema"

import { 
  InvoiceController,
  MessagingController, 
  SearchServiceController 
} from "@/shared/api";

export function startDB(){
  return new Promise<RemultExpressServer>((res,rej)=>{

  const apiSchema = remultExpress({
      entities: [
        Counter,
        Address, 
        Customer, 
        JobItemTitle,
        Invoice,
        Reminder,
        Payment,
        ContactLog,
        ArchiveInvoice,
        Defaults
      ],
      controllers: [InvoiceController, SearchServiceController, MessagingController],
      getUser: async (req)=> {
        return {
          name: 'admin',
          roles: ['admin'],
          id: 'dummy_uid',
        }
      },
      initApi: async ()=>{
        try{
          await prefillDatabase()
          res(apiSchema)
        }
        catch(e){
          rej(e)
        }
      }
    })
  })
}