// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/pages/Home.vue';
import DatabaseView from '@/components/Table.vue';
import CreateUpdateJob from '@/pages/QuoteEdit.vue';
import MockQuoteRequest from '@/pages/MockQuoteRequest.vue';
import NotFound from '@/pages/NotFound.vue';
import JobDetail from './pages/JobDetail.vue';
import InvoiceDetail from './pages/InvoiceDetail.vue';
import JobDirectory from './pages/JobDirectory.vue';
import Messaging from './pages/Messaging.vue';
import CMS from './pages/CMS.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  // {
  //   path: '/table/:tableName',
  //   name: 'DatabaseView',
  //   component: DatabaseView,
  //   props: true
  // },
  {
    path: '/invoice/:invoiceId',
    name: 'invoice',
    component: InvoiceDetail
  },
  // {
  //   path: '/invoice/job/:jobId',
  //   name: 'invoice-issue',
  //   component: InvoiceDetail
  // },
  {
    path: '/invoice-clone/:invoiceId',
    name: 'invoice-clone',
    component: InvoiceDetail
  },
  {
    path: '/invoice/edit/:invoiceId',
    name: 'invoice-edit',
    component: InvoiceDetail
  },
  {
    path: '/invoice/new',
    name: 'invoice-new',
    component: InvoiceDetail
  },
  {
    path: '/messaging',
    name: 'messaging',
    component: Messaging
  },
  // {
  //   path: '/cms#emails',
  //   name: 'email-info',
  //   component: CMS
  // },
  // {
  //   path: '/cms#finance',
  //   name: 'payment-info',
  //   component: CMS
  // },
  // {
  //   path: '/cms#images',
  //   name: 'image-info',
  //   component: CMS
  // },
  // {
  //   path: '/cms',
  //   component: CMS
  // },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  { path: '/:pathMatch(.*)', name: 'bad-not-found', component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;