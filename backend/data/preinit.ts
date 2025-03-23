import { _getYearID, Counter, Defaults, Invoice, JobItemTitle } from "@/shared/schema";
import path from "path";
import { remult, withRemult } from "remult";
import fs from "fs"
// import { usersWhitelist } from "@/auth/session";

export async function prefillDatabase(){
  const defaultsPath = path.resolve(__dirname, "defaults.json");
  if (fs.existsSync(defaultsPath)) {
    const defaults = JSON.parse(fs.readFileSync(defaultsPath, "utf-8"));
    await prefillJobTitles(defaults['x_job_item_titles']);
    await prefillDefaults()
    await initializeCounters()
  } else {
    console.warn("defaults.json file not found.");
  }
}

async function prefillDefaults(){
    await withRemult(async () => {
        const repo = remult.repo(Defaults);
        // Check if account already exists for this uid
        const exists = await repo.findFirst({platform: 'invoicer'});
        if (exists) {
            console.log("Defaults already exists");
            return exists;
        }
        const acc = await repo.insert({
            platform: 'invoicer',
            prefs: {
              cron_invoice_reminders: process.env.CRON_INVOICE_REMINDER,
              cron_archive: process.env.CRON_ARCHIVE,
              bcc_auto_reminders: true,
              default_payment_warnings: 3,
              default_payment_window: 7,
            },
            links: {
                email_footer: process.env.MAIL_FOOTER || '',
                email_logo: process.env.MAIL_LOGO || '',
                logo_icon: process.env.LOGO_ICON || '',
            },
            emails: {
                signoff: process.env.MAIL_SIGNOFF || '',
                signature: process.env.MAIL_SIGNATURE || 'Thank you.',
                forward_to: process.env.MAIL_BCC || '',
                reply_to: process.env.MAIL_REPLY || ''
            },
            finance: {
                billing_line_one: process.env.BILLING_LINE_ONE || '--',
                billing_city: process.env.BILLING_CITY || '--',
                billing_postcode: process.env.BILLING_POSTCODE || '--',
                payment_account: process.env.INVOICE_PAYMENT_ACCOUNT || '--',
                payment_sortcode: process.env.INVOICE_PAYMENT_SORT || '--',
                payment_name: process.env.INVOICE_PAYMENT_NAME || '--',
                payment_bank: process.env.INVOICE_PAYMENT_BANK || '--',
            }
        })
        console.log("account data prepopulated successfully:");
        return acc;
    })
}

async function prefillJobTitles(data: any) {
  let count = 0;
  await withRemult(async ()=>{
  const repo = remult.repo(JobItemTitle);
  count = await repo.count();
  })

  if (count === 0) {
    if (Array.isArray(data)) {
        await withRemult(async ()=>{
            const repo = remult.repo(JobItemTitle);
            for (const description of data) {
                await repo.insert(description);
            }
        })
      console.log("job titles prepopulated successfully.");
    } else {
      throw new Error("No job titles found in defaults.json.");
    }
  }
}

async function initializeCounters() {
  const tables = [
    { name: "invoices"},
    // Add more as needed
  ];
  const year = _getYearID()

  for (const t of tables) {
    const repo =  remult.repo(Invoice);
    // Find max sequence for this year
    const all = await repo.find({ where: { id: { $contains: `${year}-` } } });
    let max = 0;
    for (const row of all) {
      const match = typeof row.id === "string" && row.id.match(new RegExp(`^${year}-(\\d+)$`));
      if (match) {
        const num = parseInt(match[1]);
        if (num > max) max = num;
      }
    }
    // Upsert counter
    const counterRepo = remult.repo(Counter);
    let counter = await counterRepo.findFirst({ table: t.name, year });
    if (!counter) {
      counter = await counterRepo.insert({ table: t.name, year, value: max });
    } else if (counter.value < max) {
      await counterRepo.update(counter.id, { value: max });
    }
  }
}