// Scholarship Monitoring System - main application logic
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=i=>document.getElementById(i);
const STATUSES=['Active','Pending Submission','For Verification','Compliant','With Deficiency','Probationary','For Renewal','Renewed','Disqualified'];
const TABS=['dashboard','scholars','programs','submissions','compliance'];
let user=null,programs=[],role='staff';

async function login(){
  const {data,error}=await sb.auth.signInWithPassword({email:$('em').value,password:$('pw').value});
  if(error) return alert(error.message); start(data.user);
}
async function logout(){await sb.auth.signOut();location.reload()}
async function start(u){
  user=u;
  {const {data:pf}=await sb.from('profiles').select('role').eq('id',u.id).single();role=pf?.role||'staff';}
  $('login').classList.add('hide');$('app').classList.remove('hide');
  $('nav').innerHTML='<div class="brand">🎓 Scholarship Monitor<small>Compliance System</small></div>'+TABS.map(t=>`<button id="n_${t}" onclick="show('${t}')">${NAVI[t]} ${LABEL[t]}</button>`).join('')+`<div class="sp"></div><div class="who">${u.email} (${role})</div><button onclick="logout()">🚪 Logout</button>`;
  const opt=(a,all)=>(all?'<option value="">All</option>':'')+a.map(x=>`<option>${x}</option>`).join('');
  $('s_status').innerHTML=opt(STATUSES);$('f_status').innerHTML=opt(STATUSES,1);
  await loadPrograms();show('dashboard');
}
function show(t){
  TABS.forEach(x=>{$(x).classList.toggle('hide',x!==t);$('n_'+x).classList.toggle('on',x===t)});$('title').textContent=LABEL[t];
  ({dashboard:loadDash,scholars:loadScholars,programs:loadPrograms,submissions:loadSubs,compliance:loadComp})[t]();
}
async function loadPrograms(){
  const {data}=await sb.from('scholarship_programs').select('*').order('id');programs=data||[];
  const o=programs.map(p=>`<option value="${p.id}">${p.program_name}</option>`).join('');
  $('s_prog').innerHTML='<option value="">-- select program --</option>'+o;
  $('f_prog').innerHTML='<option value="">All programs</option>'+o;
  $('p_card').classList.toggle('hide',role!=='admin');
  $('p_tbl').innerHTML='<tr><th>Program</th><th>Max GWA</th><th>Min Units</th><th>Failing OK</th></tr>'+
    programs.map(p=>`<tr><td>${p.program_name}</td><td>${p.required_gwa}</td><td>${p.min_units}</td><td>${p.allow_failing_grade?'Yes':'No'}</td></tr>`).join('');
}
async function saveProgram(){
  if(role!=='admin') return alert('Only admins can add or edit scholarship programs');
  const r={program_name:$('p_name').value.trim(),required_gwa:+$('p_gwa').value,min_units:+$('p_units').value,allow_failing_grade:$('p_fail').checked};
  if(!r.program_name) return alert('Program name required');
  const {error}=await sb.from('scholarship_programs').insert(r);
  if(error) return alert(error.message); loadPrograms();
}
async function loadDash(){
  const c=async(t,f)=>{let q=sb.from(t).select('*',{count:'exact',head:true});if(f)q=f(q);return (await q).count||0};
  const v=[await c('scholars'),await c('grade_submissions',q=>q.eq('submission_status','Pending')),
    await c('grade_submissions',q=>q.eq('submission_status','Verified')),
    await c('scholars',q=>q.eq('status','Compliant')),await c('scholars',q=>q.eq('status','With Deficiency'))];
  const l=['Total Scholars','Pending Submissions','Verified Submissions','Compliant Scholars','With Deficiency'];
  $('stats').innerHTML=l.map((x,i)=>`<div class="stat c${i}"><span>${['👥','⏳','✅','🏅','⚠️'][i]}</span><b>${v[i]}</b>${x}</div>`).join('');
}
async function loadScholars(){
  let q=sb.from('scholars').select('*,scholarship_programs(program_name)').order('student_id');
  const s=$('q').value.trim();
  if(s) q=q.or(`student_id.ilike.%${s}%,full_name.ilike.%${s}%`);
  if($('f_prog').value) q=q.eq('scholarship_id',$('f_prog').value);
  if($('f_status').value) q=q.eq('status',$('f_status').value);
  const {data,error}=await q; if(error) return alert(error.message);
  window._sch=data;
  $('s_tbl').innerHTML='<tr><th>ID</th><th>Name</th><th>Degree</th><th>Yr</th><th>Program</th><th>Status</th><th></th></tr>'+
   data.map(r=>`<tr><td>${r.student_id}</td><td>${r.full_name}</td><td>${r.degree_program||''}</td><td>${r.year_level||''}</td><td>${r.scholarship_programs?.program_name||''}</td><td>${badge(r.status)}</td><td><button onclick="editScholar(${r.id})">Edit</button></td></tr>`).join('');
}
function editScholar(id){
  const r=window._sch.find(x=>x.id===id);
  $('s_id').value=r.id;$('s_sid').value=r.student_id;$('s_name').value=r.full_name;$('s_deg').value=r.degree_program||'';
  $('s_yr').value=r.year_level||'';$('s_prog').value=r.scholarship_id;$('s_status').value=r.status;scrollTo(0,0);
}
async function saveScholar(){
  const r={student_id:$('s_sid').value.trim(),full_name:$('s_name').value.trim(),degree_program:$('s_deg').value.trim(),
    year_level:+$('s_yr').value||null,scholarship_id:+$('s_prog').value,status:$('s_status').value};
  if(!r.student_id) return alert('Student ID cannot be blank');
  if(!r.full_name) return alert('Full name required');
  if(!r.scholarship_id) return alert('Select a scholarship program');
  const id=$('s_id').value;
  const {error}=id?await sb.from('scholars').update(r).eq('id',id):await sb.from('scholars').insert(r);
  if(error) return alert(error.code==='23505'?'Student ID already exists':error.message);
  ['s_id','s_sid','s_name','s_deg','s_yr'].forEach(i=>$(i).value='');loadScholars();
}
async function loadSubs(){
  const {data:sc}=await sb.from('scholars').select('id,student_id,full_name').order('student_id');
  $('g_sch').innerHTML='<option value="">-- select scholar --</option>'+sc.map(s=>`<option value="${s.id}">${s.student_id} – ${s.full_name}</option>`).join('');
  const {data}=await sb.from('grade_submissions').select('*,scholars(student_id,full_name)').eq('submission_status','Pending').order('submitted_at');
  $('g_tbl').innerHTML='<tr><th>Scholar</th><th>AY/Sem</th><th>GWA</th><th>Units</th><th>Failed</th><th>Inc</th><th></th></tr>'+
   data.map(r=>`<tr><td>${r.scholars.student_id} ${r.scholars.full_name}</td><td>${r.academic_year} ${r.semester}</td><td>${r.gwa}</td><td>${r.units_enrolled}</td><td>${r.failed_subjects}</td><td>${r.incomplete_subjects}</td><td><button onclick="verify(${r.id})">Verify</button></td></tr>`).join('');
}
async function submitGrades(){
  const r={scholar_id:+$('g_sch').value,academic_year:$('g_ay').value.trim(),semester:$('g_sem').value,gwa:parseFloat($('g_gwa').value),
    units_enrolled:parseInt($('g_units').value),failed_subjects:parseInt($('g_fail').value),incomplete_subjects:parseInt($('g_inc').value),submission_status:'Pending'};
  if(!r.scholar_id||!r.academic_year) return alert('Scholar and academic year required');
  if(isNaN(r.gwa)||r.gwa<1||r.gwa>5) return alert('GWA must be between 1.0 and 5.0');
  if(isNaN(r.units_enrolled)||r.units_enrolled<0) return alert('Units cannot be negative');
  if(isNaN(r.failed_subjects)||r.failed_subjects<0||isNaN(r.incomplete_subjects)||r.incomplete_subjects<0) return alert('Subject counts cannot be negative');
  const {error}=await sb.from('grade_submissions').insert(r);
  if(error) return alert(error.code==='23505'?'Submission already exists for this scholar/term':error.message);
  await sb.from('scholars').update({status:'For Verification'}).eq('id',r.scholar_id);
  loadSubs();
}
// BR-05/BR-07: only verified records evaluated, using the assigned program's own rules. Lower GWA = better.
function evaluate(sub,p){
  return sub.gwa<=p.required_gwa && sub.units_enrolled>=p.min_units && (p.allow_failing_grade||sub.failed_subjects===0)
    ?'Compliant':'With Deficiency';
}
async function verify(id){
  const {data:sub}=await sb.from('grade_submissions').select('*,scholars(scholarship_id)').eq('id',id).single();
  if(sub.submission_status!=='Pending') return alert('Already verified (BR-09)');
  const {error}=await sb.from('grade_submissions').update({submission_status:'Verified',verified_by:user.id,verified_at:new Date().toISOString()}).eq('id',id);
  if(error) return alert('Not authorized to verify: '+error.message);
  const p=programs.find(x=>x.id===sub.scholars.scholarship_id), res=evaluate(sub,p);
  await sb.from('grade_submissions').update({evaluation_result:res}).eq('id',id);
  await sb.from('scholars').update({status:res}).eq('id',sub.scholar_id);
  alert('Verified. Result: '+res);loadSubs();
}
async function loadComp(){
  const {data}=await sb.from('grade_submissions').select('*,scholars(student_id,full_name,scholarship_programs(program_name,required_gwa,min_units))').eq('submission_status','Verified').order('verified_at',{ascending:false});
  $('c_tbl').innerHTML='<tr><th>Scholar</th><th>Program</th><th>AY/Sem</th><th>GWA (max)</th><th>Units (min)</th><th>Failed</th><th>Result</th></tr>'+
   data.map(r=>{const p=r.scholars.scholarship_programs;return `<tr><td>${r.scholars.student_id} ${r.scholars.full_name}</td><td>${p.program_name}</td><td>${r.academic_year} ${r.semester}</td><td>${r.gwa} (${p.required_gwa})</td><td>${r.units_enrolled} (${p.min_units})</td><td>${r.failed_subjects}</td><td>${badge(r.evaluation_result)}</td></tr>`}).join('');
}
const LABEL={dashboard:'Dashboard',scholars:'Scholars',programs:'Scholarship Programs',submissions:'Grade Submissions',compliance:'Compliance'};
const NAVI={dashboard:'📊',scholars:'👥',programs:'📋',submissions:'📝',compliance:'✔️'};
const badge=t=>`<span class="badge b-${(t||'').split(' ')[0]}">${t||'—'}</span>`;
function toast(m){const e=$('toast');e.textContent=m;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),3500)}
window.alert=toast;
sb.auth.getSession().then(({data})=>{if(data.session)start(data.session.user)});
