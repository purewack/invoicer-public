import { Invoice, InvoiceRenderable, getReferenceNumber } from "@shared/schema";
import Body, { colors, cardStyle, Welcome, Spacer, BrSMS, CrSMS, Footer, Heading } from "./layout-body";
import { PaymentFooter } from "./payment_footer";
import { toDateString } from "@/shared/helpers";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
}

function getDaysRemaining(dueDate: Date): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getReminderSeverity(daysRemaining: number): {
  color: string;
  message: string;
} {
  if (daysRemaining > 7) {
    return { color: colors.bodyText, message: 'Friendly Reminder' };
  } else if (daysRemaining > 0) {
    return { color: '', message: '⏰ Payment Due Soon' };
  } else {
    return { color: '#f44336', message: '⚠️ Payment Overdue' };
  }
}

export default function InvoiceReminderTemplate(props: InvoiceRenderable  & { preview?: boolean }) {
  const totalAmount = props.due_total;
  const paidAmount = props.payment_total || 0;
  const remainingAmount = totalAmount - paidAmount;
  const daysRemaining = getDaysRemaining(props.due_date);
  const { color: severityColor, message: severityMessage } = getReminderSeverity(daysRemaining);

  const content = (
    <table style={{ width: "100%", borderSpacing: 0, fontFamily: 'Arial, sans-serif', lineHeight: '1.5' }}>
      <tr>
        <td>
          <Heading style={{ marginBottom: 0,paddingBottom: 0 }}> {severityMessage} </Heading>
          <Spacer/>
        </td>
      </tr>
      <tr>
        <td style={{ padding: '0 0' }}>
          
          <Welcome data={{customer:props.customer}} />
          <p>We hope this message finds you well. This is a reminder regarding invoice:</p>
          <p><u>{getReferenceNumber(props.id, 'invoice')}</u></p>
          <p>which was issued on {toDateString(props.created_at)}.</p>

          <CrSMS/>
          {daysRemaining > 0 ? (
            <p>The payment is due in <strong>{daysRemaining} days</strong> on {toDateString(props.due_date)}.</p>
          ) : (
            <p>The payment was due {Math.abs(daysRemaining)} days ago on {toDateString(props.due_date)}.</p>
          )}
          <i>(At the time of this message)</i>
          <CrSMS/>
        </td>
      </tr>

      <tr>
        <td>
          <div style={{ ...cardStyle, backgroundColor: colors.highlight, padding: '16px' }}>
            <table style={{ width: '100%' }}>
              <tr>
                <td style={{ color: colors.bodyText }}>Original Amount:</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(totalAmount)}<BrSMS/></td>
              </tr>
              {paidAmount > 0 && (
                <tr>
                  <td style={{ color: colors.bodyText }}>Amount Paid so far:</td>
                  <td style={{ textAlign: 'right', color: 'green' }}>{formatCurrency(paidAmount)}<BrSMS/></td>
                </tr>
              )}
              <tr>
                <td style={{ color: colors.bodyText, fontSize: '1.1em', fontWeight: 'bold' }}>Remaining Balance:</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1em', color: severityColor }}>
                  {formatCurrency(remainingAmount)}<BrSMS/>
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
            }}>PAYMENT DETAILS</h3>
            
            <PaymentFooter id={props.id} account={props.metadata.self_payment_account}/>
          </div>
        </td>
      </tr>

      <tr>
        <td style={{ padding: '24px 0' }}>
          <p>If you have already made the payment, please disregard this reminder and accept our thanks.</p>
          <p>If you have any questions or concerns, please do not hesitate to contact us.</p>
        </td>
      </tr>

      <Footer data={props}/>
    </table>
  );

  return Body({ preview: props?.preview, children: content, metadata: props?.metadata });
}