import { Address, BillingAddressDetails, getReferenceNumber, PaymentBankDetails } from "@/shared/schema";
import { BrSMS, colors, CrSMS } from "./layout-body";


export function PaymentFooter(props: {id: string, account: PaymentBankDetails, address?: BillingAddressDetails} ){
  return (
    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 16px' }}>
      <tr>
        {/* Payment Details Column */}
        <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '8px' }}>
          <h3 style={{ 
            color: colors.titleText, 
            margin: "0 0 12px 0", 
            fontSize: '16px',
            textAlign: 'left'
          }}>
            <CrSMS/>PAYMENT DETAILS<BrSMS/>
          </h3>
          
          <table style={{ width: '100%', border: '1px solid lightgray', borderRadius: 4, padding: 16 }}>
            {
              props.account.bank ? <tr>
                <td style={{ color: colors.bodyText, textAlign: 'left' }}>Bank: </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{props.account?.bank || '(BANK)'}<BrSMS/></td>
              </tr> : null
            }
            <tr>
              <td style={{ color: colors.bodyText, textAlign: 'left' }}>To: </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{props.account?.name || '(NAME)'}<BrSMS/></td>
            </tr>
            <tr>
              <td style={{ color: colors.bodyText, textAlign: 'left' }}>Account Number: </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{props.account?.account || '(ACCOUNT)'}<BrSMS/></td>
            </tr>
            <tr>
              <td style={{ color: colors.bodyText, textAlign: 'left' }}>Sort Code: </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{props.account?.sort || '(SORTCODE)'}<BrSMS/></td>
            </tr>
            <tr>
              <td style={{ color: colors.bodyText, textAlign: 'left' }}>Reference: </td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{getReferenceNumber(props.id, 'invoice')}<BrSMS/><CrSMS/></td>
            </tr>
          </table>
        </td>

        {/* Billing Address Column */}
        {props.account ? <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '8px' }}>
          <h3 className="hidesms" style={{ 
            color: colors.titleText, 
            margin: "0 0 12px 0", 
            fontSize: '16px',
            textAlign: 'right'
          }}>
            <CrSMS/><span className="hidesms">OUR BILLING ADDRESS</span><BrSMS/>
          </h3>

          <table style={{ width: '100%', border: '1px solid lightgray', borderRadius: '4px', padding: 16 }}>
            <tr>
              <td className="hidesms" style={{ color: colors.bodyText, textAlign: 'left' }}>Address:</td>
              <td className="hidesms" style={{ textAlign: 'right' }}>{props.address?.line_one || '(LINE_ONE)'}<BrSMS/></td>
            </tr>
            <tr>
              <td className="hidesms" style={{ color: colors.bodyText, textAlign: 'left' }}>City:</td>
              <td className="hidesms" style={{ textAlign: 'right' }}>{props.address?.city || '(CITY)'}<BrSMS/></td>
            </tr>
            <tr>
              <td className="hidesms" style={{ color: colors.bodyText, textAlign: 'left' }}>Postcode:</td>
              <td className="hidesms" style={{ textAlign: 'right' }}>{props.address?.postcode || '(POSTCODE)'}<BrSMS/></td>
            </tr>
          </table>
        </td> : null}
      </tr>
    </table>
  );
}