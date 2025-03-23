import  { Router, Request, Response } from "express";
import { createTransport } from "nodemailer"
import SMTPPool from "nodemailer/lib/smtp-pool";
import { renderToStaticMarkup } from 'react-dom/server';
import React from "react";
import { InvoiceController, MessagingController } from "@/shared/api";
import { Defaults, EmailTemplateName, getReferenceNumber, Invoice, InvoiceRenderable} from "@/shared/schema";
import InvoiceStandard from "./templates/invoice-standard";
import InvoicePayment from "./templates/invoice-payment"
import InvoiceReminder from "./templates/invoice-reminder";
import InvoiceFinalNotice from "./templates/invoice-final-notice";
import GenericTemplate from "./templates/generic";
import { repo, withRemult } from "remult";
import { isDev } from "../dev";
import { generateInvoicePDF } from "./invoice";
import path  from "path";
import fs from "fs";


const builderTemplates: Record<EmailTemplateName, React.FunctionComponent<any>> = {
    'invoice-standard': InvoiceStandard,
    'invoice-payment': InvoicePayment,
    "invoice-reminder": InvoiceReminder,
    "invoice-final-notice": InvoiceFinalNotice,
    'generic': GenericTemplate
};

const builderSubjects: Record<EmailTemplateName, string> = {
    'invoice-standard': 'Your Bill Is Here ✨',
    'invoice-payment': 'We Got Your Payment 💵',
    "invoice-reminder": 'Payment Due ⏰',
    "invoice-final-notice": 'FINAL NOTICE - Payment Due',
    'generic': ''
};


function invoicePopulateMetadata(defs:Defaults, target: Partial<Invoice>){
    // if(getTargetEntityType(target) !== 'invoice') return target
    return {
        ...target,
        metadata: {
            ...target.metadata,
            self_payment_account: {
                name: defs.finance.payment_name || '--',
                account:defs.finance.payment_account|| '--',
                sort: defs.finance.payment_sortcode || '--',
                bank: defs.finance.payment_bank || '--',
            },
            self_billing_address: {
                line_one: defs.finance.billing_line_one || '--',
                city: defs.finance.billing_city || '--' ,
                postcode: defs.finance.billing_postcode || '--',
            },
            signoff: defs.emails.signoff,
            signature: defs.emails.signature
        }
    } as InvoiceRenderable
}


async function buildEmail(templateName: EmailTemplateName, props: any){
    console.log("build email")
    let defs 
    await withRemult(async ()=>{
        defs = await repo(Defaults).findFirst({platform: process.env.PLATFORM_NAME})
    }) 

    const template = builderTemplates[templateName]
    const rawTarget = invoicePopulateMetadata(defs, props)
    const target = 
    {
        ...rawTarget, 
        metadata: {
            ...rawTarget.metadata, 
            images: {
                logo: defs.links.email_logo || '',
                footer: defs.links.email_footer || ''
            },
            ...defs.emails,
        }
    }

    const emailElement = React.createElement(template, target);
    const html = renderToStaticMarkup(emailElement);

    //const targetType = getTargetEntityType(props)
    let id = ''
    // switch(targetType){
    //     case 'cycle':
    //         id = (props as JobCycle).job_id
    //         break;
    //     case 'invoice':
            id = (props as Invoice).id
    //         break;
    //     case 'job':
    //         id = (props as Job).id    
    //         break;
    //     case 'generic':
    //         break
    // }
    
   const title = (id ? 
        builderSubjects[templateName] + ` ${getReferenceNumber(id,'invoice')}`
        :
        props.title) 
        + ' - Niklas Window & Gutter Cleaning'
    
    const htmlWithoutHead = html.replace(/<head[^>]*>.*?<\/head>/gms, '');
    const htmlWithoutClass = htmlWithoutHead
        .replace(/<[^>]*class="[^"]*\bhidesms\b[^"]*"[^>]*>.*?<\/[^>]*>/gms, '')
        // .replace(/<[^>]*style="[^"]*display\s*:\s*none;?[^"]*"[^>]*>.*?<\/[^>]*>/gms, '');
    const textWithHiddenContent = htmlWithoutClass
        .replace(/<p[^>]*>/g, '\n') // Add a newline before <p>
        .replace(/<\/p>/g, '\n') // Add a newline after </p>
        .replace(/<br\s*\/?>/g, '\n') // Replace <br> with a newline
        .replace(/<span[^>]*>|<\/span>/g, '') // Remove <span> tags without adding newlines
        .replace(/<[^>]*class="[^"]*\bspacesms\b[^"]*"[^>]*>/g, '\n') // Add a newline before <spacesms>
        .replace(/<\/[^>]*class="[^"]*\bspacesms\b[^"]*"[^>]*>/g, '\n') // Add a newline after <spacesms>
        .replace(/<[^>]*>/g, '') // Remove all other HTML tags
        .replace(/\n+/g, '\n') // Replace multiple newlines with a single newline
        .trim(); // Trim leading and trailing whitespace
    const text = textWithHiddenContent
        .replace(/&amp;/g, '&') // Replace HTML entity for ampersand
        .replace(/&lt;/g, '<') // Replace HTML entity for less-than
        .replace(/&gt;/g, '>') // Replace HTML entity for greater-than
        .replace(/&quot;/g, '"') // Replace HTML entity for double quotes
        .replace(/&#39;/g, "'") // Replace HTML entity for single quotes
        .replace(/&#x27;/g, "'");
    
    // console.log("email text",template, text)
    return {
        text,
        html,
        title,
    };
}

// const transportOptions = {
//     host: process.env.MAIL_HOST,
//     port: parseInt(process.env?.MAIL_PORT || '587'),
//     auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS
//     },
//     from: process.env.MAIL_FROM,
//     pool: true
// } as SMTPPool.Options
// const transporter = createTransport(transportOptions);
// if(isDev()) console.log(transportOptions)

async function sendEmail(options: {
    to: string,
    from: string,
    bcc?: string,
    replyTo?: string,
    subject: string,
    text: string,
    html: string,
    attachments?: any[]
}) {
    if(process.env.MAIL_MOCK){
        console.log("MOCK EMAIL")
        await (new Promise((res)=>{
            setTimeout(res,2000)
        }))
        if( Math.random() > 0.5){
            // console.log('Sending email with options - ', options);
            return {success: true, message: 'Email sent successfully'};
        }
        else{
            console.log('Sending email pseudo fail');
            return {success: false, message: 'Email sent error - pseudo'};
        }
    }

    // if(isDev() && process.env?.SAVE_EMAIL){
    // const safeFileName = options.subject.replace(/[^a-z0-9_\-\.]/gi, "_").substring(0, 100) + ".html";
    // const outpath = path.join(process.cwd(), "emails", safeFileName);
    // fs.writeFileSync(outpath, options.html);
    // }
   
    return {
        success: true,
        message: "Dummy message sending status",
    };
}

MessagingController._buildEmail = async (template: EmailTemplateName, props: any) => await buildEmail(template, props);
MessagingController._sendEmail = async (options: any) => await sendEmail(options);
InvoiceController._generatePDFContent = async (invoice: Partial<Invoice>)=> {
    let defs 
    await withRemult(async ()=>{
        defs = await repo(Defaults).findFirst({platform: process.env.PLATFORM_NAME})
    }) 

    const finalTarget = invoicePopulateMetadata(defs, invoice)
    const invoiceContent = await generateInvoicePDF(finalTarget);
 
    const data = {
        filename: `invoice_${getReferenceNumber(invoice.id,'invoice')}-${invoice.customer?.company || invoice.customer.name}-${invoice.site?.line_one || invoice.billing.line_one}.pdf`,
        content: invoiceContent,
        contentType: 'application/pdf'
    }   
    
    return data
}

const mailRouter = Router()

if(isDev())
mailRouter.post('/api/dev/messaging/generate-content', async (req: Request, res: Response) => {
    console.log('Generating email content - ', req.query);
    const documentType = req.query.template as EmailTemplateName;
    const targetContent = req.body as Partial<Invoice>;
    await withRemult(async ()=>{
        const data = await MessagingController.generateContent(documentType,targetContent)
        if(['text','html'].includes(req.query?.select as string))
            res.send(data[req.query.select as string])
        else
            res.send(data)
    })
})

if(isDev())
mailRouter.post('/api/dev/messaging/generate-email', async (req: Request, res: Response) => {
    console.log('Sending email - ', req.query);
    const documentType = req.query.template as EmailTemplateName;
    const targetContent = req.body as Partial<Invoice>;
    await withRemult(async ()=>{
        const data = await MessagingController.sendEmail(documentType,targetContent)

        if(data.success)
            res.send(data)
        else
            res.status(500)
    })
})

if(isDev())
mailRouter.post('/api/dev/messaging/generate-sms', async (req: Request, res: Response) => {
    console.log('Sending sms - ', req.query);
    const documentType = req.query.template as EmailTemplateName;
    const targetContent = req.body as Partial<Invoice>;
    await withRemult(async ()=>{
        const data = await MessagingController.sendSms(documentType,targetContent,true)

        if(data.success)
            res.send(data)
        else
            res.status(500)
    })
})

if(isDev())
mailRouter.post('/api/dev/messaging/generate-pdf',async (req: Request, res: Response) => {
    try{
        await withRemult(async ()=>{
            const data = await InvoiceController._generatePDFContent(req.body as Partial<Invoice>)
            console.log(data)
            res.contentType('application/pdf').send(data)
        })
    }
    catch{
        res.sendStatus(500)
    }
})

// mailRouter.post('/api/messaging/send-email', async (req: Request, res: Response) => {
//     const { template } = req.query;
//     if (!template) {
//         console.error('Invalid template provided - ', req.query);
//          res.status(400).json({ type: 'error', message: 'Invalid template provided' });
//     }
//     try {
//         const data = req.body;

//         await transporter.sendMail({
//             ...data,
//             from: process.env.MAIL_FROM,
//         });

//          res.status(200).json({
//             success: true,
//             type: 'success',
//             message: 'Email sent successfully',
//         });
//     } catch (error) {
//         console.error('Fail sending email - ', error);
//          res.status(500).json({
//             type: 'error',
//             error: 'Failed to send email',
//             message: error instanceof Error ? error.message : 'Unknown error'
//         });
//     }
// });


export {mailRouter};