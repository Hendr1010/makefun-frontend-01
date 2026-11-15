const API='https://make.fun/api';
async function get(path){const r=await fetch(API+path,{headers:{accept:'application/json'}});if(!r.ok) throw Error('API '+r.status);return r.json()}
export const getBounties=()=>get('/competitions?status=open&activity=times');
export const getBounty=(slug)=>get('/competitions/'+encodeURIComponent(slug));
export const getLeaderboard=(slug)=>get('/competitions/'+encodeURIComponent(slug)+'/leaderboard').catch(()=>get('/competitions/'+encodeURIComponent(slug)));
export const getAccount=(id)=>get('/accounts/'+encodeURIComponent(id)).catch(()=>get('/users/'+encodeURIComponent(id)));
