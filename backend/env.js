require('dotenv').config();
const fs = require('fs');

if(process.env.NODE_ENV==='development'){
  process.exit(0)
}

const requiredEnvVars = [
  'DB_HOST', 
  'DB_USER', 
  'DB_PASS', 
  'MAIL_HOST',
  'MAIL_USER',
  'MAIL_PASS',
  'MAIL_FROM',
  'LOGO_ICON',
  'MAIL_LOGO',
  'MAIL_FOOTER',
  'CMS_NAMESPACE',
  'CMS_BUCKET',
  'CMS_FOLDER',
  'CRON_INVOICE_REMINDER'
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`ERROR: ${varName} is missing from environment`);
    process.exit(1);
  }
});