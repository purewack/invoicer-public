# Invoicer

**This is a stripped down version of a private repo which is currently running in production.**
--------

A full-stack system for managing invoices and keeping track of payment dates.

Things removed for this demo:
  - authentication, normally done with Google account and Firebase
  - Permanent DB data persistence
  - Cron jobs for DB backups and invoice payment reminders
  - sensitive client information
  - sending emails

The full system is a hybrid of a node backend server running Remult to interface with a Postgres DB.
The frontend runs on Vue and uses React internally to generate HTML email templates and sends them autonomously.

The cron-job manager checks invoices that are overdue and/or unpaid within their respective payment windows, all which can be set by the user.

The full system also uses docker-compose to create 2 separate images that work together, the backend and frontend. 
On a VPS, the system is deployed and hosted by a fronting reverse proxy so that the system can be used in conjuction to other apps running on the same VPS, via a subdomain

e.g.
Invoicer running on port 4000 internally and hosted at invoicer.example.com
EchoApp running on port 5000 internally and hosted at echo.example.com

This configuration enabled me to use 1 VPS for these app which are not so CPU and request intensive as the traffic is mild.

The authentication on the real app also follows a strict whitelist of users who can access this infrastructure, as each deployments is for a separate team/client.
