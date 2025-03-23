
export const isDev = ()=>process.env.NODE_ENV === 'development';
export const isStaging = ()=>!!process.env.PASSWORD_AUTH;