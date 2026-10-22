import home from '../data/home.json';
export const dynamic='force-dynamic';
export default function Home(){return <><div dangerouslySetInnerHTML={{__html:home}}/><script src="/navigation.js" defer/><script src="/site-layout.js" defer/><script src="/app.js" defer/></>;}
