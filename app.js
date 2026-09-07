let allQuestions=[],quiz=[],idx=0,score=0;
const KEY="dokugeki_law_v3_stats";
const $=x=>document.getElementById(x);
function getStats(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}}
function saveStats(s){localStorage.setItem(KEY,JSON.stringify(s))}
async function init(){try{const r=await fetch("questions.json",{cache:"no-store"});allQuestions=await r.json();if(allQuestions.length!==100)throw Error("100問ではありません")}catch(e){alert("問題データの読み込みに失敗しました")}}
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");scrollTo(0,0)}
function goHome(){show("home")}
function startQuiz(mode){
  let pool=[...allQuestions],s=getStats();
  if(mode==="wrong") pool=pool.filter(q=>(s[q.id]?.wrong||0)>0);
  if(mode==="weak") pool=pool.filter(q=>(s[q.id]?.seen||0)>=2&&(s[q.id].correct/s[q.id].seen)<.7);
  if(mode==="unseen") pool.sort((a,b)=>(s[a.id]?.seen||0)-(s[b.id]?.seen||0)||Math.random()-.5);
  else pool.sort(()=>Math.random()-.5);
  if(!pool.length){alert("該当する問題はありません");return}
  let n=mode==="wrong"||mode==="weak"||mode==="unseen"?Math.min(30,pool.length):mode;
  quiz=pool.slice(0,n);idx=0;score=0;show("quiz");render()
}
function render(){let q=quiz[idx];$("progress").textContent=`${idx+1} / ${quiz.length}`;$("qcat").textContent=q.cat;$("qdif").textContent=`難易度 ${q.difficulty}`;$("question").textContent=q.q;$("choices").innerHTML="";$("explain").classList.add("hidden");$("nextBtn").classList.add("hidden");q.choices.forEach((c,i)=>{let b=document.createElement("button");b.className="choice";b.textContent=`${String.fromCharCode(65+i)}. ${c}`;b.onclick=()=>answer(i);$("choices").appendChild(b)})}
function answer(i){let q=quiz[idx],ok=i===q.answer;if(ok)score++;let s=getStats(),x=s[q.id]||{seen:0,correct:0,wrong:0};x.seen++;ok?x.correct++:x.wrong++;s[q.id]=x;saveStats(s);[...$("choices").children].forEach((b,n)=>{b.disabled=true;if(n===q.answer)b.classList.add("correct");if(n===i&&!ok)b.classList.add("incorrect")});$("explain").innerHTML=`<b>${ok?"正解":"不正解"}</b><br>${q.ex}<br><small>根拠：${q.basis}</small>`;$("explain").classList.remove("hidden");$("nextBtn").classList.remove("hidden")}
function nextQuestion(){idx++;idx<quiz.length?render():finish()}
function finish(){$("question").textContent=`終了：${score} / ${quiz.length} 正解`;$('choices').innerHTML=`<p>正答率：<b>${Math.round(score/quiz.length*100)}%</b></p>`;$('explain').innerHTML="メニューに戻って次の学習を開始できます。";$('explain').classList.remove('hidden');$('nextBtn').classList.add('hidden')}
function showStats(){
  let s=getStats(),seen=0,correct=0,wrong=0,unique=0;
  allQuestions.forEach(q=>{let x=s[q.id];if(x&&x.seen){unique++;seen+=x.seen||0;correct+=x.correct||0;wrong+=x.wrong||0}});
  const rows=allQuestions.map(q=>{const x=s[q.id]||{};const n=x.seen||0,c=x.correct||0,w=x.wrong||0;const rate=n?Math.round(c/n*100):null;return {q,n,c,w,rate}});
  rows.sort((a,b)=>b.n-a.n||a.q.id-b.q.id);
  let html=`<p><b>収録問題：${allQuestions.length}問</b></p><p>実施済み：<b>${unique}問</b> ／ 未実施：<b>${allQuestions.length-unique}問</b></p><p>総出題回数：${seen}回</p><p>正解数：${correct}回</p><p>不正解数：${wrong}回</p><p>総合正答率：${seen?Math.round(correct/seen*100):0}%</p>`;
  html+=`<div style="overflow-x:auto;margin-top:16px"><table style="width:100%;border-collapse:collapse;font-size:14px;min-width:420px"><thead><tr><th style="padding:7px;border-bottom:2px solid #ccc;text-align:left">問題</th><th style="padding:7px;border-bottom:2px solid #ccc">出題</th><th style="padding:7px;border-bottom:2px solid #ccc">正解</th><th style="padding:7px;border-bottom:2px solid #ccc">不正解</th><th style="padding:7px;border-bottom:2px solid #ccc">正答率</th></tr></thead><tbody>`;
  html+=rows.map(r=>`<tr><td style="padding:6px;border-bottom:1px solid #eee">Q${String(r.q.id).padStart(3,'0')}</td><td style="padding:6px;text-align:center;border-bottom:1px solid #eee">${r.n}</td><td style="padding:6px;text-align:center;border-bottom:1px solid #eee">${r.c}</td><td style="padding:6px;text-align:center;border-bottom:1px solid #eee">${r.w}</td><td style="padding:6px;text-align:center;border-bottom:1px solid #eee">${r.rate===null?'未実施':r.rate+'%'}</td></tr>`).join('');
  html+=`</tbody></table></div><p class="note" style="margin-top:12px">※一覧は出題回数の多い順です。未実施問題は最後に表示されます。</p>`;
  $("statsBody").innerHTML=html;show("stats")
}
function resetStats(){if(confirm("学習履歴を削除しますか？")){localStorage.removeItem(KEY);showStats()}}
init();
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
