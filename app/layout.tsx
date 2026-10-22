import type {Metadata} from 'next';
export const metadata:Metadata={title:'مهند سلامة | الشهادات والخبرات والخدمات',description:'الملف المهني لمهند عبدالله سلامة. الخبرات والمؤهلات والشهادات والخدمات.',robots:{index:false,follow:false},icons:{icon:'/assets/brand-logo.jpg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="/assets/fonts.css"/><link rel="stylesheet" href="/style.css"/></head><body>{children}</body></html>;}
