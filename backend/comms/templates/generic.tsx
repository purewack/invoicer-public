import { Customer } from "@/shared/schema";
import Body, { cardStyle, colors, CrSMS, Footer, Heading, JobSummary, Spacer, Welcome } from "./layout-body";

export default function Template(props: {customer: Customer, body: string, title: string} & {metadata?:any, preview?: boolean}) {

  const content = (
    <table style={{ width: "100%", borderSpacing: 0 }}>
      <tr>
        <td>
          <Heading style={{ marginBottom: 0,paddingBottom: 0 }}>{props.title}</Heading>
          <Spacer/>
        </td>
      </tr>
      <tr>
        <td>
          <Welcome data={props}/>
          <CrSMS/>
          <br/>
          <pre style={{fontFamily: 'sans-serif', fontSize: '16px'}} id="email-body">{props.body}</pre>
          <CrSMS/>
          <br/>
        </td>
      </tr>
      <Footer data={props}/>
    </table>
  );

  return Body({children: content, preview: props?.preview, metadata: props?.metadata})
}
