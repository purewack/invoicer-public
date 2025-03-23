import { Invoice, InvoiceRenderable, getReferenceNumber } from "@shared/schema";
import Body, { colors, cardStyle, Welcome, Spacer, BrSMS, CrSMS, Footer } from "./layout-body";
import { PaymentFooter } from "./payment_footer";
import { toDateString } from "@/shared/helpers";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
}

function getDaysOverdue(dueDate: Date): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function InvoiceOutstandingTemplate(props: InvoiceRenderable & { preview?: boolean } ) {
  const totalAmount = props.due_total;
  const paidAmount = props.payment_total || 0;
  const remainingAmount = totalAmount - paidAmount;
  const daysOverdue = getDaysOverdue(props.due_date);

  const content = (
    <table style={{ width: "100%", borderSpacing: 0, fontFamily: 'Arial, sans-serif', lineHeight: '1.5' }}>
      
      <Welcome data={{customer:props.customer}} />
      
      <tr>
        <td style={{ padding: '24px 0' }}>
          <h2 style={{ 
            color: '#f44336',
            margin: "0 0 16px 0", 
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            FINAL NOTICE: Outstanding Payment Required<CrSMS/>
          </h2>
          
          <p>Our records show that invoice {getReferenceNumber(props.id, 'invoice')} is now 
          <strong> {daysOverdue} days overdue</strong>. This requires your immediate attention.<CrSMS/></p>

          <p>The invoice was issued on {toDateString(props.created_at)} and 
          was due for payment on {toDateString(props.due_date)}.<CrSMS/></p>
        </td>
      </tr>

      <tr>
        <td>
          <div style={{ ...cardStyle, backgroundColor: '#ffebee', padding: '16px', border: '1px solid #f44336' }}>
            <table style={{ width: '100%' }}>
              <tr>
                <td style={{ color: colors.bodyText }}>Original Amount:</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(totalAmount)}<BrSMS/></td>
              </tr>
              {paidAmount > 0 && (
                <tr>
                  <td style={{ color: colors.bodyText }}>Amount Paid:</td>
                  <td style={{ textAlign: 'right', color: 'green' }}>{formatCurrency(paidAmount)}<BrSMS/></td>
                </tr>
              )}
              <tr>
                <td style={{ color: '#f44336', fontSize: '1.1em', fontWeight: 'bold' }}>Outstanding Balance:</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1em', color: '#f44336' }}>
                  {formatCurrency(remainingAmount)}<CrSMS/>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>

      <Spacer />

      <tr>
        <td>
          <div style={{ ...cardStyle }}>
            <h3 style={{ 
              color: colors.titleText,
              margin: "0 0 12px 0",
              fontSize: '16px'
            }}>IMMEDIATE PAYMENT REQUIRED</h3>
            
            <PaymentFooter id={props.id} account={props.metadata.self_payment_account} address={props.metadata.self_billing_address}/>
          </div>
        </td>
      </tr>

      <tr>
        <td style={{ padding: '24px 0' }}>
        <CrSMS/>
          <p>Please arrange for immediate payment of the outstanding balance to avoid any further action.</p>
          
          <p>If you have already made the payment, please provide us with the payment details including 
          the date and reference number.</p>

          <p>If you are experiencing difficulties making the payment, please contact us immediately 
          to discuss payment arrangements.</p>
          
          <p style={{ color: '#f44336', fontWeight: 'bold' }}>
            Your prompt attention to this matter is greatly appreciated.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <Footer data={props}/>
        </td>
      </tr>
    </table>
  );

  return Body({ preview: props?.preview, children: content, metadata: props?.metadata });
}