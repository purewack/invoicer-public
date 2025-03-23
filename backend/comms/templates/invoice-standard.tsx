import { Invoice, InvoiceRenderable, getReferenceNumber } from "@shared/schema";
import Body, { Welcome, CrSMS, Heading, Footer } from "./layout-body";
import InvoiceRender from "./invoice-render";

const invoiceCardStyle={
  background: "#fff",
  margin: "24px 0",
};


export default function InvoiceTemplate(props: InvoiceRenderable & { preview?: boolean }) {

  const content = (<div>
    <table style={{ width: "100%", borderSpacing: 0, fontFamily: 'Arial, sans-serif', lineHeight: '1.5' }}>
      <Heading>💎 Your Bill is Here! ✨</Heading>
      <br/><CrSMS/>
      <Welcome data={{customer:props.customer}} />
      <br/>
      <p>Thank you for using our services and being our customer.</p>
      <p>The amount £{props.due_total.toFixed(2)} is due  
        {/* {
        props.job_id ? <span>regarding the job #{getReferenceNumber(props.job_id,'job')}</span>
       : null}. */}
       </p>
      <p>Please find the invoice for the completed work below</p>
  
      <tr>
        <td>
        <Footer data={props} noending/>
        </td>
      </tr>
    </table>

    <hr style={{marginTop:16, borderColor: "lightgray"}}/>

    <InvoiceRender {...props}/>
  </div>);

  return Body({ preview: props?.preview, metadata: props?.metadata, children: content });
}