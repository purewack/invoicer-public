# ENV variables - (non Cron)

`PROD_PORT` = port for backend server

`PUBLIC_API_KEY`= access key for requests

`ALLOWED_DOMAINS`= list of accepted domains for referrer and host headers

`API_CHECK_DOMAIN` = if defined, check referer / host domain

`RATE_LIMIT_WINDOW` = allowed time in ms until next API request from each ip

`DB_PASS`=

`DB_USER`=postgre

`DB_PORT`=5432

`DB_HOST`=

`MAIL_HOST`= SMTP credentials for mail server

`MAIL_USER`=

`MAIL_PASS`=

`MAIL_MOCK` = disable sending emails

`MAIL_LOGO_URL`=picture in email

`MAIL_FOOTER_URL`=footer picture in email

`MAIL_TO`= dev override for email destination

`MAIL_REPLY`= default email to reply to

`MAIL_FROM`=

`MAIL_BCC`=

Strings for invoice payment details and billing

`INVOICE_PAYMENT_NAME`

`INVOICE_PAYMENT_ACCOUNT`

`INVOICE_PAYMENT_SORT`

`BILLING_LINE_ONE`

`BILLING_CITY`

`BILLING_POSTCODE`


`SIGNOFF_TEXT`= footer text for each invoice