import { capitalizeWords, formatCurrency, toDateString, uppercaseWords } from "@/shared/helpers";
import { BrSMS, colors, CrSMS, Spacer } from "./layout-body";
import { PaymentFooter } from "./payment_footer";
import { getReferenceNumber, InvoiceRenderable } from "@/shared/schema";

export default function InvoiceRender(props: InvoiceRenderable){
    return <><table style={{ padding:0, width:'100%'}}>
      <tr >
        <td colSpan={4} style={{ padding: '24px 0' }}>
          <CrSMS></CrSMS><CrSMS></CrSMS>
          <p style={{display: 'none'}}>---</p><CrSMS></CrSMS>
          <h2 className="hidesms" style={{ 
            color: colors.titleText, 
            margin: 0,
            fontSize: '28px',
            fontWeight: 'bold'
          }}>INVOICE{props.payment_total && props.payment_total < props.due_total ? ' - REMINDER' : ''}</h2>
        </td>
      </tr>

      {/* Invoice Details Row */}
      <tr  style={{ backgroundColor: colors.highlight }}>
        <td colSpan={2} style={{ padding: '16px' }}>
          <table style={{ width: "100%" }}>
            <tr>
              <td style={{ color: colors.bodyText, width: '100px' }}>Invoice #<BrSMS/></td>
              <td style={{ fontWeight: 'bold' }}>{getReferenceNumber(props.id || '(###)', 'invoice')}<CrSMS/></td>
            </tr>
            <tr>
              <td style={{ color: colors.bodyText }}>Date Issued:<BrSMS/></td>
              <td>{toDateString(props.created_at)}<CrSMS/></td>
            </tr>
            {props.completion_date ? <tr>
              <td style={{ color: colors.bodyText }}>Completed:<BrSMS/></td>
              <td>{toDateString(props.completion_date)}<CrSMS/></td>
            </tr> : null}
            <tr>
              <td style={{ color: colors.bodyText }}>Due Date:<BrSMS/></td>
              <td>{toDateString(props.due_date)}<CrSMS/></td>
            </tr>
          </table>
        </td>
        <td colSpan={2} style={{ padding: '16px', verticalAlign: 'top' }}>
          <table style={{ width: "100%" }}>
            <tr>
              <td style={{ color: colors.bodyText }}>Amount Due:<BrSMS/></td>
              <td style={{ 
                textAlign: 'right', 
                fontWeight: 'bold', 
                fontSize: '1.2em',
                color: colors.titleText 
              }}>{formatCurrency( props.due_total)}<BrSMS/><CrSMS/></td>
            </tr>
            {props.payment_total < props.due_total ? <>
            <tr>
              <td style={{ color: colors.bodyText }}>Cleared:<BrSMS/></td>
              <td style={{ 
                textAlign: 'right', 
                fontWeight: 'bold', 
                fontSize: '1.2em',
                color: colors.titleText 
              }}>{formatCurrency( props.payment_total)}<BrSMS/><CrSMS/></td>
            </tr>
            <tr>
              <td style={{ color: colors.bodyText }}>Remainder:<BrSMS/></td>
              <td style={{ 
                textAlign: 'right', 
                fontWeight: 'bold', 
                fontSize: '1.2em',
                color: colors.titleText 
              }}>{formatCurrency( props.due_total - props.payment_total)}<BrSMS/><CrSMS/></td>
            </tr>
            </> : null}
          </table>
        </td>
      </tr>

      {/* Address Section */}
      <tr >
        <td colSpan={2} style={{ padding: '24px 16px', verticalAlign: 'top' }}>
          <h3 className="hidesms" style={{ 
            color: colors.titleText, 
            margin: "0 0 12px 0", 
            fontSize: '16px',
            borderBottom: `1px solid ${colors.highlight}`,
            paddingBottom: '8px'
          }}>SITE ADDRESS</h3>
          <p className="hidesms" style={{ margin: "0 0 4px 0" }}>{capitalizeWords(props.site.line_one)}</p>
          <p className="hidesms" style={{ margin: "0 0 4px 0" }}>{capitalizeWords(props.site.city)}</p>
          <p className="hidesms" style={{ margin: "0" }}>{uppercaseWords(props.site.postcode)}</p>
        </td>
        <td colSpan={2} style={{ padding: '24px 16px', verticalAlign: 'top', borderRight: `1px solid ${colors.highlight}` }}>
          <h3 className="hidesms" style={{ 
            color: colors.titleText, 
            margin: "0 0 12px 0", 
            fontSize: '16px',
            borderBottom: `1px solid ${colors.highlight}`,
            paddingBottom: '8px'
          }}>BILLING ADDRESS</h3>
          <p className="hidesms" style={{ margin: "0 0 4px 0" }}>To: {capitalizeWords(props.customer.company || props.customer.name)}</p>
          <p className="hidesms" style={{ margin: "0 0 4px 0" }}>{capitalizeWords(props.billing.line_one)}</p>
          <p className="hidesms" style={{ margin: "0 0 4px 0" }}>{capitalizeWords(props.billing.city)}</p>
          <p className="hidesms" style={{ margin: "0" }}>{uppercaseWords(props.billing.postcode)}</p>
          {props.customer.billing_reference ? <p className="hidesms" style={{ margin: "0" }}>Billing REF:{uppercaseWords(props.customer.billing_reference)}</p> : null}
        </td>
      </tr>

      {/* Items Header */}
      <tr style={{ backgroundColor: colors.highlight }}>
        <th style={{ padding: '12px 16px', textAlign: 'left' }}>DESCRIPTION<CrSMS/></th>
        <th className="hidesms" style={{ padding: '12px 16px', textAlign: 'right' }}>UNIT PRICE</th>
        <th className="hidesms" style={{ padding: '12px 16px', textAlign: 'right' }}>QTY</th>
        <th className="hidesms" style={{ padding: '12px 16px', textAlign: 'right' }}>AMOUNT</th>
      </tr>

      {/* Items */}
      {props.items.map((item, index) => (
        <tr key={item.uuid} style={{ 
          borderBottom: `1px solid ${colors.highlight}`,
          backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9'
        }}>
          <td style={{ padding: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}><span style={{display: 'none'}}> - </span>{item.title}</div>
            {item.detail && (
              <div className="hidesms" style={{ 
                color: colors.bodyText,
                fontSize: '0.9em',
                lineHeight: '1.4'
              }}>{item.detail}</div>
            )}
          </td>
          <td className="hidesms" style={{ padding: '16px', textAlign: 'right', verticalAlign: 'top' }}>
            {formatCurrency(item.unit_price)}
          </td>
          <td className="hidesms" style={{ padding: '16px', textAlign: 'right', verticalAlign: 'top' }}>
            x1
          </td>
          <td style={{ padding: '16px', textAlign: 'right', verticalAlign: 'top' }}>
            <span style={{display: 'none'}}> = </span>{formatCurrency(item.unit_price)}<BrSMS/>
          </td>
        </tr>
      ))}

      {/* Totals */}
      <tr>
        <td colSpan={2}></td>
        <td style={{ 
          padding: '16px', 
          textAlign: 'right', 
          borderTop: `2px solid ${colors.highlight}`,
          fontWeight: 'bold'
        }}><CrSMS/>TOTAL:</td>
        <td style={{ 
          padding: '16px', 
          textAlign: 'right',
          borderTop: `2px solid ${colors.highlight}`,
          fontWeight: 'bold'
        }}>{formatCurrency( props.due_total)}</td>
      </tr>

      
    </table>

    <table>
      {props.notes && (
        <tr>
          <td>
              <h3 style={{ 
                color: colors.titleText, 
                margin: "0 0 12px 0", 
                fontSize: '16px',
                borderBottom: `1px solid ${colors.highlight}`,
                paddingBottom: '8px'
              }}>NOTES</h3>
              <p style={{ margin: "0", whiteSpace: "pre-wrap" }}>{props.notes}</p>
          </td>
        </tr>
      )}
    </table>
    
    <PaymentFooter id={props.id} account={props.metadata.self_payment_account} address={props.metadata.self_billing_address}/>
    
    <table>

      <tr>
        <td>
          <Spacer></Spacer>
        </td>
      </tr>

      <tr>
        <td>
          <hr style={{marginTop: 64, borderColor:'lightblue'}}/>
          <br/>
          <i className="hidesms" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
            {props.metadata.signoff}
          </i>
        </td>
      </tr>

    </table>
</>}