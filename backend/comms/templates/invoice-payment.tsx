import { Invoice, InvoiceRenderable, getReferenceNumber } from "@shared/schema";
import Body, { colors, cardStyle, Welcome, Spacer, BrSMS, CrSMS, Heading, Footer } from "./layout-body";
import { capitalizeWords, toDateString, uppercaseWords } from "@/shared/helpers";
import InvoiceRender from "./invoice-render";

const invoiceCardStyle={
  background: "#fff",
  margin: "24px 0",
};


export default function InvoiceTemplate(props: InvoiceRenderable & { preview?: boolean }) {

  const content = (<div>
    <table style={{ width: "100%", borderSpacing: 0, fontFamily: 'Arial, sans-serif', lineHeight: '1.5' }}>
      <Heading>💎 Your Bill - Thank You ✨</Heading>
      <br/><CrSMS/>
      <Welcome data={{customer:props.customer}} />
      <br/>
      <p>Thank you for using our services and being our customer.</p>
      {props.payment_total >= props.due_total ? <p>
        We have received the full payment for the invoice {getReferenceNumber(props.id, 'invoice')}.
        <br/>
        We look forward to working for you again.
      </p>
      :
      <>
        <p>You have paid £{(props.payment_total.toFixed(2))} so far.</p>
        <br/>
        <p><u >The amount £{(props.due_total - props.payment_total).toFixed(2)} is still due</u>,</p>
        <br/>
        <p>(original amount: £{props.due_total.toFixed(2)}) {props.job_id && props.completion_date 
          ? <span>regarding the job #{getReferenceNumber(props.job_id,'job')}
            <br/>completed on {toDateString(props.completion_date)}</span> 
          : null}.
        </p>
      </>
      }
      <tr>
        <td>
        <Footer data={props} noending/>
        </td>
      </tr>
    </table>

    { props.status !== 'paid' ? <>
      <hr style={{marginTop:16, borderColor: "lightgray"}}/>
      <InvoiceRender {...props}/>
    </>
    : null
    }
  </div>);

  return Body({ preview: props?.preview, metadata: props?.metadata, children: content });
}