import PDFDocument from 'pdfkit';
import { capitalizeWords, formatCurrency, toDateString, uppercaseWords } from "@/shared/helpers";
import { getReferenceNumber, Invoice, InvoiceRenderable } from "@/shared/schema";
import path from 'path'

export async function generateInvoicePDF(invoiceData: InvoiceRenderable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers: Buffer[] = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Set up fonts and colors
    const colors = {
      titleText: '#333333',
      bodyText: '#555555',
      highlight: '#f5f5f5'
    };
    
    doc.image(path.join(__dirname,'..','data','res','logo-comp.jpeg'),
        doc.page.width / 2 - 64,
        32
    )
    doc.moveDown(12)

    // Invoice Header
    doc.fontSize(20)
       .font('Helvetica')
       .fillColor(colors.titleText)
       .text('INVOICE'+(invoiceData.payment_total && invoiceData.payment_total < invoiceData.due_total ? ' - REMINDER' : ''), { align: 'center' })
       .moveDown(0.5);

    // Invoice Details Row
    doc.font('Helvetica')
       .fillColor(colors.bodyText)
       .fontSize(10)
       .text('Invoice #:', { continued: true })
       .font('Helvetica-Bold')
       .text(getReferenceNumber(invoiceData.id || '(###)', 'invoice'), { align: 'left' })
       .moveDown(0.3);

    // Invoice Details Row
    // if(invoiceData.job_id)
    // doc.font('Helvetica')
    //     .fillColor(colors.bodyText)
    //     .fontSize(10)
    //     .text('Job #:', { continued: true })
    //     .font('Helvetica-Bold')
    //     .text(getReferenceNumber(invoiceData.job_id || '(###)', 'job'), { align: 'left' })
    //     .moveDown(0.3);

    doc.font('Helvetica')
       .text('Date Issued:', { continued: true })
       .text(toDateString(invoiceData.created_at))
       .moveDown(0.3);

    if (invoiceData.completion_date) {
      doc.text('Completed:', { continued: true })
         .text(toDateString(invoiceData.completion_date))
         .moveDown(0.3);
    }

    doc.text('Due Date:', { continued: true })
       .text(toDateString(invoiceData.due_date))
       .moveDown(1);

    // Amount Due Section
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(colors.titleText)
       .text(`Amount Due: ${formatCurrency(invoiceData.due_total)}`, { align: 'right' });

    if (invoiceData.payment_total && invoiceData.payment_total < invoiceData.due_total) {
      doc.moveDown(0.3)
         .text(`Cleared: ${formatCurrency(invoiceData.payment_total)}`, { align: 'right' })
         .moveDown(0.3)
         .text(`Remainder: ${formatCurrency(invoiceData.due_total - (invoiceData.payment_total || 0))}`, { align: 'right' });
    }

    // Address Section
    if(invoiceData.site?.line_one || invoiceData.site?.city || invoiceData.site?.postcode)
    doc.moveDown(1)
       .font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(colors.titleText)
       .text('SITE ADDRESS', { underline: true })
       .moveDown(0.3)
       .font('Helvetica')
       .fontSize(10)
       .fillColor(colors.bodyText)
       .text(capitalizeWords(invoiceData.site?.line_one || ''))
       .text(capitalizeWords(invoiceData.site?.city || ''))
       .text(uppercaseWords(invoiceData.site?.postcode || ''))
       .moveDown(1);

    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(colors.titleText)
       .text('BILLING ADDRESS', { underline: true })
       .moveDown(0.3)
       .font('Helvetica')
       .fontSize(10)
       .fillColor(colors.bodyText)
       .text(`To: ${capitalizeWords(invoiceData.customer?.company || invoiceData.customer?.name || '')}`)
       .text(capitalizeWords(invoiceData.billing?.line_one || ''))
       .text(capitalizeWords(invoiceData.billing?.city || ''))
       .text(uppercaseWords(invoiceData.billing?.postcode || ''))

    if(invoiceData.customer.billing_reference){
        doc.font('Helvetica')
        .fontSize(10)
        .fillColor(colors.bodyText)
        .text(`Billing REF: ${uppercaseWords(invoiceData.customer.billing_reference)}`)
    }
    
    doc.moveDown(2);

    // Items Table Configuration
    const tableConfig = {
        startX: 50,                  // Left margin for table
        rowHeight: 20,               // Base row height
        detailRowHeight: 30,         // Height when item has details
        headerColor: colors.highlight,
        alternateRowColor: '#f9f9f9',
        columns: [
        { width: 250, title: 'DESCRIPTION', align: 'left' as const },
        { width: 80, title: 'UNIT PRICE', align: 'right' as const },
        { width: 50, title: 'QTY', align: 'right' as const },
        { width: 80, title: 'AMOUNT', align: 'right' as const }
        ]
    };
    
    // Calculate total table width
    const tableWidth = tableConfig.columns.reduce((sum, col) => sum + col.width, 0);
    
    // =============================================
    // Items Table Header
    // =============================================
    doc.font('Helvetica-Bold')
        .fillColor(colors.titleText)
        .fontSize(10);
    
    // Draw header background
    doc.rect(tableConfig.startX, doc.y, tableWidth, tableConfig.rowHeight)
        .fill(tableConfig.headerColor);
    
    // Add column headers
    let currentX = tableConfig.startX;
    let currentY = doc.y
    doc.fillColor(colors.titleText)
    tableConfig.columns.forEach(column => {
            doc.text(column.title, currentX, doc.y + 5, {
            width: column.width,
            align: column.align,
        });
        currentX += column.width;
        doc.y = currentY
    });
    
    doc.moveDown(1.5);
    
    // =============================================
    // Items Rows
    // =============================================
    currentY = doc.y

    invoiceData.items?.forEach((item, index) => {
        const rowHeight = item.detail ? tableConfig.detailRowHeight : tableConfig.rowHeight;
        const bgColor = index % 2 === 0 ? '#ffffff' : tableConfig.alternateRowColor;
        
        currentY = doc.y
        // Draw row background
        doc.rect(tableConfig.startX, doc.y, tableWidth, rowHeight)
        .fill(bgColor);
    
    
        // Unit Price
        currentX = tableConfig.startX + tableConfig.columns[0].width;
        doc.font('Helvetica')
        .fillColor(colors.bodyText)
        .fontSize(10)
        .text(formatCurrency(item.unit_price), currentX, doc.y + 5, {
            width: tableConfig.columns[1].width,
            align: 'right'
        });
        doc.y = currentY
    
        // Quantity
        currentX += tableConfig.columns[1].width;
        doc.text('x1', currentX, doc.y + 5, {
        width: tableConfig.columns[2].width,
        align: 'right'
        });
        doc.y = currentY
    
        // Amount
        currentX += tableConfig.columns[2].width;
        doc.text(formatCurrency(item.unit_price), currentX, doc.y + 5, {
        width: tableConfig.columns[3].width,
        align: 'right'
        });
        doc.y = currentY
    
        // Item Title
        doc.font('Helvetica-Bold')
        .fillColor(colors.titleText)
        .fontSize(10)
        .text(item.title, tableConfig.startX, doc.y + 5, {
            width: tableConfig.columns[0].width,
            align: 'left'
        });
        doc.y = currentY

        // Item Detail (if exists)
        doc.font('Helvetica')
        .fillColor(colors.bodyText)
        .fontSize(9)
        .text(item?.detail || ' ', tableConfig.startX, doc.y + 20, {
        width: tableConfig.columns[0].width,
        align: 'left'
        });
        
    });
    
    // =============================================
    // Total Row
    // =============================================
    doc.moveDown(2);
    
    // Calculate positions
    const totalLabelX = tableConfig.startX + 
                        tableConfig.columns[0].width + 
                        tableConfig.columns[1].width
    const totalValueX = totalLabelX + tableConfig.columns[2].width;
    
    // Draw total row background if needed
    doc.rect(totalLabelX, doc.y, tableConfig.columns[2].width + tableConfig.columns[3].width, tableConfig.rowHeight)
        .fill(colors.highlight);
    
    currentY = doc.y
    // Total Label
    doc.font('Helvetica-Bold')
        .fillColor(colors.titleText)
        .fontSize(10)
        .text('TOTAL:', totalLabelX, doc.y + 5, {
        width: tableConfig.columns[2].width,
        align: 'right'
        });
    doc.y = currentY
    
    // Total Value
    doc.text(formatCurrency(invoiceData.due_total), totalValueX, doc.y + 5, {
        width: tableConfig.columns[3].width,
        align: 'right'
    });
    doc.y = currentY
    
    doc.moveDown(2);
    doc.x = tableConfig.startX

    // Notes
    if (invoiceData.notes) {
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor(colors.titleText)
         .text('NOTES', { underline: true })
         .moveDown(0.3)
         .font('Helvetica')
         .fontSize(10)
         .fillColor(colors.bodyText)
         .text(invoiceData.notes, { width: 400 })
         .moveDown(2);
    }

    doc.addPage();
    // =============================================
    // Payment Details Section
    // =============================================
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(colors.titleText)
       .text('PAYMENT DETAILS', { underline: true })
       .moveDown(0.5);

    doc.font('Helvetica')
        .fontSize(10)
        .fillColor(colors.bodyText)
        .text(`Account Name: ${invoiceData.metadata.self_payment_account.name}`)
        .text(`Account Number: ${invoiceData.metadata.self_payment_account.account}`)
        .text(`Sort Code: ${invoiceData.metadata.self_payment_account.sort}`)
        .text(invoiceData.metadata.self_payment_account.bank ? `Bank: ${invoiceData.metadata.self_payment_account.bank}` : '');

    // Billing Address
    doc.moveDown(1)
        .font('Helvetica-Bold')
        .text('OUR BILLING ADDRESS:', { underline: true })
        .moveDown(0.3)
        .font('Helvetica')
        .text(invoiceData.metadata.self_billing_address.line_one)
        .text(invoiceData.metadata.self_billing_address.city)
        .text(invoiceData.metadata.self_billing_address.postcode);
    

   const checkPageBreak = (doc: any, heightNeeded: number, margin = 20) => {
    const remainingSpace = doc.page.height - doc.y - doc.page.margins.bottom;
    if (remainingSpace < heightNeeded + margin) {
        doc.addPage();
        return true;
    }
    return false;
    };

   
    doc.moveDown(2);

    // Calculate space needed for footer content and image
    const footerContentHeight = 50; // Approximate height of text footer
    const footerImageHeight = 100; // Approximate height of your image
    const totalFooterHeight = footerContentHeight + footerImageHeight;

    // Check if we need a new page
    checkPageBreak(doc, totalFooterHeight);

    // Draw the divider line
    doc.moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - 40, doc.y)
    .lineWidth(1)
    .strokeColor(colors.bodyText)
    .stroke();

    doc.moveDown(1)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(colors.bodyText);

    // Use custom footer if available, otherwise default
    const footerText = invoiceData.metadata.signoff 

    doc.text(footerText, {
    align: 'left',
    paragraphGap: 5,
    lineGap: 2,
    indent: 0
    });

    // Check again before adding the image (in case text took more space than expected)
    checkPageBreak(doc, footerImageHeight, 20);

    // // Add the footer image
    // doc.image(path.join(__dirname,'..','data','res','footer-cert.jpeg'),
    // 16,
    // doc.y,
    // {
    //     width: doc.page.width - 32
    // }
    // );

    doc.end();
  });
}