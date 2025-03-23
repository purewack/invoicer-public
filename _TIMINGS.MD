# Available ENV variables for timings

`CRON_ARCHIVE` - archival hooks period

`INVOICE_ARCHIVE_WINDOW` - INTEGER - how many days old after payment do the invoices need to be for archival

`JOB_ARCHIVE_WINDOW` - INTEGER - how many days old after completion / conclusion does the job need to be before archival

`CYCLE_ARCHIVE_WINDOW` - INTEGER - how many days old after completion do the cycles need to be before archival

---

`CRON_INVOICE_REMINDER` - frequency of invoice reminder check

`CRON_QUOTE_REMIND` - frequency of quote response reminder check

`CRON_QUOTE_POSTPONE` - frequency of moving new quotes to postponed

`CRON_QUOTE_PURGE` - frequency of deleting rejected 

`CRON_QUOTE_START` - frequency of checking if today the quote should activate yet

`CRON_QUOTE_CYCLE_NOTIFY` - frequency of notify check of upcoming work cycles
