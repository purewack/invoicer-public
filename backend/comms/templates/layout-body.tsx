
import { Customer, getReferenceNumber, Invoice, jobCycles, JobItem } from "@/shared/schema";
import React from "react";

// Define color variables
export const colors = {
primary: "#7c98b3ff",
secondary: "#accbe1ff",
highlight: "#dfeef6ff",
special: "gold",
titleText: "#234f6e",
bodyText: "#797d85",
subText: "#lightgray",
};

// --columbia-blue: #cee5f2ff;
// --columbia-blue-2: #accbe1ff;
// --air-superiority-blue: #7c98b3ff;
// --paynes-gray: #637081ff;
// --paynes-gray-2: #536b78ff;

// --alice-blue: #dfeef6ff;
// --columbia-blue: #accbe1ff;
// --air-superiority-blue: #7c98b3ff;
// --wenge: #604d53ff;
// --oxford-blue: #021427;

export const cardStyle = {
border: `1px solid ${colors.secondary}`,
borderRadius: "4px",
background: "#fff",
padding: "12px",
margin: "24px 0",
boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
};


export const bodyStyle = {
fontFamily: 'Helvetica, sans-serif',
fontSize: '20px',
lineHeight: 1.6,
color: colors.bodyText,
padding: 0,
margin: 0,
marginLeft: 'auto',
marginRight: 'auto',
maxWidth: 750,
};

export const BrSMS = () =>
<p style={{display: 'none'}}></p>
;

export const CrSMS = () =>
<p style={{display: 'none'}}> </p>
;


export const Spacer = () => <>
<p style={{display: 'none'}}> </p>
<br className="hidesms" style={{ marginBottom: '48px' }} />
</>;

export const NumberIndicator = ({ number }: { number: number }) => (
<span
    style={{
    width: "40px",
    height: "40px",
    padding: '10px 14px',
    fontSize: "18px",
    borderRadius: "1000px",
    backgroundColor: colors.secondary,
    color: "white",
    fontWeight: "bold",
    textAlign: 'center',
    }}
>
    {number + 1}<span style={{display: 'none'}}>)</span>
</span>
);

export const Heading = (props)=>{
    return <h1 id="email-heading" style={{ fontSize: "48px",  color: colors.titleText, ...props?.style }}>{
        props.children
    }</h1> 
}

export const Footer = (props)=>{
    return <>
      <tr style={{textAlign: 'center'}}>
        <td>{!props?.noending ? <b>If you have any questions, please ask!</b> : ''}</td>
      </tr>
      <tr>
        <td style={{ height: "48px" }}></td>
      </tr>
      <tr>
        <td style={{ color: colors.bodyText, fontWeight: 100}}>
          <i>
            <p style={{display: 'none'}}> </p>
            <p>{props.data.metadata.signature}</p>
            <p style={{ color: "gray", marginTop: 0,paddingTop: 0, fontSize: 12 }}><i>REF: {getReferenceNumber(props?.data?.id || '(###)', props?.data?.due_date ? 'invoice' : 'quote')}</i></p>
          </i>
        </td>
      </tr>
    </>
}

export function Welcome({data}: {data: {customer: Partial<Customer>}}){
    const customer = data.customer
    return <>
        <p>{customer.company ? `Greetings ${customer.company},` : `Dear ${customer.name.split(' ')[0]},`}</p>
    </>
}

export function JobSummary({data, options}:{data: Job, options?: {onlyItems?: boolean, short?: boolean, arrange?: boolean}}){

    const cycledContent = (key, index, title, monthlyCost, biMonthlyCost, unitCost, detail, cycles) => (
    options.arrange ? 
    <>
        <h3 style={{ margin: "0.5rem 0", color: colors.titleText, fontSize: "1.25rem" }}>
            <NumberIndicator number={index} /> {`${title}`}{!options?.short ? <> <span className="hidesms"> - </span><p style={{display: 'none'}}></p> £{(monthlyCost ? monthlyCost : biMonthlyCost).toFixed(2)} - 
            
            <span style={{
                display: "inline-block",
                padding: "4px 12px",
                fontSize: "0.875rem",
                fontWeight: "bold",
                color: "white",
                backgroundColor: colors.secondary,
                borderRadius: "16px",
                marginLeft: "8px",
            }}> (£{(unitCost).toFixed(2)} once) </span>
            
            <span
            style={{
            display: "inline-block",
            padding: "4px 12px",
            fontSize: "0.875rem",
            fontWeight: "bold",
            color: "white",
            backgroundColor: colors.primary,
            borderRadius: "16px",
            marginLeft: "8px",
            }}
            >
            {jobCycles[cycles].text}
            </span>
            <p style={{display: 'none'}}></p></> : <p style={{display: 'none'}}> </p>}
        </h3>
    </> : <>
        <h3 style={{ margin: "0.1rem", color:colors.titleText, fontSize: "1.5rem" }}>
        <NumberIndicator number={index} /> {title}
        </h3>
        {!options?.short ? <table style={{ width: "100%", marginTop: "8px", borderSpacing: 0 }}>
        <tr>
            <td>
            <p style={{ ...cardStyle, boxShadow: undefined, borderColor: 'lightgray', textAlign: 'center', padding: '16px', marginTop: "8px", marginBottom: 0, color: colors.subText }}>
                <i><span style={{display: 'none'}}> </span>First Cleaning Cost: <br/><b><span style={{display: 'none'}}>  </span>£{unitCost.toFixed(2)}</b></i>
            </p>
            </td>
            <td style={{width: '2%'}}></td>
            <td style={{width: "49%",  border: `solid lightgray 1px`, borderRadius: '8px', padding: "8px", textAlign: "center", marginRight: "8px" }}>
            <h3 style={{ 
                margin: "0.1rem", 
                display: "inline-block",
                padding: "4px 12px",
                fontSize: "0.875rem",
                fontWeight: "bold",
                color: "white",
                backgroundColor: colors.primary,
                borderRadius: "16px",
                marginLeft: "8px",
                }}><span style={{display: 'none'}}> </span>{biMonthlyCost ? '8-9' : '4-5'} Weeks cycle</h3>
            <p style={{ margin: "0.1rem", fontSize: "1.2rem" }}><span style={{display: 'none'}}>  </span>£{(monthlyCost ? monthlyCost : biMonthlyCost).toFixed(2)}</p>
            </td>
        </tr>
        <tr>
        <br />
        </tr>
        </table> : <p style={{display: 'none'}}> </p>}
        {detail && !options?.short && <p style={{ color: colors.subText }}><i>{detail}</i></p>}
    </>
    );

    const listJobItem = (p: JobItem, i, suggested = false) => (
    <li
        style={{
        ...cardStyle
        }}
        key={p.uuid}
    >
        {p.monthly_price || p.bimonthly_price
        ? cycledContent(
        p.uuid,
        i,
        p.title,
        p.monthly_price,
        p.bimonthly_price,
        p.unit_price,
        '',
        p.cycle_months
        )
        : <>
        <h3 style={{ margin: "0.5rem 0", color: colors.titleText, fontSize: "1.25rem" }}>
            <NumberIndicator number={i} /> {`${p.title}`}{!options?.short ? <> <span className="hidesms"> - </span><p style={{display: 'none'}}></p> £{( p.unit_price).toFixed(2)} - <span
            style={{
            display: "inline-block",
            padding: "4px 12px",
            fontSize: "0.875rem",
            fontWeight: "bold",
            color: "white",
            backgroundColor: colors.primary,
            borderRadius: "16px",
            marginLeft: "8px",
            }}
            >
            {jobCycles[p.cycle_months].text}
            </span>
            <p style={{display: 'none'}}></p></> : <p style={{display: 'none'}}> </p>}
        </h3>
        </>
        }
    </li>
    );
    
    return <tr>
        <td>
          {!options.onlyItems ? <>
            <h1 style={{ color: colors.titleText}}>🗒️ Summary</h1> 
            <br/><br/><CrSMS/>
            <p className="hidesms">Below is a summary of the work we will carry out:</p>
            </> : null}
          <ul style={{ padding: 0, listStyle: "none" }}>
            {data.items.map((j, i) => listJobItem(j, i))}
          </ul>
        </td>
    </tr>
}



export const cycledContent = (key, index, title, monthlyCost, biMonthlyCost, unitCost, detail, originalPrice) => (
    <>
      <h3 style={{ margin: "0.1rem", color:colors.titleText, fontSize: "1.5rem" }}>
        <NumberIndicator number={index} /> {title}<p style={{display: 'none'}}> </p>
      </h3>
      <p style={{ ...cardStyle, boxShadow: undefined, borderColor: 'lightgray', textAlign: 'center', padding: '16px', marginTop: "8px", marginBottom: 0, color: colors.subText }}>
        <i>First Cleaning Cost: {originalPrice ? <s className="hidesms">£{originalPrice.toFixed(2)}</s> : ''} <b>£{unitCost.toFixed(2)}</b></i>
      </p>
      <p style={{ textAlign: 'center', margin: '16px'}}>Then:</p>
      <table style={{ width: "100%", marginTop: "8px", borderSpacing: 0 }}>
        <tr>
          <td style={{width: "49%",  border: `solid lightgray 1px`, borderRadius: '8px', padding: "8px", textAlign: "center", marginRight: "8px" }}>
            <h3 style={{ margin: "0.1rem", color: colors.titleText }}>4-5 Weeks cycle</h3>
            <p style={{ margin: "0.1rem", fontSize: "1.2rem", color: colors.titleText  }}>£{monthlyCost.toFixed(2)}</p>
          </td>
          <td style={{ width: "2%" }}></td>
          <td style={{ width: "49%", border: `solid lightgray 1px`, borderRadius: '8px', padding: "8px", textAlign: "center", marginLeft: "8px" }}>
            <h3 style={{ margin: "0.1rem", color: colors.titleText }}>8-9 Weeks cycle</h3>
            <p style={{ margin: "0.1rem", fontSize: "1.2rem", color: colors.titleText  }}>£{biMonthlyCost.toFixed(2)}</p>
          </td>
        </tr>
      </table>
      <br />
      <p style={{display: 'none'}}> </p>
      {detail && <p style={{ color: colors.subText }}><i>{detail}</i></p>}
      <p style={{display: 'none'}}> </p>
    </>
  );

export const listJobItem = (p: (JobItem & {index: number, original_price?: number}), i, suggested = false) => (
    <li
      style={{
        ...cardStyle,
        borderColor: p.group_type === 'suggested' ? colors.special : colors.primary
      }}
      key={p.uuid}
    >
      {p.monthly_price ? cycledContent(
        p.uuid,
        p.index,
        p.title,
        p.monthly_price,
        p.bimonthly_price,
        p.unit_price,
        p.detail,
        p.original_price
      )
        : <>
          <h3 style={{ margin: "0.5rem 0", color:colors.titleText,  fontSize: "1.25rem"}}>
            <NumberIndicator number={p.index} /> {`${p.title}`} - {
                p.original_price 
              ? 
              <>
              <s className="hidesms">£{(p.original_price).toFixed(2)}</s> £{(p.unit_price).toFixed(2)}
              </>
              :
              <>£{(p.unit_price).toFixed(2)}</>
            }<p style={{display: 'none'}}></p>
          </h3>
          <p style={{ color: colors.subText }}>{p.detail ? <i>{p.detail}</i> : ""}</p>
          <p style={{display: 'none'}}> </p>
        </>}
    </li>
  );


export default function Body(props: any){
    const content = (
    <table style={{ width: "100%", background: "white", color: colors.bodyText, textAlign: "left", borderSpacing: 0 }}>
        <tr >
            <td style={{textAlign: 'center'}}>
                <img id='email-image-logo' src={props?.metadata?.images?.logo} alt="Window Cleaning Logo" style={{textAlign:'center', height: "300px"}} />
            </td>
            <td style={{display:'none', textAlign: 'center'}}>
                <p >🫧 Window & Gutter Cleaning </p>
                <p >✨ Over 15 Years of Experience </p>
            </td>
        </tr>
        <tr>
        <td>
            <span className="hidesms"><Spacer/></span>
        </td>
        </tr>
        <tr>
        <td style={{ padding: "16px", borderRadius: "16px", background: "#fdfdfe", border: "solid lightgray 1px" }}>
            {props.children}
        </td>
        </tr>
        <tr>
        <td>
            <Spacer/>
        </td>
        </tr>
        <tr>
        <td>
            <img id='email-image-footer' src={props.metadata?.images?.footer} alt="Window Cleaning Certification Footer" style={{textAlign:'center', width: '100%', marginBlock:25}} />
        </td>
        </tr>
        <tr >
        <td >
            <code style={{fontSize: '12px', textAlign: 'center'}}>
            <p className="hidesms">Contact Us</p>
            <p className="hidesms"><a href="tel:07920117390">[phone number]</a></p>
            <p className="hidesms"><a href="https://example.com">Website</a></p>
            <p className="hidesms"><a href="https://www.facebook.com/">Facebook</a></p>
            <br/>
            <p className="hidesms">© {(new Date()).getFullYear()}</p>
            </code>
        </td>
        </tr>
    </table>
    );

    return props?.preview ? (
    <div style={bodyStyle}>
        {content}
    </div>
    ) : (
    <html>
        <body style={bodyStyle}>
        {content}
        </body>
    </html>
    );
}