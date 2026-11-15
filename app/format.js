export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
export const money=v=>{const n=Number(v??0);return Number.isFinite(n)?n.toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:n%1?2:0}):'—'};
export const date=v=>v?new Date(v).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
export const left=v=>{const ms=new Date(v).getTime()-Date.now();if(!v||!Number.isFinite(ms))return '—';if(ms<=0)return 'Ended';const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4);return d?`${d}d ${h}h left`:h?`${h}h ${m}m left`:`${m}m left`};
export const val=(o,...ks)=>{for(const k of ks){if(o?.[k]!=null)return o[k]}return null};
