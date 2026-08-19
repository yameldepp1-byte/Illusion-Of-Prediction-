// Deterministic, auditable ensemble. It estimates patterns; it does not guarantee future outcomes.
const clamp = (x, a=0, b=1) => Math.max(a, Math.min(b, x));
const side = n => Number(n) >= 5 ? "BIG" : "SMALL";
const color = n => Number(n) === 0 || Number(n) === 5 ? "VIOLET" : (Number(n)%2 ? "GREEN" : "RED");

function entropy(arr) {
  const c = {};
  arr.forEach(x => c[x]=(c[x]||0)+1);
  return Object.values(c).reduce((s,n)=> {
    const p=n/arr.length; return s-p*Math.log2(p);
  },0);
}
function streak(seq) {
  if (!seq.length) return 0;
  const x=seq[0]; let n=0;
  for (const v of seq) { if(v===x)n++; else break; }
  return {value:x,length:n};
}

export function predict(history) {
  const nums = history.slice(0,60).map(x=>Number(x.number));
  if (nums.length < 10) return { size:"BIG", color:"RED", number:7, confidence:0, method:"WARMUP", signals:[] };
  const sizes=nums.map(side), colors=nums.map(color);
  const recent=sizes.slice(0,12);
  const bigRate=recent.filter(x=>x==="BIG").length/recent.length;
  const sizeTrend=bigRate >= .5 ? "BIG":"SMALL";
  const s=streak(sizes);
  const transition = sizes.length>1 ? sizes.slice(0, -1).reduce((a,v,i)=>a+(v!==sizes[i+1]?1:0),0)/(sizes.length-1) : .5;
  const recentColor=colors.slice(0,15);
  const red=recentColor.filter(x=>x==="RED").length/recentColor.length;
  const green=recentColor.filter(x=>x==="GREEN").length/recentColor.length;
  const violet=recentColor.filter(x=>x==="VIOLET").length/recentColor.length;

  const votes = [
    {name:"recent-frequency", value: sizeTrend, weight:.30},
    {name:"streak-reversion", value: s.length>=3 ? (s.value==="BIG"?"SMALL":"BIG") : sizeTrend, weight:.22},
    {name:"transition-rate", value: transition>.52 ? (sizeTrend==="BIG"?"SMALL":"BIG") : sizeTrend, weight:.18},
    {name:"window-balance", value: nums.slice(0,30).filter(n=>n>=5).length>=15?"BIG":"SMALL", weight:.30}
  ];
  const scores={BIG:0,SMALL:0};
  votes.forEach(v=>scores[v.value]+=v.weight);
  const finalSize=scores.BIG>=scores.SMALL?"BIG":"SMALL";

  const cScores={RED:red, GREEN:green, VIOLET:violet};
  const finalColor=Object.entries(cScores).sort((a,b)=>b[1]-a[1])[0][0];

  // Candidate number is chosen from recent conditional frequencies, not random claims.
  const candidates=nums.filter(n=>side(n)===finalSize);
  const counts=Array.from({length:10},(_,n)=>[n,candidates.filter(x=>x===n).length])
    .sort((a,b)=>b[1]-a[1]);
  const number=counts[0][1] ? counts[0][0] : (finalSize==="BIG"?7:2);

  const margin=Math.abs(scores.BIG-scores.SMALL);
  const dataQuality=clamp(nums.length/60)*.35;
  const stability=clamp(1-entropy(sizes.slice(0,20))/1.0)*.15;
  const confidence=Math.round(50 + 45*clamp(margin + dataQuality + stability));
  return {
    size:finalSize, color:finalColor, number, confidence:Math.min(95, confidence),
    method:"ENSEMBLE / FREQUENCY / STREAK / TRANSITION",
    signals:[
      `BIG rate (12): ${(bigRate*100).toFixed(0)}%`,
      `leading streak: ${s.value} ×${s.length}`,
      `transition rate: ${(transition*100).toFixed(0)}%`,
      `color mix: R ${(red*100).toFixed(0)} / G ${(green*100).toFixed(0)} / V ${(violet*100).toFixed(0)}`
    ]
  };
}

export function evaluate(pred, actual) {
  const n=Number(actual.number);
  return {
    sizeWin: pred.size===side(n),
    colorWin: pred.color===color(n),
    numberHit: pred.number===n
  };
}
