const fs=require('fs'),path=require('path');
const S=path.join(__dirname,'..'); // корінь сайту = goit-onboarding
const ev=f=>{const ctx={};new Function('ctx',fs.readFileSync(f,'utf8').replace(/^const (\w+)/gm,'ctx.$1')+';')(ctx);return ctx;};
const T=ev(path.join(__dirname,'tutor_questions.js')), M=ev(path.join(__dirname,'mentor_tests.js'));
const tutor={title:'Фінальне тестування тьютора',blocks:T.BLOCKS,questions:T.QUESTIONS,checklist:T.CHECKLIST};
const mk=(plat,chk,title)=>({title,blocks:M.MENTOR_BLOCKS.map(b=>b.id==='mplat'?{...b,title:plat==='slack'?'Робота в Slack':'Робота в Telegram',src:plat==='slack'?'Slack':'Telegram',icon:plat==='slack'?'hash':'plane'}:b),
  questions:M.MENTOR_COMMON.concat(plat==='slack'?M.MENTOR_SLACK:M.MENTOR_TG),checklist:M.MENTOR_CHECK_COMMON.concat(chk)});
const out={tutor,slack:mk('slack',M.MENTOR_CHECK_SLACK,'Фінальне тестування ментора (Slack)'),telegram:mk('telegram',M.MENTOR_CHECK_TG,'Фінальне тестування ментора (Telegram)')};
fs.mkdirSync(path.join(S,'assets/js'),{recursive:true});
fs.writeFileSync(path.join(S,'assets/js/tests.js'),'window.ONB_TESTS = '+JSON.stringify(out)+';\n');
for(const [k,v] of Object.entries(out)) console.log(k,v.questions.length,'q',v.checklist.length,'chk');
