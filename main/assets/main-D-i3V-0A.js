import{A as e,B as t,C as n,D as r,E as i,F as a,H as o,I as s,L as c,M as l,N as u,O as d,P as f,R as p,S as m,T as h,U as g,V as _,W as v,_ as y,a as b,b as x,f as S,g as C,h as w,i as T,j as E,k as D,l as O,m as k,n as A,r as j,s as ee,t as M,v as N,w as P,x as F,y as te,z as I}from"./maps-C82nHmmA.js";var ne={busGain:.7,glue:{threshold:-14,knee:8,ratio:2.5,attack:.008,release:.18},limiter:{threshold:-4,release:.12},trim:.92,softKnee:.8},re=class{input;output;constructor(e){this.input=e.createGain();let t=e.createDynamicsCompressor();t.threshold.value=ne.limiter.threshold,t.knee.value=0,t.ratio.value=20,t.attack.value=.001,t.release.value=ne.limiter.release;let n=e.createGain();n.gain.value=ne.trim;let r=e.createWaveShaper();r.curve=L(ne.softKnee),r.oversample=`2x`,this.input.connect(t).connect(n).connect(r).connect(e.destination),this.output=r}};function L(e,t=2049){let n=new Float32Array(t),r=.99-e;for(let i=0;i<t;i++){let a=i/(t-1)*2-1,o=Math.abs(a),s=o<=e?o:e+r*Math.tanh((o-e)/r);n[i]=Math.sign(a)*s}return n}var ie=new WeakMap;function ae(e){let t=ie.get(e);return t||(t=new re(e),ie.set(e,t)),t}var oe=class{ctx;out;noise=null;constructor(e){this.ctx=e,this.out=e.createGain(),this.out.connect(ae(e).input)}get output(){return this.out}set volume(e){this.out.gain.value=e}noiseBuf(){if(!this.noise){let{ctx:e}=this;this.noise=e.createBuffer(1,e.sampleRate*.5,e.sampleRate);let t=this.noise.getChannelData(0);for(let e=0;e<t.length;e++)t[e]=Math.random()*2-1}return this.noise}noiseBurst(e,t,n,r,i,a){let{ctx:o}=this,s=o.createBufferSource();s.buffer=this.noiseBuf();let c=o.createBiquadFilter();c.type=t,c.Q.value=1.2,c.frequency.setValueAtTime(n,e),c.frequency.exponentialRampToValueAtTime(r,e+a);let l=o.createGain();l.gain.setValueAtTime(i,e),l.gain.exponentialRampToValueAtTime(1e-4,e+a),s.connect(c).connect(l).connect(this.out),s.start(e,Math.random()*.2,a+.05)}tone(e,t,n,r,i,a){let{ctx:o}=this,s=o.createOscillator();s.type=t,s.frequency.setValueAtTime(n,e),s.frequency.exponentialRampToValueAtTime(r,e+a);let c=o.createGain();c.gain.setValueAtTime(i,e),c.gain.exponentialRampToValueAtTime(1e-4,e+a),s.connect(c).connect(this.out),s.start(e),s.stop(e+a+.02)}swing(e,t){let n=t??this.ctx.currentTime;e===`block`?this.noiseBurst(n,`lowpass`,900,300,.05,.06):this.noiseBurst(n,`bandpass`,e===`stab`?3e3:1800,600,.07,.09)}hit(e,t,n){let r=n??this.ctx.currentTime,i=t?1:.8;switch(e){case`block`:this.tone(r,`square`,2600*i,1900,.09,.09),this.tone(r,`triangle`,3900*i,3100,.07,.14),this.noiseBurst(r,`highpass`,5e3,3e3,.12,.05);break;case`slash`:this.noiseBurst(r,`bandpass`,5e3,900,.18,.12),this.tone(r,`sawtooth`,900*i,300,.05,.08);break;case`stab`:this.tone(r,`square`,1500*i,500,.1,.05),this.noiseBurst(r,`highpass`,6e3,4e3,.1,.03);break;case`flourish`:for(let[e,t]of[1320,1660,1980].entries())this.tone(r+e*.03,`triangle`,t*i,t,.06,.22);this.noiseBurst(r,`bandpass`,6e3,800,.14,.25)}}clank(e){let t=e??this.ctx.currentTime;this.tone(t,`square`,320,180,.08,.08)}shatter(e){let t=e??this.ctx.currentTime;this.noiseBurst(t,`highpass`,3e3,9e3,.2,.35),this.tone(t,`sine`,140,40,.25,.4)}hurt(e){let t=e??this.ctx.currentTime;this.noiseBurst(t,`lowpass`,2500,200,.5,.28)}};async function se(e,t,n=44100){let r=60/e,i=new OfflineAudioContext(1,Math.ceil((t*r+1)*n),n);for(let e=0;e<t;e++){let t=e*r,n=i.createOscillator();n.frequency.value=e%4==0?1800:1200;let a=i.createGain();a.gain.setValueAtTime(.6,t),a.gain.exponentialRampToValueAtTime(1e-4,t+.05),n.connect(a).connect(i.destination),n.start(t),n.stop(t+.06)}return i.startRendering()}var ce={perfect:.04,great:.075,good:.115,miss:.16},le={perfect:1,great:.7,good:.35,miss:0},ue={perfect:300,great:200,good:100,miss:0},de=[[0,1],[10,1.5],[25,2],[50,3],[100,4]],fe={maxHp:100,heal:{perfect:1.5,great:.75,good:0,miss:0},missDamage:8,hurtFlash:.35},pe={telegraphLead:.7,resolveTime:.14,walkInBeats:1},me={jitter:.018,missRate:.06,seed:1337},he={crush:.85,filterHz:1600,wobbleCents:70,wobbleHz:7,tapeStop:.35,tapeStopCents:1800,stutterSeconds:.3};function ge(e,t,n,r){let i=e=>Object.hasOwn(n,e);return e&&i(e)?{key:e,unknown:null}:{key:i(t)?t:r,unknown:e||null}}function _e(e,t){let n=new URL(e);return n.searchParams.set(`mapping`,t),n.toString()}var ve={block:`pump`,slash:`sweep`,stab:`stutter`,flourish:`lift`},ye={perfect:1,great:.85,good:.7,miss:0},R={minTailBeats:.35},be={depth:.9,exemptDepth:.65,attackDelay:.03,attack:.012,hold:.07,recoverBeats:1,curve:2.2,holdFraction:.75,exempt:[`k808`]},xe={lowHz:200,openHz:18e3,hold:.06,beats:1.5,curve:1.8,q:14},Se={sliceBeats:.25,duty:.7,gain:1,pattern:{perfect:[.25,.25,.125,.125,.0625,.0625,.0625,.0625],great:[.25,.25,.125,.125],good:[.25,.25,.25]},toneFrom:2200,toneTo:18e3},z={semis:12,windowSec:.05,wet:1,dryFloor:0,riserGain:.3,hpHz:650,gapBeats:.25,minBeats:1},Ce={intensity:1,pump:{scale:.06,dim:.5},sweep:{blurPx:3,desaturate:.85,iris:.75},stutter:{jitterPx:10,freezeOpacity:.55},lift:{risePx:28,zoom:.06,bright:.5,tint:.3,flash:.75},rackFlash:.6};function B(e,t,n){let r=[];for(let i=0;i<e.length;i++){let[a,o]=e[i],s=t+a;if(s<n)continue;let c=e[i-1];if(r.length===0&&c&&s>n){let e=t+c[0],i=(n-e)/(s-e);r.push({time:n,value:c[1]+(o-c[1])*i})}r.push({time:s,value:o})}return r}function V(e,t,n,r){if(t<=0||e.length===0)return e;let i=e[e.length-1][0],a=n+t;if(i-a<r||i<=n)return e.map(([e,n])=>[e+t,n]);let o=(i-a)/(i-n);return e.map(([e,r])=>[e<=n?e+t:a+(e-n)*o,r])}function we(e){return R.minTailBeats*e}function Te(e,t,n,r){return Array.from({length:n+1},(i,a)=>{let o=a/n;return[e+(t-e)*o,r(o)]})}function Ee(e,t,n){return e*(t/e)**+n}function De(e,t){return e.map(([e,n])=>[e,1-(1-n)*t])}function Oe(e){return Math.max(0,be.attackDelay-Math.max(0,e))}function ke(e,t,n=be.attackDelay){let r=Math.max(.02,1-be.depth*e),i=n,a=i+be.attack,o=a+be.hold,s=Math.max(o+.1,be.recoverBeats*t);return[[0,1],[i,1],[a,r],[o,r],...Te(o,s,12,e=>r+(1-r)*e**+be.curve).slice(1)]}function Ae(e,t=be.attackDelay){let n=t;return[[0,1],[n,1],[n+be.attack,1-be.depth*e*be.holdFraction]]}function je(e,t){return t?[[.05,.2],[.14,.85],[.22,.3],[1.2*e,1]]:[[.5*e,1]]}function Me(e){return[[0,1],[.045,.3],[.1,.8],[.15,.2],[.22,.55],[.3,.35],[1.3*e,1]]}var Ne=.006;function Pe(e,t){let n=xe.lowHz*2**(1.6*(1-e)),r=xe.beats*t,i=Ne+xe.hold;return{freq:[[0,xe.openHz],[Ne,n],...Te(i,r,14,e=>Ee(n,xe.openHz,e**+xe.curve))],q:[[0,.7],[Ne,xe.q*(.5+.5*e)],[r*.7,xe.q*.4],[r,.7]]}}function Fe(e){return{freq:[[0,xe.openHz],[.06,250],[.12,600],[.18,240],[.26,520],[.34,260],[e,480],[2*e,2500],[2.5*e,xe.openHz]],q:[[0,.7],[.06,18],[e,14],[2.5*e,.7]]}}function Ie(e,t,n,r){let i=Se.sliceBeats*n,a=Math.max(1,Math.ceil((t-e)/i-1e-9));if(a>3)return null;let o=e+a*i,s=o,c=[];for(let t of Se.pattern[r]){let r=t*n;c.push({start:o,len:r,delay:o-e,gain:Se.gain}),o+=r}return{slices:c,tone:[[0,Se.toneFrom],[o-s,Se.toneTo]],end:o}}function Le(e,t){let n=Se.sliceBeats*t*.62,r=e-n,i=[];for(let t=0;t<5;t++){let a=e+t*n;i.push({start:a,len:n,delay:a-r,gain:.9-t*.15})}let a=e+5*n+.04;return{slices:i,tone:[[0,6e3],[a-e,600]],end:a}}function Re(e,t,n,r){let i=t+n;for(;i-e<z.minBeats*r-1e-9;)i+=n;return i}function ze(e,t){return(2**(e/12)-1)/t}function Be(e,t){return 12*Math.log2(1+e*t)}function Ve(e,t,n){let r=z.semis*(.4+.6*e),i=z.windowSec,a=t-Math.min(z.gapBeats*n,t/4),o=.004;return{rate:[...Te(0,a,12,e=>ze(.15+r*e*e,i)),[t,0]],wet:[...Te(0,a,6,e=>z.wet*Math.min(1,.25+e)),[t,0]],dry:[...Te(0,a,6,e=>1-(1-z.dryFloor)*e),[t,1]],riser:[...Te(0,a,8,t=>z.riserGain*e*t*t*t),[a+o,0],[t,0]],riserHz:Te(0,a,8,e=>Ee(300,9e3,e)),hp:[...Te(0,a,8,t=>Ee(20,z.hpHz*e,t*t)),[t,20]],gap:[[0,1],[a-o,1],[a,0],[t-o,0],[t,1]]}}function He(e){let t=z.windowSec;return{rate:[[0,ze(.3,t)],[e*.35,ze(2,t)],[e*.65,ze(-5,t)],[e*.85,0]],wet:[[0,.4],[e*.35,.85],[e*.65,.85],[e*.85,0]],dry:[[0,.8],[e*.35,.25],[e*.65,.25],[e*.85,1]],riser:[[0,.02],[e*.3,z.riserGain*.5],[e*.32,0]],riserHz:[[0,300],[e*.3,1500],[e*.32,400]],hp:[[0,20]],gap:[[0,1]]}}function Ue(e,t){let{conductor:n,chart:r}=e;return e.bus.on(`action`,e=>{let i=n.cues[e.noteId],a=i?n.plays[i.play]:void 0;if(!i||!a)return;let o=ve[e.action],s=a.dur/r.beatsPerBar;if(e.kind===`holdEnd`){t({type:`release`,fx:o,at:e.time,beat:s,fumble:!e.hit});return}let c=e.hit?i.time:e.time;t({type:`start`,fx:o,anchor:c,at:e.time,beat:s,judgement:e.judgement,amount:ye[e.judgement],fumble:!e.hit,sustain:e.hold,target:o===`lift`?Re(c,a.start,a.dur,s):null})})}var We=class{pts;constructor(e){this.pts=[{time:-1/0,value:e,ramp:!1}]}valueAt(e){let{pts:t}=this,n=t.length-1;for(;n>0&&t[n].time>e;)n--;let r=t[n],i=t[n+1];return!i||!i.ramp||i.time<=r.time||r.time===-1/0?r.value:r.value+(i.value-r.value)*(e-r.time)/(i.time-r.time)}hold(e){let t=this.valueAt(e);this.cancel(e),this.push({time:e,value:t,ramp:!0})}cancel(e){this.pts=this.pts.filter((t,n)=>n===0||t.time<e)}set(e,t){this.push({time:t,value:e,ramp:!1})}ramp(e,t){this.push({time:t,value:e,ramp:!0})}prune(e){let t=0;for(;t+1<this.pts.length&&this.pts[t+1].time<=e;)t++;if(t>0){let e=this.pts[t];this.pts=[{time:-1/0,value:e.value,ramp:!1},...this.pts.slice(t+1)],this.pts[1]?.ramp&&this.pts.splice(1,0,{...e,ramp:!1})}}push(e){let t=this.pts.length;for(;t>1&&this.pts[t-1].time>e.time;)t--;this.pts.splice(t,0,e)}},Ge=.004,Ke=.003,qe=4,Je=class{param;trace;constructor(e){this.param=e,this.trace=new We(e.value)}hold(e){this.trace.prune(e-qe);let t=this.param;typeof t.cancelAndHoldAtTime==`function`?t.cancelAndHoldAtTime(e):(t.cancelScheduledValues(e),t.setValueAtTime(this.trace.valueAt(e),e)),this.trace.hold(e)}cancel(e){this.param.cancelScheduledValues(e),this.trace.cancel(e)}set(e,t){this.param.setValueAtTime(e,t),this.trace.set(e,t)}ramp(e,t){this.param.linearRampToValueAtTime(e,t),this.trace.ramp(e,t)}play(e,t,n){this.hold(n),B(e,t,n).forEach((e,t)=>{this.ramp(e.value,t===0?Math.max(e.time,n+Ge):e.time)})}at(e){return this.trace.valueAt(e)}},Ye=class{input;output;rate;sources=[];constructor(e,t){this.input=e.createGain(),this.output=e.createGain();let n=e.createConstantSource();n.offset.value=0,this.rate=n.offset;let r=new Float32Array(49),i=new Float32Array(49),a=new Float32Array(49);for(let e=1;e<=48;e++)i[e]=2/Math.PI*(e%2==1?1:-1)/e,a[e]=-(2/Math.PI)/e;let o=new Float32Array(49);o[1]=1;let s={disableNormalization:!0},c=(t,r)=>{let i=e.createOscillator();return i.setPeriodicWave(e.createPeriodicWave(t,r,s)),i.frequency.value=0,n.connect(i.frequency),this.sources.push(i),i},l=c(o,new Float32Array(49)),u=[[c(r,i),.5],[c(r,a),-.5]];for(let[n,r]of u){let i=e.createDelay(t*2);i.delayTime.value=t/2;let a=e.createGain();a.gain.value=-t/2,n.connect(a).connect(i.delayTime);let o=e.createGain();o.gain.value=.5;let s=e.createGain();s.gain.value=r,l.connect(s).connect(o.gain),this.input.connect(i).connect(o).connect(this.output)}this.sources.push(n);let d=e.currentTime;for(let e of this.sources)e.start(d)}dispose(){for(let e of this.sources)try{e.stop()}catch{}}},Xe=class{ctx;input;exempt;output;pump;exemptPump;lpFreq;lpQ;hpFreq;liftDry;liftWet;liftRate;riser;riserHz;gap;shifter;stutDry;stutDelay;stutTone;stutGate;noise;stutterEnd=0;stutters=[];nextStutter=1;last={pump:null,sweep:null,stutter:null,lift:null};constructor(e,t){this.ctx=e;let n=(t=1)=>{let n=e.createGain();return n.gain.value=t,n};this.input=n(),this.exempt=n();let r=n(),i=n();this.pump=new Je(r.gain),this.exemptPump=new Je(i.gain);let a=e.createBiquadFilter();a.type=`lowpass`,a.frequency.value=xe.openHz,a.Q.value=.7,this.lpFreq=new Je(a.frequency),this.lpQ=new Je(a.Q);let o=e.createBiquadFilter();o.type=`highpass`,o.frequency.value=20,o.Q.value=.9,this.hpFreq=new Je(o.frequency),this.input.connect(r).connect(a),this.exempt.connect(i).connect(a),a.connect(o);let s=n(),c=n(),l=n(0);this.liftDry=new Je(c.gain),this.liftWet=new Je(l.gain),this.shifter=new Ye(e,z.windowSec),this.liftRate=new Je(this.shifter.rate),o.connect(c).connect(s),o.connect(this.shifter.input),this.shifter.output.connect(l).connect(s);let u=n();this.gap=new Je(u.gain),this.output=u;let d=n();this.stutDry=new Je(d.gain);let f=e.createDelay(2);f.delayTime.value=0,this.stutDelay=f.delayTime;let p=e.createBiquadFilter();p.type=`lowpass`,p.frequency.value=2e4,this.stutTone=new Je(p.frequency);let m=n(0);this.stutGate=new Je(m.gain),s.connect(d).connect(u),s.connect(f).connect(p).connect(m).connect(u);let h=e.createBuffer(1,e.sampleRate*2,e.sampleRate),g=h.getChannelData(0);for(let e=0;e<g.length;e++)g[e]=Math.random()*2-1;this.noise=e.createBufferSource(),this.noise.buffer=h,this.noise.loop=!0;let _=e.createBiquadFilter();_.type=`bandpass`,_.Q.value=2.5,this.riserHz=new Je(_.frequency);let v=n(0);this.riser=new Je(v.gain),this.noise.connect(_).connect(v).connect(t),this.noise.start()}get now(){return this.ctx.currentTime+Ke}run(e,t){let n=this.now;if(e.type===`release`){if(e.fx===`pump`){let t=je(e.beat,e.fumble);this.pump.play(t,n,n),this.exemptPump.play(De(t,be.exemptDepth/be.depth),n,n)}return}let r=t(e.anchor),i=n-r,a=we(e.beat);switch(this.last[e.fx]={at:Math.max(n,r),judgement:e.judgement},e.fx){case`pump`:{let t=Oe(i),o=V(e.fumble?Me(e.beat):e.sustain?Ae(e.amount,t):ke(e.amount,e.beat,t),i,t+be.attack,a);this.pump.play(o,r,n),this.exemptPump.play(De(o,be.exemptDepth/be.depth),r,n);break}case`sweep`:{let t=e.fumble?Fe(e.beat):Pe(e.amount,e.beat),o=e.fumble?.06:Ne;this.lpFreq.play(V(t.freq,i,o,a),r,n),this.lpQ.play(V(t.q,i,o,a),r,n);break}case`stutter`:{let t=e.judgement===`miss`?Le(n,e.beat):Ie(r,n,e.beat,e.judgement);t&&this.stutter(t,n,Se.sliceBeats*e.beat);break}case`lift`:{let i=t(e.target??e.anchor+4*e.beat)-r,a=e.fumble?He(i):Ve(e.amount,i,e.beat);this.liftRate.play(a.rate,r,n),this.liftWet.play(a.wet,r,n),this.liftDry.play(a.dry,r,n),this.riser.play(a.riser,r,n),this.riserHz.play(a.riserHz,r,n),this.hpFreq.play(a.hp,r,n),this.gap.play(a.gap,r,n);break}}}stutter(e,t,n){let r=e.slices[0];if(!r)return;let i=this.stutGate;i.hold(t),i.ramp(0,t+Ge),this.stutDelay.cancelScheduledValues(t+Ge),this.stutTone.play(e.tone,r.start,t);let a=this.stutDry;a.hold(t),this.stutterEnd<=t&&a.set(1,Math.max(t,r.start-Ge)),a.ramp(0,Math.max(t+Ge,r.start));for(let n of e.slices){let e=Math.max(n.start,t+Ge);this.stutDelay.setValueAtTime(n.delay,e),i.set(0,e),i.ramp(n.gain,e+.002);let r=e+Math.max(.006,n.len*Se.duty);i.set(n.gain,r-.003),i.ramp(0,r)}a.set(0,e.end-Ge),a.ramp(1,e.end),this.stutterEnd=e.end,this.stutters=this.stutters.filter(e=>e.end>t-qe).map(e=>e.end>t?{...e,end:t}:e),this.stutters.push({...e,id:this.nextStutter++,unit:n})}meter(e){let t=Math.max(0,Math.min(1,1-this.pump.at(e))),n=this.lpFreq.at(e),r=Math.max(0,Math.min(1,Math.log(xe.openHz/n)/Math.log(xe.openHz/xe.lowHz))),i={id:0,slice:-1,of:0,open:!1,beats:0},a=[...this.stutters].reverse().find(t=>t.slices[0].start<=e&&e<t.end);if(a){let t=a.slices.findIndex(t=>e>=t.start&&e<t.start+t.len),n=a.slices[t];i.id=a.id,i.slice=t,i.of=a.slices.length,i.open=!!n&&e<n.start+Math.max(.006,n.len*Se.duty),i.beats=n?Se.sliceBeats*n.len/a.unit:0}let o=this.liftWet.at(e)>.05?Be(this.liftRate.at(e),z.windowSec):0,s=t=>{let n=this.last[t];return n&&e>=n.at?{age:e-n.at,judgement:n.judgement}:null};return{duck:t,cutoffHz:n,closed:r,repeat:i,semis:o,lift:Math.max(0,Math.min(1,o/z.semis)),gap:this.gap.at(e)<.5,last:{pump:s(`pump`),sweep:s(`sweep`),stutter:s(`stutter`),lift:s(`lift`)}}}dispose(){this.shifter.dispose();try{this.noise.stop()}catch{}this.output.disconnect(),this.riser.param.value=0}},Ze=({ctx:e,engine:t,sfx:n,chart:r,session:i})=>{let a=new Xe(e,t.musicBus),o=[];for(let[e,n]of t.parts){let r=be.exempt.includes(e)?a.exempt:a.input;n.disconnect(t.musicBus),n.connect(r),o.push([n,r])}a.output.connect(t.musicBus);let s=e=>t.ctxTimeFor(e),c=[Ue(i,e=>a.run(e,s)),i.bus.on(`input`,e=>{e.down&&n.swing(r.lanes[e.lane])}),i.bus.on(`duel`,e=>{e.type===`recovered`?n.clank():e.type===`defeated`&&n.shatter()})];return{meter:e=>a.meter(s(e)),dispose:()=>{c.forEach(e=>e());for(let[e,n]of o)e.disconnect(n),e.connect(t.musicBus);a.dispose()}}},Qe={block:{part:`k808`,onMiss:`mute`,accent:`boom808`},slash:{part:`lead`,onMiss:`glitch`,accent:`leadPluck`},stab:{part:`perc`,onMiss:`mute`,accent:`hatRoll`},flourish:{part:`vox`,onMiss:`glitch`,accent:`vocalChop`}},$e={maxMuteBars:2,stutterSeconds:.16,glitchFilterHz:900,glitchCrush:.8,glitchLevel:.35,accentLevel:.55,liveLead:!0},et=e=>440*2**((e-69)/12);function tt(e,t,n,r,i){let a=e.createGain();return a.gain.setValueAtTime(0,t),a.gain.linearRampToValueAtTime(n,t+r),a.gain.exponentialRampToValueAtTime(1e-4,t+r+i),a}var nt=new WeakMap;function rt(e){let t=nt.get(e);if(!t){t=e.createBuffer(1,e.sampleRate,e.sampleRate);let n=t.getChannelData(0);for(let e=0;e<n.length;e++)n[e]=Math.random()*2-1;nt.set(e,t)}return t}function it(e,t){let n=1024,r=new Float32Array(n);for(let e=0;e<n;e++){let n=e/1023*2-1;r[e]=Math.tanh(n*t)/Math.tanh(t)}let i=e.createWaveShaper();return i.curve=r,i}function at(e,t,n,r,i){let a=e.createOscillator(),o=et(r);a.frequency.setValueAtTime(o*2.6,n),a.frequency.exponentialRampToValueAtTime(o,n+.045),a.connect(tt(e,n,i,.002,.32)).connect(it(e,5)).connect(t),a.start(n),a.stop(n+.4)}function ot(e,t,n,r,i){for(let a=0;a<4;a++){let o=e.createBufferSource();o.buffer=rt(e);let s=e.createBiquadFilter();s.type=`highpass`,s.frequency.value=7e3+a*1200;let c=n+a*r;o.connect(s).connect(tt(e,c,i*(.5+a*.17),.001,.035)).connect(t),o.start(c,Math.random()*.5,.06)}}var st={a:[850,1220,2810],e:[420,2e3,2600],o:[460,840,2830]};function ct(e,t,n,r,i,a=`a`){let o=e.createOscillator();o.type=`sawtooth`;let s=et(r);o.frequency.setValueAtTime(s*2**(-2/12),n),o.frequency.exponentialRampToValueAtTime(s,n+.035);let c=e.createGain();st[a].forEach((t,n)=>{let r=e.createBiquadFilter();r.type=`bandpass`,r.frequency.value=t*1.35,r.Q.value=[7,11,13][n];let i=e.createGain();i.gain.value=[1.6,1,.55][n],o.connect(r).connect(i).connect(c)}),c.connect(tt(e,n,i,.006,.2)).connect(it(e,1.8)).connect(t),o.start(n),o.stop(n+.25)}var lt=class{bindings;maxMute;out=new Map;constructor(e,t){this.bindings=e,this.maxMute=t}miss(e,t){let n=this.bindings[e],r={mode:n.onMiss,from:t,until:t+this.maxMute};return this.out.set(n.part,r),{part:n.part,state:r}}cue(e,t){let n=this.bindings[e].part,r=this.out.get(n);return!r||t<=r.from?null:(this.out.delete(n),n)}expire(e){let t=[];for(let[n,r]of this.out)e>=r.until&&(this.out.delete(n),t.push(n));return t}state(e){return this.out.get(e)??null}};function ut(){let e=new Float32Array(512);for(let t=0;t<e.length;t++){let n=t/(e.length-1)*2-1;e[t]=Math.round(Math.tanh(n*2.5)*4)/4}return e}var dt=({ctx:e,engine:t,chart:n,session:r})=>{let i=60/n.tempo.bpmAtBeat(0),a=new lt(Qe,$e.maxMuteBars*i*n.beatsPerBar),o=new Map,s=h(n.file.audio.procedural),l=t.parts.has(`mix`)?`mix`:null,u=n=>{let r=o.get(n);if(r)return r;let i=t.parts.get(n);if(!i)return null;let a=e.createGain(),s=e.createGain(),c=e.createGain(),l=e.createGain();l.gain.value=0;let u=e.createWaveShaper();u.curve=ut();let d=e.createBiquadFilter();d.type=`lowpass`,d.frequency.value=2e4,i.disconnect(),i.connect(a),a.connect(s),s.connect(c).connect(d),s.connect(u).connect(l).connect(d),d.connect(t.musicBus);let f={input:a,gate:s,dry:c,crush:l,filter:d};return o.set(n,f),f};for(let e of Object.values(Qe))u(e.part);l&&u(l);let d=Qe.slash.part,f=$e.liveLead&&s!==null&&o.has(d),m=f&&s?p(s,n.beatsPerBar):[];f&&(t.parts.get(d).gain.value=0);let g=new Set,_=e=>o.get(Qe[e].part)??(l?o.get(l):null),v=(e,t)=>{for(let n of[e.gate.gain,e.dry.gain,e.crush.gain,e.filter.frequency])n.cancelScheduledValues(t);e.gate.gain.setTargetAtTime(1,t,.008),e.dry.gain.setValueAtTime(1,t),e.crush.gain.setValueAtTime(0,t),e.filter.frequency.setValueAtTime(2e4,t)},y=(t,n)=>{let r=_(t);if(!r)return;let s=e.currentTime,c=Qe[t].onMiss,l=i/8,u=r.gate.gain;if(u.cancelScheduledValues(s),!o.has(Qe[t].part)){for(let e=0;e<4;e++)u.setValueAtTime(e%2?1:.2,s+e*l);u.setValueAtTime(1,s+4*l);return}a.miss(t,n);let d=s,f=!1,p=s+$e.stutterSeconds;for(;d<p;)u.setValueAtTime(+!!f,d),f=!f,d+=l;c===`mute`?u.setValueAtTime(0,p):(u.setValueAtTime($e.glitchLevel,p),r.dry.gain.setValueAtTime(1-$e.glitchCrush,s),r.crush.gain.setValueAtTime($e.glitchCrush,s),r.filter.frequency.setValueAtTime(2e4,s),r.filter.frequency.exponentialRampToValueAtTime($e.glitchFilterHz,s+.2))},b=(n,a)=>{let o=_(n);if(!o)return;let l=e.currentTime,u=r.conductor.playAt(a)?.bar??0,d=s?c(u):{root808:38,leadTones:[74,78,81,86],chord:[62,66,69,74]},f=Math.max(...d.chord),p=$e.accentLevel;switch(Qe[n].accent){case`boom808`:at(e,o.input,l,d.root808+12,p);break;case`leadPluck`:for(let n of x(e,o.input,l,d.leadTones[3]??81,i*.5,p*1.4,r.patch))t.connectBend(n.detune);break;case`hatRoll`:ot(e,o.input,l,i/8,p);break;case`vocalChop`:ct(e,o.input,l,f+12,p,`a`)}},S=[r.bus.on(`action`,t=>{if(t.hit){if(t.kind===`holdEnd`)return;let n=_(t.action);n&&a.cue(t.action,t.time)&&v(n,e.currentTime),b(t.action,t.time)}else y(t.action,t.time)})];return{update(s){for(let e of r.cuesBetween(s,s+.15)){if(e.time<=s)continue;let n=a.cue(e.action,e.time),r=n?o.get(n):null;r&&v(r,t.ctxTimeFor(e.time-.004))}for(let t of a.expire(s)){let n=o.get(t);n&&v(n,e.currentTime)}if(!f)return;let c=o.get(d);for(let a of r.conductor.plays){if(a.start>s+.2)break;let o=`${a.index}:${a.bar}:${a.attempt}`;if(a.start+a.dur<s||g.has(o))continue;g.add(o);let l=n.bars[a.bar].startBeat;for(let n of m[a.bar]??[]){let o=a.start+(n.beat-l)*i;if(!(o<s))for(let a of x(e,c.input,t.ctxTimeFor(o),n.midi[0],n.len*i,n.vel,r.patch))t.connectBend(a.detune)}}},dispose(){S.forEach(e=>e())}}},ft={block:`k808`,slash:`lead`,stab:`perc`,flourish:`vox`},pt={mutedLevel:.1,glitchBeats:.5,chopLow:.12,accent:{perfect:1.35,great:1.2,good:1.08},accentBeats:.25,leadLookahead:.1};function mt(e,t,n=!0){let r=t/8,i=e+pt.glitchBeats*t,a=[],o=!0;for(let t=e;t<i-1e-9;t+=r)a.push({t,v:o?1:pt.chopLow,ramp:`set`}),o=!o;return a.push({t:i,v:n?pt.mutedLevel:1,ramp:`linear`}),a}function ht(e,t,n){return[{t:e,v:pt.accent[t],ramp:`linear`},{t:e+pt.accentBeats*n,v:1,ramp:`linear`}]}var gt={stutter:`STUTTER FILL`,riser:`RISER`,filterOpen:`FILTER OPEN`,tapeStop:`TAPE STOP`},_t={stutter:1,riser:2,filterOpen:2,tapeStop:1},vt=[`stutter`,`riser`,`filterOpen`],yt=class{streak=0;lastBar=-2;failed(){this.streak=0}cleared(e,t){let n=e.bar===this.lastBar+1;this.streak=n?this.streak+1:1,this.lastBar=e.bar;let r=t?`tapeStop`:e.attempt>1?`filterOpen`:vt[(this.streak-1)%vt.length];return{kind:r,intensity:Math.min(1,.7+.1*(this.streak-1)),fillBeats:_t[r]}}};function bt(e,t){return!e.bars[t+1]?.combo}function xt(e,t=64){let n=new Float32Array(t);for(let r=0;r<t;r++){let i=r/(t-1)*e;n[r]=i*i/(2*e)}return n}var St=class{chart;byBar;done=new Set;constructor(e,t){this.chart=e,this.byBar=t}due(e,t,n=pt.leadLookahead){let r=[],{tempo:i}=this.chart;for(let a of e){if(a.start>t+n)break;if(a.start+a.dur<t-.05)continue;let e=this.chart.bars[a.bar],o=this.byBar[a.bar];e&&o&&o.forEach((o,s)=>{let c=a.start+(i.beatToSec(o.beat)-e.startSec),l=`${a.index}:${a.bar}:${a.attempt}:${s}`;if(c>t+n||this.done.has(l)||(this.done.add(l),c<t-.05))return;let u=i.beatToSec(o.beat+o.len)-i.beatToSec(o.beat);r.push({key:l,time:c,midi:o.midi[0]??74,len:u,vel:o.vel})})}return r}},Ct=.008,wt=class{ctx;dest;input;dry;tape;tapeGain;capture;loop;loopFb;loopGain;lp;out;noise=null;constructor(e,t){this.ctx=e,this.dest=t,this.input=e.createGain(),this.dry=e.createGain(),this.tape=e.createDelay(2),this.tape.delayTime.value=0,this.tapeGain=e.createGain(),this.tapeGain.gain.value=0,this.capture=e.createGain(),this.capture.gain.value=0,this.loop=e.createDelay(1),this.loopFb=e.createGain(),this.loopFb.gain.value=0,this.loopGain=e.createGain(),this.loopGain.gain.value=0,this.lp=e.createBiquadFilter(),this.lp.type=`lowpass`,this.lp.frequency.value=2e4,this.lp.Q.value=.7,this.out=e.createGain(),this.input.connect(this.dry).connect(this.lp),this.input.connect(this.tape).connect(this.tapeGain).connect(this.lp),this.input.connect(this.capture).connect(this.loop),this.loop.connect(this.loopFb).connect(this.loop),this.loop.connect(this.loopGain).connect(this.lp),this.lp.connect(this.out).connect(t)}play(e,t,n,r){let i=this.ctx.currentTime;if(t=Math.max(t,i+.01),!(n-t<.05))switch(e.kind){case`stutter`:this.stutter(t,n,r,e.intensity);break;case`tapeStop`:this.tapeStop(t,n);break;case`filterOpen`:this.filterOpen(t,n,r,e.intensity);break;case`riser`:this.riser(t,n,e.intensity)}}stutter(e,t,n,r){let i=n/4;this.loop.delayTime.setValueAtTime(i,e);let a=this.capture.gain;a.cancelScheduledValues(e),a.setValueAtTime(1,e),a.setValueAtTime(0,e+i);let o=this.loopFb.gain;o.cancelScheduledValues(e),o.setValueAtTime(1,e),o.setValueAtTime(0,t);let s=Math.min(t,e+i);this.fade(this.dry.gain,1,0,s);let c=this.loopGain.gain;c.cancelScheduledValues(s),c.setValueAtTime(0,s),c.linearRampToValueAtTime(.75+.3*r,s+Ct),c.linearRampToValueAtTime(.9+.3*r,t-Ct),c.linearRampToValueAtTime(0,t),this.fade(this.dry.gain,0,1,t)}tapeStop(e,t){let n=t-e,r=this.tape.delayTime;r.cancelScheduledValues(e-.001),r.setValueCurveAtTime(xt(n),e,n-.001),r.setValueAtTime(0,t+Ct),this.fade(this.dry.gain,1,0,e);let i=this.tapeGain.gain;i.cancelScheduledValues(e),i.setValueAtTime(0,e),i.linearRampToValueAtTime(1,e+Ct),i.setValueAtTime(1,t-n*.3),i.linearRampToValueAtTime(.35,t),i.linearRampToValueAtTime(0,t+Ct),this.fade(this.dry.gain,0,1,t),this.impact(t,.8)}filterOpen(e,t,n,r){let i=this.lp.frequency,a=this.lp.Q;i.cancelScheduledValues(e),a.cancelScheduledValues(e),i.setValueAtTime(2e4,e),i.exponentialRampToValueAtTime(420-120*r,t),a.setValueAtTime(.7,e),a.linearRampToValueAtTime(5+4*r,t),i.exponentialRampToValueAtTime(2e4,t+n),a.linearRampToValueAtTime(.7,t+n)}riser(e,t,n){let{ctx:r}=this,i=r.createBufferSource();i.buffer=this.noiseBuf(),i.loop=!0;let a=r.createBiquadFilter();a.type=`bandpass`,a.Q.value=3,a.frequency.setValueAtTime(400,e),a.frequency.exponentialRampToValueAtTime(9e3,t);let o=r.createGain();o.gain.setValueAtTime(1e-4,e),o.gain.exponentialRampToValueAtTime(.35*n,t-.01),o.gain.linearRampToValueAtTime(0,t),i.connect(a).connect(o).connect(this.dest),i.start(e),i.stop(t+.05);let s=r.createOscillator();s.type=`sawtooth`,s.frequency.setValueAtTime(220,e),s.frequency.exponentialRampToValueAtTime(1760,t);let c=r.createGain();c.gain.setValueAtTime(1e-4,e),c.gain.exponentialRampToValueAtTime(.06*n,t-.01),c.gain.linearRampToValueAtTime(0,t),s.connect(c).connect(this.dest),s.start(e),s.stop(t+.05),this.impact(t,n)}impact(e,t){let{ctx:n}=this,r=n.createOscillator();r.frequency.setValueAtTime(90,e),r.frequency.exponentialRampToValueAtTime(32,e+.45);let i=n.createGain();i.gain.setValueAtTime(.5*t,e),i.gain.exponentialRampToValueAtTime(1e-4,e+.5),r.connect(i).connect(this.dest),r.start(e),r.stop(e+.55);let a=n.createBufferSource();a.buffer=this.noiseBuf();let o=n.createBiquadFilter();o.type=`lowpass`,o.frequency.setValueAtTime(7e3,e),o.frequency.exponentialRampToValueAtTime(500,e+.4);let s=n.createGain();s.gain.setValueAtTime(.18*t,e),s.gain.exponentialRampToValueAtTime(1e-4,e+.4),a.connect(o).connect(s).connect(this.dest),a.start(e),a.stop(e+.45)}fade(e,t,n,r){e.setValueAtTime(t,r),e.linearRampToValueAtTime(n,r+Ct)}noiseBuf(){if(!this.noise){let{ctx:e}=this;this.noise=e.createBuffer(1,e.sampleRate,e.sampleRate);let t=this.noise.getChannelData(0);for(let e=0;e<t.length;e++)t[e]=Math.random()*2-1}return this.noise}dispose(){this.input.disconnect(),this.out.disconnect()}},Tt=({ctx:e,engine:t,sfx:n,chart:r,session:i})=>{let a=60/r.tempo.bpmAtBeat(0),o=new wt(e,t.musicBus),s=new Map,c=[],l=(t,n,r)=>{let i=e.createGain(),a=e.createGain();return a.gain.value=0,t.connect(i).connect(o.input),t.connect(Dt(e)).connect(a).connect(o.input),{level:n,crush:a,dry:i,mute:r}},u=h(r.file.audio.procedural),d=u!==null&&t.parts.has(`lead`);for(let[e,n]of t.parts)n.disconnect(),c.push(n),e===`lead`&&d?n.gain.value=0:Object.values(ft).includes(e)||e===`mix`?s.set(e,l(n,n.gain,e!==`mix`)):n.connect(o.input);let f=null,m=null;if(d){f=e.createGain();let t=e.createGain();k(e,f,t,a),s.set(`lead`,l(t,t.gain,!0)),m=new St(r,p(u,r.beatsPerBar))}let g=e=>s.get(ft[e])??s.get(`mix`),_=(n,r)=>{let i=r[0];if(!i)return;let a=Math.max(e.currentTime,t.ctxTimeFor(i.t));n.cancelScheduledValues(a),n.setValueAtTime(n.value,a);for(let e of r){let r=Math.max(a,t.ctxTimeFor(e.t));e.ramp===`set`?n.setValueAtTime(e.v,r):n.linearRampToValueAtTime(e.v,r+.005)}},v=e=>{let t=g(e.action);if(t){if(e.judgement===`miss`){let n=mt(e.time,a,t.mute);_(t.level,n);let r=n[n.length-1].t;_(t.crush.gain,[{t:e.time,v:.9,ramp:`set`},{t:r,v:0,ramp:`linear`}]),_(t.dry.gain,[{t:e.time,v:.35,ramp:`set`},{t:r,v:1,ramp:`linear`}])}else e.kind!==`holdEnd`&&(_(t.crush.gain,[{t:e.time,v:0,ramp:`linear`}]),_(t.dry.gain,[{t:e.time,v:1,ramp:`linear`}]),t.mute&&_(t.level,ht(e.time,e.judgement,a)))}},y=new yt,b=Et(),S=null,C=[i.bus.on(`input`,e=>{e.down&&n.swing(r.lanes[e.lane])}),i.bus.on(`action`,v),i.bus.on(`duel`,e=>{e.type===`recovered`?n.clank():e.type===`defeated`&&n.shatter()}),i.bus.on(`combo`,e=>{if(e.type===`failed`){y.failed();return}let n=y.cleared(e.play,bt(r,e.play.bar)),i=e.play.start+e.play.dur,s=Math.max(e.time,i-n.fillBeats*a);o.play(n,t.ctxTimeFor(s),t.ctxTimeFor(i),a),S={at:s,text:`FLOURISH · ${gt[n.kind]}`}})];return{update(n){if(m&&f)for(let r of m.due(i.conductor.plays,n)){let n=Math.max(e.currentTime,t.ctxTimeFor(r.time));for(let a of x(e,f,n,r.midi,r.len,r.vel,i.patch))t.connectBend(a.detune)}S&&n>=S.at&&(b?.show(S.text),S=null)},dispose(){C.forEach(e=>e()),o.dispose(),f?.disconnect(),b?.remove();for(let e of c)e.disconnect(),e.connect(t.musicBus)}}};function Et(){if(typeof document>`u`)return null;let e=document.createElement(`div`);e.className=`flourish-tag`,Object.assign(e.style,{position:`fixed`,left:`50%`,top:`88px`,transform:`translateX(-50%)`,font:`bold 15px monospace`,letterSpacing:`0.12em`,color:`#ffd84a`,textShadow:`0 0 8px #ffd84a`,pointerEvents:`none`,opacity:`0`,transition:`opacity 0.5s`,zIndex:`20`}),document.body.appendChild(e);let t=0;return{show(n){e.textContent=n,e.style.transition=`none`,e.style.opacity=`1`,window.clearTimeout(t),t=window.setTimeout(()=>{e.style.transition=`opacity 0.5s`,e.style.opacity=`0`},1100)},remove(){window.clearTimeout(t),e.remove()}}}function Dt(e){let t=1024,n=new Float32Array(t);for(let e=0;e<t;e++){let t=e/1023*2-1;n[e]=Math.round(Math.tanh(t*2.5)*4)/4}let r=e.createWaveShaper();return r.curve=n,r}var Ot={instruments:{label:`INSTRUMENTS`,description:`Each move plays a part: block = 808, slash = lead (your synth patch), stab = hats/perc, flourish = vocal chops. A miss mutes or glitches that part.`,create:dt},sword:{label:`SWORD SFX`,description:`Moves make sword sounds; the song plays as written.`,create:({session:e,chart:t,sfx:n})=>{let r=[e.bus.on(`input`,e=>{e.down&&n.swing(t.lanes[e.lane])}),e.bus.on(`action`,e=>{e.hit&&e.kind!==`holdEnd`&&n.hit(e.action,e.judgement===`perfect`)}),e.bus.on(`duel`,e=>{e.type===`recovered`?n.clank():e.type===`defeated`&&n.shatter()})];return{dispose:()=>r.forEach(e=>e())}}},fx:{label:`B · PRODUCER FX`,description:`Each move is a mix-wide effect: BLOCK pumps, SLASH sweeps a filter, STAB stutters, FLOURISH lifts into the next bar. Misses fumble the effect.`,create:Ze},hybrid:{label:`C · HYBRID`,description:`Moves play instruments (808, lead, hats, vocal chops); a clean combo measure fires a production flourish at the bar line.`,create:Tt}},kt=`instruments`;function At(e){return Ot[e]??Ot.instruments}var jt=[{name:`A S D F`,keys:[`KeyA`,`KeyS`,`KeyD`,`KeyF`]},{name:`F G H J`,keys:[`KeyF`,`KeyG`,`KeyH`,`KeyJ`]},{name:`ARROWS`,keys:[`ArrowLeft`,`ArrowDown`,`ArrowUp`,`ArrowRight`]},{name:`D F J K`,keys:[`KeyD`,`KeyF`,`KeyJ`,`KeyK`]}],Mt={audioOffsetMs:0,visualOffsetMs:0,scrollSpeed:1,keys4:[...jt[0].keys],musicVolume:.8,hitsoundVolume:.35,noFail:!0,difficulty:`easy`,musicMapping:kt},Nt=`voxel-rhythm.settings.v3`;function Pt(e){return e.startsWith(`Key`)?e.slice(3):e.startsWith(`Digit`)?e.slice(5):{Space:`␣`,Semicolon:`;`,ArrowLeft:`←`,ArrowRight:`→`,ArrowUp:`↑`,ArrowDown:`↓`}[e]??e}function Ft(){try{let e=localStorage.getItem(Nt);if(!e)return{...Mt};let t={...Mt,...JSON.parse(e)};return Array.isArray(t.keys4)&&t.keys4.length===4||(t.keys4=[...Mt.keys4]),t}catch{return{...Mt}}}function It(e){try{localStorage.setItem(Nt,JSON.stringify(e))}catch{}}var Lt=`lab-140`;function Rt(){let e=[];for(let t of s(d)){if(!t.chart)continue;let n={beat:t.beat,action:t.chart.action};t.chart.length&&(n.length=t.chart.length),e.push(n)}return e.sort((e,t)=>e.beat-t.beat||_.indexOf(e.action)-_.indexOf(t.action)),{format:o,version:3,meta:{title:`LAB.EXE`,artist:`procedural (Web Audio)`,charter:`playtest lab generator`,difficulty:`lab`,description:`A 57 s test chart shared by the gameplay experiments.`},audio:{procedural:Lt,lengthBeats:r},timing:{bpm:140,offsetMs:0,beatsPerBar:4},encounters:[{beat:0,enemy:`grunt`,name:`GRUNT`},{beat:33,enemy:`duelist`,name:`DUELIST`},{beat:65,enemy:`knight`,name:`KNIGHT`},{beat:89,enemy:`brute`,name:`DAEMON`}],prompts:[{beat:68,text:`BOSS COMBO: clear the whole measure or it repeats`,beats:4}],combos:i.map(e=>({...e})),notes:e}}function zt(e){let t=e.chart?.()??Rt(),n=e.options?.prompts===!1?{...t,prompts:[]}:t,r=S(n);if(!r.ok)throw new M(`Experiment "${e.key}" has an invalid chart`,r.errors);return{file:r.chart,warnings:r.warnings}}function Bt(e){try{let t=O(zt(e).file);return Math.round(t.lastNoteTime+4.5)}catch{return 60}}async function Vt(e){let{file:t,warnings:n}=zt(e);if(!t.audio.procedural)throw new M(`Experiment "${e.key}" must use a procedural song`);let r=await ee(t.audio.procedural);return{chart:O(t),stems:r,warnings:n}}var Ht=1e3,Ut=1001,Wt=1002,Gt=1003,Kt=1004,qt=1005,Jt=1006,Yt=1007,Xt=1008,Zt=1009,Qt=1010,$t=1011,en=1012,tn=1013,nn=1014,rn=1015,an=1016,on=1017,sn=1018,cn=1020,ln=35902,un=35899,dn=1021,fn=1022,pn=1023,mn=1026,hn=1027,gn=1028,_n=1029,vn=1030,yn=1031,bn=1033,xn=33776,Sn=33777,Cn=33778,wn=33779,Tn=35840,En=35841,Dn=35842,On=35843,kn=36196,An=37492,jn=37496,Mn=37488,Nn=37489,Pn=37490,Fn=37491,In=37808,Ln=37809,Rn=37810,zn=37811,Bn=37812,Vn=37813,Hn=37814,Un=37815,Wn=37816,Gn=37817,Kn=37818,qn=37819,Jn=37820,Yn=37821,Xn=36492,Zn=36494,Qn=36495,$n=36283,er=36284,tr=36285,nr=36286,rr=2300,ir=2301,ar=2302,or=2303,sr=2400,cr=2401,lr=2402,ur=3200,dr=`srgb`,fr=`srgb-linear`,pr=`linear`,mr=`srgb`,hr=7680,gr=35044,_r=35048,vr=2e3;function yr(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function br(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function xr(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function Sr(){let e=xr(`canvas`);return e.style.display=`block`,e}var Cr={};function wr(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function Tr(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function H(...e){e=Tr(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function U(...e){e=Tr(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Er(...e){let t=e.join(` `);t in Cr||(Cr[t]=!0,H(...e))}function Dr(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var Or={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3},kr=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},Ar=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),jr=Math.PI/180,Mr=180/Math.PI;function Nr(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(Ar[e&255]+Ar[e>>8&255]+Ar[e>>16&255]+Ar[e>>24&255]+`-`+Ar[t&255]+Ar[t>>8&255]+`-`+Ar[t>>16&15|64]+Ar[t>>24&255]+`-`+Ar[n&63|128]+Ar[n>>8&255]+`-`+Ar[n>>16&255]+Ar[n>>24&255]+Ar[r&255]+Ar[r>>8&255]+Ar[r>>16&255]+Ar[r>>24&255]).toLowerCase()}function W(e,t,n){return Math.max(t,Math.min(n,e))}function Pr(e,t){return(e%t+t)%t}function Fr(e,t,n){return(1-n)*e+n*t}function Ir(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}function Lr(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`THREE.MathUtils: Invalid component type.`)}}var G=class e{static{e.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=W(this.x,e.x,t.x),this.y=W(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=W(this.x,e,t),this.y=W(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(W(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(W(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Rr=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:H(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(W(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},K=class e{static{e.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Br.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Br.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=W(this.x,e.x,t.x),this.y=W(this.y,e.y,t.y),this.z=W(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=W(this.x,e,t),this.y=W(this.y,e,t),this.z=W(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(W(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return zr.copy(this).projectOnVector(e),this.sub(zr)}reflect(e){return this.sub(zr.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(W(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},zr=new K,Br=new Rr,q=class e{static{e.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return Er(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(Vr.makeScale(e,t)),this}rotate(e){return Er(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(Vr.makeRotation(-e)),this}translate(e,t){return Er(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(Vr.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Vr=new q,Hr=new q().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Ur=new q().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Wr(){let e={enabled:!0,workingColorSpace:fr,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=Kr(e.r),e.g=Kr(e.g),e.b=Kr(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=qr(e.r),e.g=qr(e.g),e.b=qr(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?pr:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(t,n){return Er(`ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`),e.workingToColorSpace(t,n)},toWorkingColorSpace:function(t,n){return Er(`ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`),e.colorSpaceToWorking(t,n)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[fr]:{primaries:t,whitePoint:r,transfer:pr,toXYZ:Hr,fromXYZ:Ur,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:dr},outputColorSpaceConfig:{drawingBufferColorSpace:dr}},[dr]:{primaries:t,whitePoint:r,transfer:mr,toXYZ:Hr,fromXYZ:Ur,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:dr}}}),e}var Gr=Wr();function Kr(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function qr(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var Jr,Yr=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Jr===void 0&&(Jr=xr(`canvas`)),Jr.width=e.width,Jr.height=e.height;let t=Jr.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=Jr}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=xr(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Kr(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Kr(t[e]/255)*255):t[e]=Kr(t[e]);return{data:t,width:e.width,height:e.height}}return H(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Xr=0,Zr=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Xr++}),this.uuid=Nr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width,t.height,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Qr(r[t].image)):e.push(Qr(r[t]))}else e=Qr(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Qr(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Yr.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(H(`Texture: Unable to serialize Texture.`),{})}var $r=0,ei=new K,ti=class e extends kr{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=Ut,i=Ut,a=Jt,o=Xt,s=pn,c=Zt,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:$r++}),this.uuid=Nr(),this.name=``,this.source=new Zr(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new G(0,0),this.repeat=new G(1,1),this.center=new G(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new q,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ei).x}get height(){return this.source.getSize(ei).y}get depth(){return this.source.getSize(ei).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){H(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?H(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Ht:e.x-=Math.floor(e.x);break;case Ut:e.x=e.x<0?0:1;break;case Wt:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case Ht:e.y-=Math.floor(e.y);break;case Ut:e.y=e.y<0?0:1;break;case Wt:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};ti.DEFAULT_IMAGE=null,ti.DEFAULT_MAPPING=300,ti.DEFAULT_ANISOTROPY=1;var ni=class e{static{e.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=W(this.x,e.x,t.x),this.y=W(this.y,e.y,t.y),this.z=W(this.z,e.z,t.z),this.w=W(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=W(this.x,e,t),this.y=W(this.y,e,t),this.z=W(this.z,e,t),this.w=W(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(W(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},ri=class extends kr{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Jt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new ni(0,0,e,t),this.scissorTest=!1,this.viewport=new ni(0,0,e,t),this.textures=[];let r=new ti({width:e,height:t,depth:n.depth}),i=n.count;for(let e=0;e<i;e++)this.textures[e]=r.clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Jt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Zr(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},ii=class extends ri{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},ai=class extends ti{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Gt,this.minFilter=Gt,this.wrapR=Ut,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},oi=class extends ti{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Gt,this.minFilter=Gt,this.wrapR=Ut,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},si=class e{static{e.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/ci.setFromMatrixColumn(e,0).length(),i=1/ci.setFromMatrixColumn(e,1).length(),a=1/ci.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(ui,e,di)}lookAt(e,t,n){let r=this.elements;return mi.subVectors(e,t),mi.lengthSq()===0&&(mi.z=1),mi.normalize(),fi.crossVectors(n,mi),fi.lengthSq()===0&&(Math.abs(n.z)===1?mi.x+=1e-4:mi.z+=1e-4,mi.normalize(),fi.crossVectors(n,mi)),fi.normalize(),pi.crossVectors(mi,fi),r[0]=fi.x,r[4]=pi.x,r[8]=mi.x,r[1]=fi.y,r[5]=pi.y,r[9]=mi.y,r[2]=fi.z,r[6]=pi.z,r[10]=mi.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],ee=r[14],M=r[3],N=r[7],P=r[11],F=r[15];return i[0]=a*x+o*T+s*k+c*M,i[4]=a*S+o*E+s*A+c*N,i[8]=a*C+o*D+s*j+c*P,i[12]=a*w+o*O+s*ee+c*F,i[1]=l*x+u*T+d*k+f*M,i[5]=l*S+u*E+d*A+f*N,i[9]=l*C+u*D+d*j+f*P,i[13]=l*w+u*O+d*ee+f*F,i[2]=p*x+m*T+h*k+g*M,i[6]=p*S+m*E+h*A+g*N,i[10]=p*C+m*D+h*j+g*P,i[14]=p*w+m*O+h*ee+g*F,i[3]=_*x+v*T+y*k+b*M,i[7]=_*S+v*E+y*A+b*N,i[11]=_*C+v*D+y*j+b*P,i[15]=_*w+v*O+y*ee+b*F,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=ci.set(r[0],r[1],r[2]).length(),o=ci.set(r[4],r[5],r[6]).length(),s=ci.set(r[8],r[9],r[10]).length();i<0&&(a=-a),li.copy(this);let c=1/a,l=1/o,u=1/s;return li.elements[0]*=c,li.elements[1]*=c,li.elements[2]*=c,li.elements[4]*=l,li.elements[5]*=l,li.elements[6]*=l,li.elements[8]*=u,li.elements[9]*=u,li.elements[10]*=u,t.setFromRotationMatrix(li),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=vr,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=vr,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},ci=new K,li=new si,ui=new K(0,0,0),di=new K(1,1,1),fi=new K,pi=new K,mi=new K,hi=new si,gi=new Rr,_i=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(W(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-W(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(W(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-W(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(W(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-W(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:H(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return hi.makeRotationFromQuaternion(e),this.setFromRotationMatrix(hi,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return gi.setFromEuler(this),this.setFromQuaternion(gi,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};_i.DEFAULT_ORDER=`XYZ`;var vi=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},yi=0,bi=new K,xi=new Rr,Si=new si,Ci=new K,wi=new K,Ti=new K,Ei=new Rr,Di=new K(1,0,0),Oi=new K(0,1,0),ki=new K(0,0,1),Ai={type:`added`},ji={type:`removed`},Mi={type:`childadded`,child:null},Ni={type:`childremoved`,child:null},Pi=class e extends kr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:yi++}),this.uuid=Nr(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new K,n=new _i,r=new Rr,i=new K(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new si},normalMatrix:{value:new q}}),this.matrix=new si,this.matrixWorld=new si,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new vi,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return xi.setFromAxisAngle(e,t),this.quaternion.multiply(xi),this}rotateOnWorldAxis(e,t){return xi.setFromAxisAngle(e,t),this.quaternion.premultiply(xi),this}rotateX(e){return this.rotateOnAxis(Di,e)}rotateY(e){return this.rotateOnAxis(Oi,e)}rotateZ(e){return this.rotateOnAxis(ki,e)}translateOnAxis(e,t){return bi.copy(e).applyQuaternion(this.quaternion),this.position.add(bi.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Di,e)}translateY(e){return this.translateOnAxis(Oi,e)}translateZ(e){return this.translateOnAxis(ki,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Si.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ci.copy(e):Ci.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),wi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Si.lookAt(wi,Ci,this.up):Si.lookAt(Ci,wi,this.up),this.quaternion.setFromRotationMatrix(Si),r&&(Si.extractRotation(r.matrixWorld),xi.setFromRotationMatrix(Si),this.quaternion.premultiply(xi.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(U(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ai),Mi.child=e,this.dispatchEvent(Mi),Mi.child=null):U(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(ji),Ni.child=e,this.dispatchEvent(Ni),Ni.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Si.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Si.multiply(e.parent.matrixWorld)),e.applyMatrix4(Si),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ai),Mi.child=e,this.dispatchEvent(Mi),Mi.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(wi,e,Ti),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(wi,Ei,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};Pi.DEFAULT_UP=new K(0,1,0),Pi.DEFAULT_MATRIX_AUTO_UPDATE=!0,Pi.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Fi=class extends Pi{constructor(){super(),this.isGroup=!0,this.type=`Group`}},Ii={type:`move`},Li=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Fi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Fi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new K,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new K),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Fi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new K,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new K,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Ii)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Fi;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Ri={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},zi={h:0,s:0,l:0},Bi={h:0,s:0,l:0};function Vi(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var J=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=dr){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Gr.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=Gr.workingColorSpace){return this.r=e,this.g=t,this.b=n,Gr.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=Gr.workingColorSpace){if(e=Pr(e,1),t=W(t,0,1),n=W(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=Vi(i,r,e+1/3),this.g=Vi(i,r,e),this.b=Vi(i,r,e-1/3)}return Gr.colorSpaceToWorking(this,r),this}setStyle(e,t=dr){function n(t){t!==void 0&&parseFloat(t)<1&&H(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:H(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);H(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=dr){let n=Ri[e.toLowerCase()];return n===void 0?H(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Kr(e.r),this.g=Kr(e.g),this.b=Kr(e.b),this}copyLinearToSRGB(e){return this.r=qr(e.r),this.g=qr(e.g),this.b=qr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=dr){return Gr.workingToColorSpace(Hi.copy(this),e),Math.round(W(Hi.r*255,0,255))*65536+Math.round(W(Hi.g*255,0,255))*256+Math.round(W(Hi.b*255,0,255))}getHexString(e=dr){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Gr.workingColorSpace){Gr.workingToColorSpace(Hi.copy(this),t);let n=Hi.r,r=Hi.g,i=Hi.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=Gr.workingColorSpace){return Gr.workingToColorSpace(Hi.copy(this),t),e.r=Hi.r,e.g=Hi.g,e.b=Hi.b,e}getStyle(e=dr){Gr.workingToColorSpace(Hi.copy(this),e);let t=Hi.r,n=Hi.g,r=Hi.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(zi),this.setHSL(zi.h+e,zi.s+t,zi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(zi),e.getHSL(Bi);let n=Fr(zi.h,Bi.h,t),r=Fr(zi.s,Bi.s,t),i=Fr(zi.l,Bi.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Hi=new J;J.NAMES=Ri;var Ui=class e{constructor(e,t=1,n=1e3){this.isFog=!0,this.name=``,this.color=new J(e),this.near=t,this.far=n}clone(){return new e(this.color,this.near,this.far)}toJSON(){return{type:`Fog`,name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Wi=class extends Pi{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new _i,this.environmentIntensity=1,this.environmentRotation=new _i,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Gi=new K,Ki=new K,qi=new K,Ji=new K,Yi=new K,Xi=new K,Zi=new K,Qi=new K,$i=new K,ea=new K,ta=new ni,na=new ni,ra=new ni,ia=class e{constructor(e=new K,t=new K,n=new K){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Gi.subVectors(e,t),r.cross(Gi);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Gi.subVectors(r,t),Ki.subVectors(n,t),qi.subVectors(e,t);let a=Gi.dot(Gi),o=Gi.dot(Ki),s=Gi.dot(qi),c=Ki.dot(Ki),l=Ki.dot(qi),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Ji)!==null&&Ji.x>=0&&Ji.y>=0&&Ji.x+Ji.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Ji)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Ji.x),s.addScaledVector(a,Ji.y),s.addScaledVector(o,Ji.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return ta.setScalar(0),na.setScalar(0),ra.setScalar(0),ta.fromBufferAttribute(e,t),na.fromBufferAttribute(e,n),ra.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(ta,i.x),a.addScaledVector(na,i.y),a.addScaledVector(ra,i.z),a}static isFrontFacing(e,t,n,r){return Gi.subVectors(n,t),Ki.subVectors(e,t),Gi.cross(Ki).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Gi.subVectors(this.c,this.b),Ki.subVectors(this.a,this.b),Gi.cross(Ki).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Yi.subVectors(r,n),Xi.subVectors(i,n),Qi.subVectors(e,n);let s=Yi.dot(Qi),c=Xi.dot(Qi);if(s<=0&&c<=0)return t.copy(n);$i.subVectors(e,r);let l=Yi.dot($i),u=Xi.dot($i);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(Yi,a);ea.subVectors(e,i);let f=Yi.dot(ea),p=Xi.dot(ea);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Xi,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Zi.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Zi,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Yi,a).addScaledVector(Xi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},aa=class{constructor(e=new K(1/0,1/0,1/0),t=new K(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(sa.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(sa.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=sa.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,sa):sa.fromBufferAttribute(r,t),sa.applyMatrix4(e.matrixWorld),this.expandByPoint(sa);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),ca.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),ca.copy(e.boundingBox)),ca.applyMatrix4(e.matrixWorld),this.union(ca)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,sa),sa.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ha),ga.subVectors(this.max,ha),la.subVectors(e.a,ha),ua.subVectors(e.b,ha),da.subVectors(e.c,ha),fa.subVectors(ua,la),pa.subVectors(da,ua),ma.subVectors(la,da);let t=[0,-fa.z,fa.y,0,-pa.z,pa.y,0,-ma.z,ma.y,fa.z,0,-fa.x,pa.z,0,-pa.x,ma.z,0,-ma.x,-fa.y,fa.x,0,-pa.y,pa.x,0,-ma.y,ma.x,0];return!ya(t,la,ua,da,ga)||(t=[1,0,0,0,1,0,0,0,1],!ya(t,la,ua,da,ga))?!1:(_a.crossVectors(fa,pa),t=[_a.x,_a.y,_a.z],ya(t,la,ua,da,ga))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,sa).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(sa).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(oa[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),oa[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),oa[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),oa[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),oa[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),oa[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),oa[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),oa[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(oa)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},oa=[new K,new K,new K,new K,new K,new K,new K,new K],sa=new K,ca=new aa,la=new K,ua=new K,da=new K,fa=new K,pa=new K,ma=new K,ha=new K,ga=new K,_a=new K,va=new K;function ya(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){va.fromArray(e,a);let o=i.x*Math.abs(va.x)+i.y*Math.abs(va.y)+i.z*Math.abs(va.z),s=t.dot(va),c=n.dot(va),l=r.dot(va);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var ba=new K,xa=new G,Sa=0,Ca=class extends kr{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Sa++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=gr,this.updateRanges=[],this.gpuType=rn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)xa.fromBufferAttribute(this,t),xa.applyMatrix3(e),this.setXY(t,xa.x,xa.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ba.fromBufferAttribute(this,t),ba.applyMatrix3(e),this.setXYZ(t,ba.x,ba.y,ba.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ba.fromBufferAttribute(this,t),ba.applyMatrix4(e),this.setXYZ(t,ba.x,ba.y,ba.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ba.fromBufferAttribute(this,t),ba.applyNormalMatrix(e),this.setXYZ(t,ba.x,ba.y,ba.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ba.fromBufferAttribute(this,t),ba.transformDirection(e),this.setXYZ(t,ba.x,ba.y,ba.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Ir(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Lr(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ir(t,this.array)),t}setX(e,t){return this.normalized&&(t=Lr(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ir(t,this.array)),t}setY(e,t){return this.normalized&&(t=Lr(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ir(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Lr(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ir(t,this.array)),t}setW(e,t){return this.normalized&&(t=Lr(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Lr(t,this.array),n=Lr(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Lr(t,this.array),n=Lr(n,this.array),r=Lr(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=Lr(t,this.array),n=Lr(n,this.array),r=Lr(r,this.array),i=Lr(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}},wa=class extends Ca{constructor(e,t,n){super(new Uint16Array(e),t,n)}},Ta=class extends Ca{constructor(e,t,n){super(new Uint32Array(e),t,n)}},Ea=class extends Ca{constructor(e,t,n){super(new Float32Array(e),t,n)}},Da=new aa,Oa=new K,ka=new K,Aa=class{constructor(e=new K,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?Da.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Oa.subVectors(e,this.center);let t=Oa.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(Oa,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ka.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Oa.copy(e.center).add(ka)),this.expandByPoint(Oa.copy(e.center).sub(ka))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},ja=0,Ma=new si,Na=new Pi,Pa=new K,Fa=new aa,Ia=new aa,La=new K,Ra=class e extends kr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ja++}),this.uuid=Nr(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(yr(e)?Ta:wa)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new q().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Ma.makeRotationFromQuaternion(e),this.applyMatrix4(Ma),this}rotateX(e){return Ma.makeRotationX(e),this.applyMatrix4(Ma),this}rotateY(e){return Ma.makeRotationY(e),this.applyMatrix4(Ma),this}rotateZ(e){return Ma.makeRotationZ(e),this.applyMatrix4(Ma),this}translate(e,t,n){return Ma.makeTranslation(e,t,n),this.applyMatrix4(Ma),this}scale(e,t,n){return Ma.makeScale(e,t,n),this.applyMatrix4(Ma),this}lookAt(e){return Na.lookAt(e),Na.updateMatrix(),this.applyMatrix4(Na.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Pa).negate(),this.translate(Pa.x,Pa.y,Pa.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new Ea(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&H(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new aa);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)U(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new K(-1/0,-1/0,-1/0),new K(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Fa.setFromBufferAttribute(n),this.morphTargetsRelative?(La.addVectors(this.boundingBox.min,Fa.min),this.boundingBox.expandByPoint(La),La.addVectors(this.boundingBox.max,Fa.max),this.boundingBox.expandByPoint(La)):(this.boundingBox.expandByPoint(Fa.min),this.boundingBox.expandByPoint(Fa.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&U(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Aa);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)U(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new K,1/0);else if(e){let n=this.boundingSphere.center;if(Fa.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Ia.setFromBufferAttribute(n),this.morphTargetsRelative?(La.addVectors(Fa.min,Ia.min),Fa.expandByPoint(La),La.addVectors(Fa.max,Ia.max),Fa.expandByPoint(La)):(Fa.expandByPoint(Ia.min),Fa.expandByPoint(Ia.max))}Fa.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)La.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(La));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)La.fromBufferAttribute(a,t),o&&(Pa.fromBufferAttribute(e,t),La.add(Pa)),r=Math.max(r,n.distanceToSquared(La))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&U(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){U(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new Ca(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new K,s[e]=new K;let c=new K,l=new K,u=new K,d=new G,f=new G,p=new G,m=new K,h=new K;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new K,y=new K,b=new K,x=new K;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new Ca(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new K,i=new K,a=new K,o=new K,s=new K,c=new K,l=new K,u=new K;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)La.fromBufferAttribute(e,t),La.normalize(),e.setXYZ(t,La.x,La.y,La.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new Ca(a,r,i)}if(this.index===null)return H(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},za=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=gr,this.updateRanges=[],this.version=0,this.uuid=Nr()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Nr()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Nr()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let t={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return t.usage=this.usage,t}},Ba=new K,Va=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Ba.fromBufferAttribute(this,t),Ba.applyMatrix4(e),this.setXYZ(t,Ba.x,Ba.y,Ba.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Ba.fromBufferAttribute(this,t),Ba.applyNormalMatrix(e),this.setXYZ(t,Ba.x,Ba.y,Ba.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Ba.fromBufferAttribute(this,t),Ba.transformDirection(e),this.setXYZ(t,Ba.x,Ba.y,Ba.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Ir(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Lr(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=Lr(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Lr(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Lr(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Lr(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Ir(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Ir(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Ir(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Ir(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Lr(t,this.array),n=Lr(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Lr(t,this.array),n=Lr(n,this.array),r=Lr(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=Lr(t,this.array),n=Lr(n,this.array),r=Lr(r,this.array),i=Lr(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){wr(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new Ca(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){wr(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Ha=new K,Ua=new K,Wa=new q,Ga=class{constructor(e=new K(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=Ha.subVectors(n,t).cross(Ua.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(Ha),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Wa.getNormalMatrix(e),r=this.coplanarPoint(Ha).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Ka=0,qa=class extends kr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ka++}),this.uuid=Nr(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new J(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=hr,this.stencilZFail=hr,this.stencilZPass=hr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){H(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?H(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new J().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new Ga().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new G().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new G().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},Ja=class extends qa{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new J(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Ya,Xa=new K,Za=new K,Qa=new K,$a=new G,eo=new G,to=new si,no=new K,ro=new K,io=new K,ao=new G,oo=new G,so=new G,co=class extends Pi{constructor(e=new Ja){if(super(),this.isSprite=!0,this.type=`Sprite`,Ya===void 0){Ya=new Ra;let e=new za(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);Ya.setIndex([0,1,2,0,2,3]),Ya.setAttribute(`position`,new Va(e,3,0,!1)),Ya.setAttribute(`uv`,new Va(e,2,3,!1))}this.geometry=Ya,this.material=e,this.center=new G(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&U(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),Za.setFromMatrixScale(this.matrixWorld),to.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Qa.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Za.multiplyScalar(-Qa.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;lo(no.set(-.5,-.5,0),Qa,a,Za,r,i),lo(ro.set(.5,-.5,0),Qa,a,Za,r,i),lo(io.set(.5,.5,0),Qa,a,Za,r,i),ao.set(0,0),oo.set(1,0),so.set(1,1);let o=e.ray.intersectTriangle(no,ro,io,!1,Xa);if(o===null&&(lo(ro.set(-.5,.5,0),Qa,a,Za,r,i),oo.set(0,1),o=e.ray.intersectTriangle(no,io,ro,!1,Xa),o===null))return;let s=e.ray.origin.distanceTo(Xa);s<e.near||s>e.far||t.push({distance:s,point:Xa.clone(),uv:ia.getInterpolation(Xa,no,ro,io,ao,oo,so,new G),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function lo(e,t,n,r,i,a){$a.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?eo.copy($a):(eo.x=a*$a.x-i*$a.y,eo.y=i*$a.x+a*$a.y),e.copy(t),e.x+=eo.x,e.y+=eo.y,e.applyMatrix4(to)}var uo=new K,fo=new K,po=new K,mo=new K,ho=class{constructor(e=new K,t=new K(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,uo)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=uo.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(uo.copy(this.origin).addScaledVector(this.direction,t),uo.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){fo.copy(e).add(t).multiplyScalar(.5),po.copy(t).sub(e).normalize(),mo.copy(this.origin).sub(fo);let i=e.distanceTo(t)*.5,a=-this.direction.dot(po),o=mo.dot(this.direction),s=-mo.dot(po),c=mo.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(fo).addScaledVector(po,d),f}intersectSphere(e,t){if(e.radius<0)return null;uo.subVectors(e.center,this.origin);let n=uo.dot(this.direction),r=uo.dot(uo)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,uo)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,ee,M;if(y>=b&&y>=x?(w=s,D=u,A=p,M=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,ee=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,ee=_)):b>=x?(w=c,D=d,A=m,M=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,ee=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,ee=v)):(w=l,D=f,A=h,M=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,ee=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,ee=g)),w===0)return null;let N=S/w,P=C/w,F=1/w,te=T-N*D,I=E-P*D,ne=O-N*A,re=k-P*A,L=j-N*M,ie=ee-P*M,ae=L*re-ie*ne,oe=te*ie-I*L,se=ne*I-re*te;if(r){if(ae<0||oe<0||se<0)return null}else if((ae<0||oe<0||se<0)&&(ae>0||oe>0||se>0))return null;let ce=ae+oe+se;if(ce===0)return null;let le=F*(ae*D+oe*A+se*M);return(ce>0?le<0:le>0)?null:this.at(le/ce,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},go=class extends qa{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new J(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new _i,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},_o=new si,vo=new ho,yo=new Aa,bo=new K,xo=new K,So=new K,Co=new K,wo=new K,To=new K,Eo=new K,Do=new K,Y=class extends Pi{constructor(e=new Ra,t=new go){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){To.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(wo.fromBufferAttribute(s,e),a?To.addScaledVector(wo,r):To.addScaledVector(wo.sub(t),r))}t.add(To)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),yo.copy(n.boundingSphere),yo.applyMatrix4(i),vo.copy(e.ray).recast(e.near),!(yo.containsPoint(vo.origin)===!1&&(vo.intersectSphere(yo,bo)===null||vo.origin.distanceToSquared(bo)>(e.far-e.near)**2))&&(_o.copy(i).invert(),vo.copy(e.ray).applyMatrix4(_o),(n.boundingBox===null||vo.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,vo)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=ko(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=ko(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=ko(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=ko(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function Oo(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;Do.copy(s),Do.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Do);return l<n.near||l>n.far?null:{distance:l,point:Do.clone(),object:e}}function ko(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,xo),e.getVertexPosition(c,So),e.getVertexPosition(l,Co);let u=Oo(e,t,n,r,xo,So,Co,Eo);if(u){let e=new K;ia.getBarycoord(Eo,xo,So,Co,e),i&&(u.uv=ia.getInterpolatedAttribute(i,s,c,l,e,new G)),a&&(u.uv1=ia.getInterpolatedAttribute(a,s,c,l,e,new G)),o&&(u.normal=ia.getInterpolatedAttribute(o,s,c,l,e,new K),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new K,materialIndex:0};ia.getNormal(xo,So,Co,t.normal),u.face=t,u.barycoord=e}return u}var Ao=class extends ti{constructor(e=null,t=1,n=1,r,i,a,o,s,c=Gt,l=Gt,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},jo=class extends Ca{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Mo=new si,No=new si,Po=[],Fo=new aa,Io=new si,Lo=new Y,Ro=new Aa,zo=class extends Y{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new jo(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Io)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new aa),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Mo),Fo.copy(e.boundingBox).applyMatrix4(Mo),this.boundingBox.union(Fo)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Aa),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Mo),Ro.copy(e.boundingSphere).applyMatrix4(Mo),this.boundingSphere.union(Ro)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(Lo.geometry=this.geometry,Lo.material=this.material,Lo.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ro.copy(this.boundingSphere),Ro.applyMatrix4(n),e.ray.intersectsSphere(Ro)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,Mo),No.multiplyMatrices(n,Mo),Lo.matrixWorld=No,Lo.raycast(e,Po);for(let e=0,n=Po.length;e<n;e++){let n=Po[e];n.instanceId=i,n.object=this,t.push(n)}Po.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new jo(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Ao(new Float32Array(r*this.count),r,this.count,gn,rn));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Bo=new Aa,Vo=new G(.5,.5),Ho=new K,Uo=class{constructor(e=new Ga,t=new Ga,n=new Ga,r=new Ga,i=new Ga,a=new Ga){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=vr,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Bo.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Bo.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Bo)}intersectsSprite(e){return Bo.center.set(0,0,0),Bo.radius=.7071067811865476+Vo.distanceTo(e.center),Bo.applyMatrix4(e.matrixWorld),this.intersectsSphere(Bo)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Ho.x=r.normal.x>0?e.max.x:e.min.x,Ho.y=r.normal.y>0?e.max.y:e.min.y,Ho.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ho)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Wo=class extends qa{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new J(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Go=new K,Ko=new K,qo=new si,Jo=new ho,Yo=new Aa,Xo=new K,Zo=new K,Qo=class extends Pi{constructor(e=new Ra,t=new Wo){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)Go.fromBufferAttribute(t,e-1),Ko.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=Go.distanceTo(Ko);e.setAttribute(`lineDistance`,new Ea(n,1))}else H(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Yo.copy(n.boundingSphere),Yo.applyMatrix4(r),Yo.radius+=i,e.ray.intersectsSphere(Yo)===!1)return;qo.copy(r).invert(),Jo.copy(e.ray).applyMatrix4(qo);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=$o(this,e,Jo,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=$o(this,e,Jo,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=$o(this,e,Jo,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=$o(this,e,Jo,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function $o(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(Go.fromBufferAttribute(s,i),Ko.fromBufferAttribute(s,a),n.distanceSqToSegment(Go,Ko,Xo,Zo)>r)return;Xo.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(Xo);if(!(c<t.near||c>t.far))return{distance:c,point:Zo.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var es=new K,ts=new K,ns=class extends Qo{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type=`LineSegments`}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let e=0,r=t.count;e<r;e+=2)es.fromBufferAttribute(t,e),ts.fromBufferAttribute(t,e+1),n[e]=e===0?0:n[e-1],n[e+1]=n[e]+es.distanceTo(ts);e.setAttribute(`lineDistance`,new Ea(n,1))}else H(`LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}},rs=class extends ti{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},is=class extends ti{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},as=class extends ti{constructor(e,t,n=nn,r,i,a,o=Gt,s=Gt,c,l=mn,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Zr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},os=class extends as{constructor(e,t=nn,n=301,r,i,a=Gt,o=Gt,s,c=mn){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ss=class extends ti{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},cs=class e extends Ra{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new Ea(c,3)),this.setAttribute(`normal`,new Ea(l,3)),this.setAttribute(`uv`,new Ea(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new K;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},ls=class e extends Ra{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type=`CircleGeometry`,this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);let i=[],a=[],o=[],s=[],c=new K,l=new G;a.push(0,0,0),o.push(0,0,1),s.push(.5,.5);for(let i=0,u=3;i<=t;i++,u+=3){let d=n+i/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),l.x=(a[u]/e+1)/2,l.y=(a[u+1]/e+1)/2,s.push(l.x,l.y)}for(let e=1;e<=t;e++)i.push(e,e+1,0);this.setIndex(i),this.setAttribute(`position`,new Ea(a,3)),this.setAttribute(`normal`,new Ea(o,3)),this.setAttribute(`uv`,new Ea(s,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.segments,t.thetaStart,t.thetaLength)}},us=class e extends Ra{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new Ea(u,3)),this.setAttribute(`normal`,new Ea(d,3)),this.setAttribute(`uv`,new Ea(f,2));function _(){let a=new K,_=new K,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new G,m=new K,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},ds=class e extends us{constructor(e=1,t=1,n=32,r=1,i=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,i,a,o),this.type=`ConeGeometry`,this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:i,thetaStart:a,thetaLength:o}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},fs=class e extends Ra{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new Ea(i,3)),this.setAttribute(`normal`,new Ea(i.slice(),3)),this.setAttribute(`uv`,new Ea(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new K,r=new K,i=new K;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new K;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new K;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new K,t=new K,n=new K,r=new K,o=new G,s=new G,c=new G;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}},ps=new K,ms=new K,hs=new K,gs=new ia,_s=class extends Ra{constructor(e=null,t=1){if(super(),this.type=`EdgesGeometry`,this.parameters={geometry:e,thresholdAngle:t},e!==null){let n=1e4,r=Math.cos(jr*t),i=e.getIndex(),a=e.getAttribute(`position`),o=i?i.count:a.count,s=[0,0,0],c=[`a`,`b`,`c`],l=[,,,],u={},d=[];for(let e=0;e<o;e+=3){i?(s[0]=i.getX(e),s[1]=i.getX(e+1),s[2]=i.getX(e+2)):(s[0]=e,s[1]=e+1,s[2]=e+2);let{a:t,b:o,c:f}=gs;if(t.fromBufferAttribute(a,s[0]),o.fromBufferAttribute(a,s[1]),f.fromBufferAttribute(a,s[2]),gs.getNormal(hs),l[0]=`${Math.round(t.x*n)},${Math.round(t.y*n)},${Math.round(t.z*n)}`,l[1]=`${Math.round(o.x*n)},${Math.round(o.y*n)},${Math.round(o.z*n)}`,l[2]=`${Math.round(f.x*n)},${Math.round(f.y*n)},${Math.round(f.z*n)}`,l[0]!==l[1]&&l[1]!==l[2]&&l[2]!==l[0])for(let e=0;e<3;e++){let t=(e+1)%3,n=l[e],i=l[t],a=gs[c[e]],o=gs[c[t]],f=`${n}_${i}`,p=`${i}_${n}`;p in u&&u[p]?(hs.dot(u[p].normal)<=r&&(d.push(a.x,a.y,a.z),d.push(o.x,o.y,o.z)),u[p]=null):f in u||(u[f]={index0:s[e],index1:s[t],normal:hs.clone()})}}for(let e in u)if(u[e]){let{index0:t,index1:n}=u[e];ps.fromBufferAttribute(a,t),ms.fromBufferAttribute(a,n),d.push(ps.x,ps.y,ps.z),d.push(ms.x,ms.y,ms.z)}this.setAttribute(`position`,new Ea(d,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}},vs=class{constructor(){this.type=`Curve`,this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){H(`Curve: .getPoint() not implemented.`)}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,r=this.getPoint(0),i=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),i+=n.distanceTo(r),t.push(i),r=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),r=0,i=n.length,a;a=t||e*n[i-1];let o=0,s=i-1,c;for(;o<=s;)if(r=Math.floor(o+(s-o)/2),c=n[r]-a,c<0)o=r+1;else if(c>0)s=r-1;else{s=r;break}if(r=s,n[r]===a)return r/(i-1);let l=n[r],u=n[r+1]-l,d=(a-l)/u;return(r+d)/(i-1)}getTangent(e,t){let n=1e-4,r=e-n,i=e+n;r<0&&(r=0),i>1&&(i=1);let a=this.getPoint(r),o=this.getPoint(i),s=t||(a.isVector2?new G:new K);return s.copy(o).sub(a).normalize(),s}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new K,r=[],i=[],a=[],o=new K,s=new si;for(let t=0;t<=e;t++){let n=t/e;r[t]=this.getTangentAt(n,new K)}i[0]=new K,a[0]=new K;let c=Number.MAX_VALUE,l=Math.abs(r[0].x),u=Math.abs(r[0].y),d=Math.abs(r[0].z);l<=c&&(c=l,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(r[0],n).normalize(),i[0].crossVectors(r[0],o),a[0].crossVectors(r[0],i[0]);for(let t=1;t<=e;t++){if(i[t]=i[t-1].clone(),a[t]=a[t-1].clone(),o.crossVectors(r[t-1],r[t]),o.length()>2**-52){o.normalize();let e=Math.acos(W(r[t-1].dot(r[t]),-1,1));i[t].applyMatrix4(s.makeRotationAxis(o,e))}a[t].crossVectors(r[t],i[t])}if(t===!0){let t=Math.acos(W(i[0].dot(i[e]),-1,1));t/=e,r[0].dot(o.crossVectors(i[0],i[e]))>0&&(t=-t);for(let n=1;n<=e;n++)i[n].applyMatrix4(s.makeRotationAxis(r[n],t*n)),a[n].crossVectors(r[n],i[n])}return{tangents:r,normals:i,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:`Curve`,generator:`Curve.toJSON`}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},ys=class extends vs{constructor(e=0,t=0,n=1,r=1,i=0,a=Math.PI*2,o=!1,s=0){super(),this.isEllipseCurve=!0,this.type=`EllipseCurve`,this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=r,this.aStartAngle=i,this.aEndAngle=a,this.aClockwise=o,this.aRotation=s}getPoint(e,t=new G){let n=t,r=Math.PI*2,i=this.aEndAngle-this.aStartAngle,a=Math.abs(i)<2**-52;for(;i<0;)i+=r;for(;i>r;)i-=r;i<2**-52&&(i=a?0:r),this.aClockwise===!0&&!a&&(i===r?i=-r:i-=r);let o=this.aStartAngle+e*i,s=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let e=Math.cos(this.aRotation),t=Math.sin(this.aRotation),n=s-this.aX,r=c-this.aY;s=n*e-r*t+this.aX,c=n*t+r*e+this.aY}return n.set(s,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},bs=class extends ys{constructor(e,t,n,r,i,a){super(e,t,n,n,r,i,a),this.isArcCurve=!0,this.type=`ArcCurve`}};function xs(){let e=0,t=0,n=0,r=0;function i(i,a,o,s){e=i,t=o,n=-3*i+3*a-2*o-s,r=2*i-2*a+o+s}return{initCatmullRom:function(e,t,n,r,a){i(t,n,a*(n-e),a*(r-t))},initNonuniformCatmullRom:function(e,t,n,r,a,o,s){let c=(t-e)/a-(n-e)/(a+o)+(n-t)/o,l=(n-t)/o-(r-t)/(o+s)+(r-n)/s;c*=o,l*=o,i(t,n,c,l)},calc:function(i){let a=i*i,o=a*i;return e+t*i+n*a+r*o}}}var Ss=new K,Cs=new K,ws=new xs,Ts=new xs,Es=new xs,Ds=class extends vs{constructor(e=[],t=!1,n=`centripetal`,r=.5){super(),this.isCatmullRomCurve3=!0,this.type=`CatmullRomCurve3`,this.points=e,this.closed=t,this.curveType=n,this.tension=r}getPoint(e,t=new K){let n=t,r=this.points,i=r.length,a=(i-+!this.closed)*e,o=Math.floor(a),s=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/i)+1)*i:s===0&&o===i-1&&(o=i-2,s=1);let c,l;this.closed||o>0?c=r[(o-1)%i]:(Cs.subVectors(r[0],r[1]).add(r[0]),c=Cs);let u=r[o%i],d=r[(o+1)%i];if(this.closed||o+2<i?l=r[(o+2)%i]:(Ss.subVectors(r[i-1],r[i-2]).add(r[i-1]),l=Ss),this.curveType===`centripetal`||this.curveType===`chordal`){let e=this.curveType===`chordal`?.5:.25,t=c.distanceToSquared(u)**+e,n=u.distanceToSquared(d)**+e,r=d.distanceToSquared(l)**+e;n<1e-4&&(n=1),t<1e-4&&(t=n),r<1e-4&&(r=n),ws.initNonuniformCatmullRom(c.x,u.x,d.x,l.x,t,n,r),Ts.initNonuniformCatmullRom(c.y,u.y,d.y,l.y,t,n,r),Es.initNonuniformCatmullRom(c.z,u.z,d.z,l.z,t,n,r)}else this.curveType===`catmullrom`&&(ws.initCatmullRom(c.x,u.x,d.x,l.x,this.tension),Ts.initCatmullRom(c.y,u.y,d.y,l.y,this.tension),Es.initCatmullRom(c.z,u.z,d.z,l.z,this.tension));return n.set(ws.calc(s),Ts.calc(s),Es.calc(s)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new K().fromArray(n))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Os(e,t,n,r,i){let a=(r-t)*.5,o=(i-n)*.5,s=e*e,c=e*s;return(2*n-2*r+a+o)*c+(-3*n+3*r-2*a-o)*s+a*e+n}function ks(e,t){let n=1-e;return n*n*t}function As(e,t){return 2*(1-e)*e*t}function js(e,t){return e*e*t}function Ms(e,t,n,r){return ks(e,t)+As(e,n)+js(e,r)}function Ns(e,t){let n=1-e;return n*n*n*t}function Ps(e,t){let n=1-e;return 3*n*n*e*t}function Fs(e,t){return 3*(1-e)*e*e*t}function Is(e,t){return e*e*e*t}function Ls(e,t,n,r,i){return Ns(e,t)+Ps(e,n)+Fs(e,r)+Is(e,i)}var Rs=class extends vs{constructor(e=new G,t=new G,n=new G,r=new G){super(),this.isCubicBezierCurve=!0,this.type=`CubicBezierCurve`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new G){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(Ls(e,r.x,i.x,a.x,o.x),Ls(e,r.y,i.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},zs=class extends vs{constructor(e=new K,t=new K,n=new K,r=new K){super(),this.isCubicBezierCurve3=!0,this.type=`CubicBezierCurve3`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new K){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(Ls(e,r.x,i.x,a.x,o.x),Ls(e,r.y,i.y,a.y,o.y),Ls(e,r.z,i.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Bs=class extends vs{constructor(e=new G,t=new G){super(),this.isLineCurve=!0,this.type=`LineCurve`,this.v1=e,this.v2=t}getPoint(e,t=new G){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new G){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Vs=class extends vs{constructor(e=new K,t=new K){super(),this.isLineCurve3=!0,this.type=`LineCurve3`,this.v1=e,this.v2=t}getPoint(e,t=new K){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new K){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Hs=class extends vs{constructor(e=new G,t=new G,n=new G){super(),this.isQuadraticBezierCurve=!0,this.type=`QuadraticBezierCurve`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new G){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(Ms(e,r.x,i.x,a.x),Ms(e,r.y,i.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Us=class extends vs{constructor(e=new K,t=new K,n=new K){super(),this.isQuadraticBezierCurve3=!0,this.type=`QuadraticBezierCurve3`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new K){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(Ms(e,r.x,i.x,a.x),Ms(e,r.y,i.y,a.y),Ms(e,r.z,i.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ws=class extends vs{constructor(e=[]){super(),this.isSplineCurve=!0,this.type=`SplineCurve`,this.points=e}getPoint(e,t=new G){let n=t,r=this.points,i=(r.length-1)*e,a=Math.floor(i),o=i-a,s=r[a===0?a:a-1],c=r[a],l=r[a>r.length-2?r.length-1:a+1],u=r[a>r.length-3?r.length-1:a+2];return n.set(Os(o,s.x,c.x,l.x,u.x),Os(o,s.y,c.y,l.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new G().fromArray(n))}return this}},Gs=Object.freeze({__proto__:null,ArcCurve:bs,CatmullRomCurve3:Ds,CubicBezierCurve:Rs,CubicBezierCurve3:zs,EllipseCurve:ys,LineCurve:Bs,LineCurve3:Vs,QuadraticBezierCurve:Hs,QuadraticBezierCurve3:Us,SplineCurve:Ws}),Ks=class extends vs{constructor(){super(),this.type=`CurvePath`,this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?`LineCurve`:`LineCurve3`;this.curves.push(new Gs[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),r=this.getCurveLengths(),i=0;for(;i<r.length;){if(r[i]>=n){let e=r[i]-n,a=this.curves[i],o=a.getLength(),s=o===0?0:1-e/o;return a.getPointAt(s,t)}i++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,r=this.curves.length;n<r;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let r=0,i=this.curves;r<i.length;r++){let a=i[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,s=a.getPoints(o);for(let e=0;e<s.length;e++){let r=s[e];n&&n.equals(r)||(t.push(r),n=r)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let n=e.curves[t];this.curves.push(n.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let n=this.curves[t];e.curves.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let n=e.curves[t];this.curves.push(new Gs[n.type]().fromJSON(n))}return this}},qs=class extends Ks{constructor(e){super(),this.type=`Path`,this.currentPoint=new G,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new Bs(this.currentPoint.clone(),new G(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,r){let i=new Hs(this.currentPoint.clone(),new G(e,t),new G(n,r));return this.curves.push(i),this.currentPoint.set(n,r),this}bezierCurveTo(e,t,n,r,i,a){let o=new Rs(this.currentPoint.clone(),new G(e,t),new G(n,r),new G(i,a));return this.curves.push(o),this.currentPoint.set(i,a),this}splineThru(e){let t=new Ws([this.currentPoint.clone()].concat(e));return this.curves.push(t),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,r,i,a){let o=this.currentPoint.x,s=this.currentPoint.y;return this.absarc(e+o,t+s,n,r,i,a),this}absarc(e,t,n,r,i,a){return this.absellipse(e,t,n,n,r,i,a),this}ellipse(e,t,n,r,i,a,o,s){let c=this.currentPoint.x,l=this.currentPoint.y;return this.absellipse(e+c,t+l,n,r,i,a,o,s),this}absellipse(e,t,n,r,i,a,o,s){let c=new ys(e,t,n,r,i,a,o,s);if(this.curves.length>0){let e=c.getPoint(0);e.equals(this.currentPoint)||this.lineTo(e.x,e.y)}this.curves.push(c);let l=c.getPoint(1);return this.currentPoint.copy(l),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},Js=class extends qs{constructor(e){super(e),this.uuid=Nr(),this.type=`Shape`,this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,r=this.holes.length;n<r;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let n=e.holes[t];this.holes.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let n=this.holes[t];e.holes.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let n=e.holes[t];this.holes.push(new qs().fromJSON(n))}return this}};function Ys(e,t,n=2){let r=t&&t.length,i=r?t[0]*n:e.length,a=Xs(e,0,i,n,!0),o=[];if(!a||a.next===a.prev)return o;let s,c,l;if(r&&(a=rc(e,t,a,n)),e.length>80*n){s=e[0],c=e[1];let t=s,r=c;for(let a=n;a<i;a+=n){let n=e[a],i=e[a+1];n<s&&(s=n),i<c&&(c=i),n>t&&(t=n),i>r&&(r=i)}l=Math.max(t-s,r-c),l=l===0?0:32767/l}return Qs(a,o,n,s,c,l,0),o}function Xs(e,t,n,r,i){let a;if(i===Dc(e,t,n,r)>0)for(let i=t;i<n;i+=r)a=wc(i/r|0,e[i],e[i+1],a);else for(let i=n-r;i>=t;i-=r)a=wc(i/r|0,e[i],e[i+1],a);return a&&gc(a,a.next)&&(Tc(a),a=a.next),a}function Zs(e,t){if(!e)return e;t||=e;let n=e,r;do if(r=!1,!n.steiner&&(gc(n,n.next)||hc(n.prev,n,n.next)===0)){if(Tc(n),n=t=n.prev,n===n.next)break;r=!0}else n=n.next;while(r||n!==t);return t}function Qs(e,t,n,r,i,a,o){if(!e)return;!o&&a&&cc(e,r,i,a);let s=e;for(;e.prev!==e.next;){let c=e.prev,l=e.next;if(a?ec(e,r,i,a):$s(e))t.push(c.i,e.i,l.i),Tc(e),e=l.next,s=l.next;else if(e=l,e===s){o?o===1?(e=tc(Zs(e),t),Qs(e,t,n,r,i,a,2)):o===2&&nc(e,t,n,r,i,a):Qs(Zs(e),t,n,r,i,a,1);break}}}function $s(e){let t=e.prev,n=e,r=e.next;if(hc(t,n,r)>=0)return!1;let i=t.x,a=n.x,o=r.x,s=t.y,c=n.y,l=r.y,u=Math.min(i,a,o),d=Math.min(s,c,l),f=Math.max(i,a,o),p=Math.max(s,c,l),m=r.next;for(;m!==t;){if(m.x>=u&&m.x<=f&&m.y>=d&&m.y<=p&&pc(i,s,a,c,o,l,m.x,m.y)&&hc(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function ec(e,t,n,r){let i=e.prev,a=e,o=e.next;if(hc(i,a,o)>=0)return!1;let s=i.x,c=a.x,l=o.x,u=i.y,d=a.y,f=o.y,p=Math.min(s,c,l),m=Math.min(u,d,f),h=Math.max(s,c,l),g=Math.max(u,d,f),_=uc(p,m,t,n,r),v=uc(h,g,t,n,r),y=e.prevZ,b=e.nextZ;for(;y&&y.z>=_&&b&&b.z<=v;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&pc(s,u,c,d,l,f,y.x,y.y)&&hc(y.prev,y,y.next)>=0||(y=y.prevZ,b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&pc(s,u,c,d,l,f,b.x,b.y)&&hc(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;y&&y.z>=_;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&pc(s,u,c,d,l,f,y.x,y.y)&&hc(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;b&&b.z<=v;){if(b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&pc(s,u,c,d,l,f,b.x,b.y)&&hc(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function tc(e,t){let n=e;do{let r=n.prev,i=n.next.next;!gc(r,i)&&_c(r,n,n.next,i)&&xc(r,i)&&xc(i,r)&&(t.push(r.i,n.i,i.i),Tc(n),Tc(n.next),n=e=i),n=n.next}while(n!==e);return Zs(n)}function nc(e,t,n,r,i,a){let o=e;do{let e=o.next.next;for(;e!==o.prev;){if(o.i!==e.i&&mc(o,e)){let s=Cc(o,e);o=Zs(o,o.next),s=Zs(s,s.next),Qs(o,t,n,r,i,a,0),Qs(s,t,n,r,i,a,0);return}e=e.next}o=o.next}while(o!==e)}function rc(e,t,n,r){let i=[];for(let n=0,a=t.length;n<a;n++){let o=Xs(e,t[n]*r,n<a-1?t[n+1]*r:e.length,r,!1);o===o.next&&(o.steiner=!0),i.push(dc(o))}i.sort(ic);for(let e=0;e<i.length;e++)n=ac(i[e],n);return n}function ic(e,t){let n=e.x-t.x;return n===0&&(n=e.y-t.y,n===0&&(n=(e.next.y-e.y)/(e.next.x-e.x)-(t.next.y-t.y)/(t.next.x-t.x))),n}function ac(e,t){let n=oc(e,t);if(!n)return t;let r=Cc(n,e);return Zs(r,r.next),Zs(n,n.next)}function oc(e,t){let n=t,r=e.x,i=e.y,a=-1/0,o;if(gc(e,n))return n;do{if(gc(e,n.next))return n.next;if(i<=n.y&&i>=n.next.y&&n.next.y!==n.y){let e=n.x+(i-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(e<=r&&e>a&&(a=e,o=n.x<n.next.x?n:n.next,e===r))return o}n=n.next}while(n!==t);if(!o)return null;let s=o,c=o.x,l=o.y,u=1/0;n=o;do{if(r>=n.x&&n.x>=c&&r!==n.x&&fc(i<l?r:a,i,c,l,i<l?a:r,i,n.x,n.y)){let t=Math.abs(i-n.y)/(r-n.x);xc(n,e)&&(t<u||t===u&&(n.x>o.x||n.x===o.x&&sc(o,n)))&&(o=n,u=t)}n=n.next}while(n!==s);return o}function sc(e,t){return hc(e.prev,e,t.prev)<0&&hc(t.next,e,e.next)<0}function cc(e,t,n,r){let i=e;do i.z===0&&(i.z=uc(i.x,i.y,t,n,r)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==e);i.prevZ.nextZ=null,i.prevZ=null,lc(i)}function lc(e){let t,n=1;do{let r=e,i;e=null;let a=null;for(t=0;r;){t++;let o=r,s=0;for(let e=0;e<n&&(s++,o=o.nextZ,o);e++);let c=n;for(;s>0||c>0&&o;)s!==0&&(c===0||!o||r.z<=o.z)?(i=r,r=r.nextZ,s--):(i=o,o=o.nextZ,c--),a?a.nextZ=i:e=i,i.prevZ=a,a=i;r=o}a.nextZ=null,n*=2}while(t>1);return e}function uc(e,t,n,r,i){return e=(e-n)*i|0,t=(t-r)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function dc(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function fc(e,t,n,r,i,a,o,s){return(i-o)*(t-s)>=(e-o)*(a-s)&&(e-o)*(r-s)>=(n-o)*(t-s)&&(n-o)*(a-s)>=(i-o)*(r-s)}function pc(e,t,n,r,i,a,o,s){return(e!==o||t!==s)&&fc(e,t,n,r,i,a,o,s)}function mc(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!bc(e,t)&&(xc(e,t)&&xc(t,e)&&Sc(e,t)&&(hc(e.prev,e,t.prev)||hc(e,t.prev,t))||gc(e,t)&&hc(e.prev,e,e.next)>0&&hc(t.prev,t,t.next)>0)}function hc(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function gc(e,t){return e.x===t.x&&e.y===t.y}function _c(e,t,n,r){let i=yc(hc(e,t,n)),a=yc(hc(e,t,r)),o=yc(hc(n,r,e)),s=yc(hc(n,r,t));return!!(i!==a&&o!==s||i===0&&vc(e,n,t)||a===0&&vc(e,r,t)||o===0&&vc(n,e,r)||s===0&&vc(n,t,r))}function vc(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function yc(e){return e>0?1:e<0?-1:0}function bc(e,t){let n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&_c(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function xc(e,t){return hc(e.prev,e,e.next)<0?hc(e,t,e.next)>=0&&hc(e,e.prev,t)>=0:hc(e,t,e.prev)<0||hc(e,e.next,t)<0}function Sc(e,t){let n=e,r=!1,i=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&i<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next;while(n!==e);return r}function Cc(e,t){let n=Ec(e.i,e.x,e.y),r=Ec(t.i,t.x,t.y),i=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=i,i.prev=n,r.next=n,n.prev=r,a.next=r,r.prev=a,r}function wc(e,t,n,r){let i=Ec(e,t,n);return r?(i.next=r.next,i.prev=r,r.next.prev=i,r.next=i):(i.prev=i,i.next=i),i}function Tc(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function Ec(e,t,n){return{i:e,x:t,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Dc(e,t,n,r){let i=0;for(let a=t,o=n-r;a<n;a+=r)i+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return i}var Oc=class{static triangulate(e,t,n=2){return Ys(e,t,n)}},kc=class e{static area(e){let t=e.length,n=0;for(let r=t-1,i=0;i<t;r=i++)n+=e[r].x*e[i].y-e[i].x*e[r].y;return n*.5}static isClockWise(t){return e.area(t)<0}static triangulateShape(e,t){let n=[],r=[],i=[];Ac(e),jc(n,e);let a=e.length;t.forEach(Ac);for(let e=0;e<t.length;e++)r.push(a),a+=t[e].length,jc(n,t[e]);let o=Oc.triangulate(n,r);for(let e=0;e<o.length;e+=3)i.push(o.slice(e,e+3));return i}};function Ac(e){let t=e.length;t>2&&e[t-1].equals(e[0])&&e.pop()}function jc(e,t){for(let n=0;n<t.length;n++)e.push(t[n].x),e.push(t[n].y)}var Mc=class e extends Ra{constructor(e=new Js([new G(.5,.5),new G(-.5,.5),new G(-.5,-.5),new G(.5,-.5)]),t={}){super(),this.type=`ExtrudeGeometry`,this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,r=[],i=[];for(let t=0,n=e.length;t<n;t++){let n=e[t];a(n)}this.setAttribute(`position`,new Ea(r,3)),this.setAttribute(`uv`,new Ea(i,2)),this.computeVertexNormals();function a(e){let a=[],o=t.curveSegments===void 0?12:t.curveSegments,s=t.steps===void 0?1:t.steps,c=t.depth===void 0?1:t.depth,l=t.bevelEnabled===void 0||t.bevelEnabled,u=t.bevelThickness===void 0?.2:t.bevelThickness,d=t.bevelSize===void 0?u-.1:t.bevelSize,f=t.bevelOffset===void 0?0:t.bevelOffset,p=t.bevelSegments===void 0?3:t.bevelSegments,m=t.extrudePath,h=t.UVGenerator===void 0?Nc:t.UVGenerator,g,_=!1,v,y,b,x;if(m){g=m.getSpacedPoints(s),_=!0,l=!1;let e=m.isCatmullRomCurve3?m.closed:!1;v=m.computeFrenetFrames(s,e),y=new K,b=new K,x=new K}l||(p=0,u=0,d=0,f=0);let S=e.extractPoints(o),C=S.shape,w=S.holes;if(!kc.isClockWise(C)){C=C.reverse();for(let e=0,t=w.length;e<t;e++){let t=w[e];kc.isClockWise(t)&&(w[e]=t.reverse())}}function T(e){let t=e[0];for(let n=1;n<=e.length;n++){let r=n%e.length,i=e[r],a=i.x-t.x,o=i.y-t.y,s=a*a+o*o,c=Math.max(Math.abs(i.x),Math.abs(i.y),Math.abs(t.x),Math.abs(t.y));s<=10000000000000001e-36*c*c?(e.splice(r,1),n--):t=i}}T(C),w.forEach(T);let E=w.length,D=C;for(let e=0;e<E;e++){let t=w[e];C=C.concat(t)}function O(e,t,n){return t||U(`ExtrudeGeometry: vec does not exist`),e.clone().addScaledVector(t,n)}let k=C.length;function A(e,t,n){let r,i,a,o=e.x-t.x,s=e.y-t.y,c=n.x-e.x,l=n.y-e.y,u=o*o+s*s,d=o*l-s*c;if(Math.abs(d)>2**-52){let d=Math.sqrt(u),f=Math.sqrt(c*c+l*l),p=t.x-s/d,m=t.y+o/d,h=n.x-l/f,g=n.y+c/f,_=((h-p)*l-(g-m)*c)/(o*l-s*c);r=p+o*_-e.x,i=m+s*_-e.y;let v=r*r+i*i;if(v<=2)return new G(r,i);a=Math.sqrt(v/2)}else{let e=!1;o>2**-52?c>2**-52&&(e=!0):o<-(2**-52)?c<-(2**-52)&&(e=!0):Math.sign(s)===Math.sign(l)&&(e=!0),e?(r=-s,i=o,a=Math.sqrt(u)):(r=o,i=s,a=Math.sqrt(u/2))}return new G(r/a,i/a)}let j=[];for(let e=0,t=D.length,n=t-1,r=e+1;e<t;e++,n++,r++)n===t&&(n=0),r===t&&(r=0),j[e]=A(D[e],D[n],D[r]);let ee=[],M,N=j.concat();for(let e=0,t=E;e<t;e++){let t=w[e];M=[];for(let e=0,n=t.length,r=n-1,i=e+1;e<n;e++,r++,i++)r===n&&(r=0),i===n&&(i=0),M[e]=A(t[e],t[r],t[i]);ee.push(M),N=N.concat(M)}let P;if(p===0)P=kc.triangulateShape(D,w);else{let e=[],t=[];for(let n=0;n<p;n++){let r=n/p,i=u*Math.cos(r*Math.PI/2),a=d*Math.sin(r*Math.PI/2)+f;for(let t=0,n=D.length;t<n;t++){let n=O(D[t],j[t],a);L(n.x,n.y,-i),r===0&&e.push(n)}for(let e=0,n=E;e<n;e++){let n=w[e];M=ee[e];let o=[];for(let e=0,t=n.length;e<t;e++){let t=O(n[e],M[e],a);L(t.x,t.y,-i),r===0&&o.push(t)}r===0&&t.push(o)}}P=kc.triangulateShape(e,t)}let F=P.length,te=d+f;for(let e=0;e<k;e++){let t=l?O(C[e],N[e],te):C[e];_?(b.copy(v.normals[0]).multiplyScalar(t.x),y.copy(v.binormals[0]).multiplyScalar(t.y),x.copy(g[0]).add(b).add(y),L(x.x,x.y,x.z)):L(t.x,t.y,0)}for(let e=1;e<=s;e++)for(let t=0;t<k;t++){let n=l?O(C[t],N[t],te):C[t];_?(b.copy(v.normals[e]).multiplyScalar(n.x),y.copy(v.binormals[e]).multiplyScalar(n.y),x.copy(g[e]).add(b).add(y),L(x.x,x.y,x.z)):L(n.x,n.y,c/s*e)}for(let e=p-1;e>=0;e--){let t=e/p,n=u*Math.cos(t*Math.PI/2),r=d*Math.sin(t*Math.PI/2)+f;for(let e=0,t=D.length;e<t;e++){let t=O(D[e],j[e],r);L(t.x,t.y,c+n)}for(let e=0,t=w.length;e<t;e++){let t=w[e];M=ee[e];for(let e=0,i=t.length;e<i;e++){let i=O(t[e],M[e],r);_?L(i.x,i.y+g[s-1].y,g[s-1].x+n):L(i.x,i.y,c+n)}}}I(),ne();function I(){let e=r.length/3;if(l){let e=0,t=k*e;for(let e=0;e<F;e++){let n=P[e];ie(n[2]+t,n[1]+t,n[0]+t)}e=s+p*2,t=k*e;for(let e=0;e<F;e++){let n=P[e];ie(n[0]+t,n[1]+t,n[2]+t)}}else{for(let e=0;e<F;e++){let t=P[e];ie(t[2],t[1],t[0])}for(let e=0;e<F;e++){let t=P[e];ie(t[0]+k*s,t[1]+k*s,t[2]+k*s)}}n.addGroup(e,r.length/3-e,0)}function ne(){let e=r.length/3,t=0;re(D,t),t+=D.length;for(let e=0,n=w.length;e<n;e++){let n=w[e];re(n,t),t+=n.length}n.addGroup(e,r.length/3-e,1)}function re(e,t){let n=e.length;for(;--n>=0;){let r=n,i=n-1;i<0&&(i=e.length-1);for(let e=0,n=s+p*2;e<n;e++){let n=k*e,a=k*(e+1);ae(t+r+n,t+i+n,t+i+a,t+r+a)}}}function L(e,t,n){a.push(e),a.push(t),a.push(n)}function ie(e,t,i){oe(e),oe(t),oe(i);let a=r.length/3,o=h.generateTopUV(n,r,a-3,a-2,a-1);se(o[0]),se(o[1]),se(o[2])}function ae(e,t,i,a){oe(e),oe(t),oe(a),oe(t),oe(i),oe(a);let o=r.length/3,s=h.generateSideWallUV(n,r,o-6,o-3,o-2,o-1);se(s[0]),se(s[1]),se(s[3]),se(s[1]),se(s[2]),se(s[3])}function oe(e){r.push(a[e*3+0]),r.push(a[e*3+1]),r.push(a[e*3+2])}function se(e){i.push(e.x),i.push(e.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return Pc(t,n,e)}static fromJSON(t,n){let r=[];for(let e=0,i=t.shapes.length;e<i;e++){let i=n[t.shapes[e]];r.push(i)}let i=t.options.extrudePath;return i!==void 0&&(t.options.extrudePath=new Gs[i.type]().fromJSON(i)),new e(r,t.options)}},Nc={generateTopUV:function(e,t,n,r,i){let a=t[n*3],o=t[n*3+1],s=t[r*3],c=t[r*3+1],l=t[i*3],u=t[i*3+1];return[new G(a,o),new G(s,c),new G(l,u)]},generateSideWallUV:function(e,t,n,r,i,a){let o=t[n*3],s=t[n*3+1],c=t[n*3+2],l=t[r*3],u=t[r*3+1],d=t[r*3+2],f=t[i*3],p=t[i*3+1],m=t[i*3+2],h=t[a*3],g=t[a*3+1],_=t[a*3+2];return Math.abs(s-u)<Math.abs(o-l)?[new G(o,1-c),new G(l,1-d),new G(f,1-m),new G(h,1-_)]:[new G(s,1-c),new G(u,1-d),new G(p,1-m),new G(g,1-_)]}};function Pc(e,t,n){if(n.shapes=[],Array.isArray(e))for(let t=0,r=e.length;t<r;t++){let r=e[t];n.shapes.push(r.uuid)}else n.shapes.push(e.uuid);return n.options=Object.assign({},t),t.extrudePath!==void 0&&(n.options.extrudePath=t.extrudePath.toJSON()),n}var Fc=class e extends fs{constructor(e=1,t=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],e,t),this.type=`OctahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},Ic=class e extends Ra{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new Ea(p,3)),this.setAttribute(`normal`,new Ea(m,3)),this.setAttribute(`uv`,new Ea(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},Lc=class e extends Ra{constructor(e=.5,t=1,n=32,r=1,i=0,a=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:i,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);let o=[],s=[],c=[],l=[],u=e,d=(t-e)/r,f=new K,p=new G;for(let e=0;e<=r;e++){for(let e=0;e<=n;e++){let r=i+e/n*a;f.x=u*Math.cos(r),f.y=u*Math.sin(r),s.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,l.push(p.x,p.y)}u+=d}for(let e=0;e<r;e++){let t=e*(n+1);for(let e=0;e<n;e++){let r=e+t,i=r,a=r+n+1,s=r+n+2,c=r+1;o.push(i,a,c),o.push(a,s,c)}}this.setIndex(o),this.setAttribute(`position`,new Ea(s,3)),this.setAttribute(`normal`,new Ea(c,3)),this.setAttribute(`uv`,new Ea(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},Rc=class e extends Ra{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2,a=0,o=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);let s=[],c=[],l=[],u=[],d=new K,f=new K,p=new K;for(let s=0;s<=n;s++){let m=a+s/n*o;for(let a=0;a<=r;a++){let o=a/r*i;f.x=(e+t*Math.cos(m))*Math.cos(o),f.y=(e+t*Math.cos(m))*Math.sin(o),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),d.x=e*Math.cos(o),d.y=e*Math.sin(o),p.subVectors(f,d).normalize(),l.push(p.x,p.y,p.z),u.push(a/r),u.push(s/n)}}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,a=(r+1)*(e-1)+t,o=(r+1)*e+t;s.push(n,i,o),s.push(i,a,o)}this.setIndex(s),this.setAttribute(`position`,new Ea(c,3)),this.setAttribute(`normal`,new Ea(l,3)),this.setAttribute(`uv`,new Ea(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function zc(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(Vc(i))i.isRenderTargetTexture?(H(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(Vc(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function Bc(e){let t={};for(let n=0;n<e.length;n++){let r=zc(e[n]);for(let e in r)t[e]=r[e]}return t}function Vc(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Hc(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Uc(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Gr.workingColorSpace}var Wc={clone:zc,merge:Bc},Gc=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Kc=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,qc=class extends qa{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Gc,this.fragmentShader=Kc,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=zc(e.uniforms),this.uniformsGroups=Hc(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new J().setHex(r.value);break;case`v2`:this.uniforms[n].value=new G().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new K().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new ni().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new q().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new si().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},Jc=class extends qc{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},Yc=class extends qa{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new J(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new J(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new G(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new _i,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Xc=class extends qa{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=ur,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Zc=class extends qa{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Qc(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function $c(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var el=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},tl=class extends el{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:sr,endingEnd:sr}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case cr:i=e,o=2*t-n;break;case lr:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case cr:a=e,s=2*n-t;break;case lr:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},nl=class extends el{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},rl=class extends el{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},il=class extends el{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=sl(n,t,g,y,r);i[p]=al(x,o,_,b,m)}return i}};function al(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function ol(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function sl(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=al(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=ol(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var cl=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Qc(t,this.TimeBufferType),this.values=Qc(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Qc(e.times,Array),values:Qc(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),$c(e.settings)&&(n.settings={inTangents:Qc(e.settings.inTangents,Array),outTangents:Qc(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new rl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new nl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new tl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new il(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case rr:t=this.InterpolantFactoryMethodDiscrete;break;case ir:t=this.InterpolantFactoryMethodLinear;break;case ar:t=this.InterpolantFactoryMethodSmooth;break;case or:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return H(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return rr;case this.InterpolantFactoryMethodLinear:return ir;case this.InterpolantFactoryMethodSmooth:return ar;case this.InterpolantFactoryMethodBezier:return or}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;$c(this.settings)&&(ll(this.settings.inTangents,e),ll(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(U(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(U(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){U(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){U(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&br(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){U(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===ar,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,$c(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function ll(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}cl.prototype.ValueTypeName=``,cl.prototype.TimeBufferType=Float32Array,cl.prototype.ValueBufferType=Float32Array,cl.prototype.DefaultInterpolation=ir;var ul=class extends cl{constructor(e,t,n){super(e,t,n)}};ul.prototype.ValueTypeName=`bool`,ul.prototype.ValueBufferType=Array,ul.prototype.DefaultInterpolation=rr,ul.prototype.InterpolantFactoryMethodLinear=void 0,ul.prototype.InterpolantFactoryMethodSmooth=void 0;var dl=class extends cl{constructor(e,t,n,r){super(e,t,n,r)}};dl.prototype.ValueTypeName=`color`;var fl=class extends cl{constructor(e,t,n,r){super(e,t,n,r)}};fl.prototype.ValueTypeName=`number`;var pl=class extends el{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)Rr.slerpFlat(i,0,a,c-o,a,c,s);return i}},ml=class extends cl{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new pl(this.times,this.values,this.getValueSize(),e)}};ml.prototype.ValueTypeName=`quaternion`,ml.prototype.InterpolantFactoryMethodSmooth=void 0;var hl=class extends cl{constructor(e,t,n){super(e,t,n)}};hl.prototype.ValueTypeName=`string`,hl.prototype.ValueBufferType=Array,hl.prototype.DefaultInterpolation=rr,hl.prototype.InterpolantFactoryMethodLinear=void 0,hl.prototype.InterpolantFactoryMethodSmooth=void 0;var gl=class extends cl{constructor(e,t,n,r){super(e,t,n,r)}};gl.prototype.ValueTypeName=`vector`;var _l=class extends Pi{constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new J(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},vl=class extends _l{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(Pi.DEFAULT_UP),this.updateMatrix(),this.groundColor=new J(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},yl=new si,bl=new K,xl=new K,Sl=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new G(512,512),this.mapType=Zt,this.map=null,this.mapPass=null,this.matrix=new si,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Uo,this._frameExtents=new G(1,1),this._viewportCount=1,this._viewports=[new ni(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;bl.setFromMatrixPosition(e.matrixWorld),t.position.copy(bl),xl.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(xl),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){yl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(yl,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(yl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Cl=new K,wl=new Rr,Tl=new K,El=class extends Pi{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new si,this.projectionMatrix=new si,this.projectionMatrixInverse=new si,this.coordinateSystem=vr,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Cl,wl,Tl),Tl.x===1&&Tl.y===1&&Tl.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Cl,wl,Tl.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Cl,wl,Tl),Tl.x===1&&Tl.y===1&&Tl.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Cl,wl,Tl.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Dl=new K,Ol=new G,kl=new G,Al=class extends El{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Mr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(jr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Mr*2*Math.atan(Math.tan(jr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Dl.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Dl.x,Dl.y).multiplyScalar(-e/Dl.z),Dl.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Dl.x,Dl.y).multiplyScalar(-e/Dl.z)}getViewSize(e,t){return this.getViewBounds(e,Ol,kl),t.subVectors(kl,Ol)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(jr*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},jl=class extends Sl{constructor(){super(new Al(90,1,.5,500)),this.isPointLightShadow=!0}},Ml=class extends _l{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type=`PointLight`,this.distance=n,this.decay=r,this.shadow=new jl}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},Nl=class extends El{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Pl=class extends Sl{constructor(){super(new Nl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Fl=class extends _l{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(Pi.DEFAULT_UP),this.updateMatrix(),this.target=new Pi,this.shadow=new Pl}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},Il=-90,Ll=1,Rl=class extends Pi{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Al(Il,Ll,e,t);r.layers=this.layers,this.add(r);let i=new Al(Il,Ll,e,t);i.layers=this.layers,this.add(i);let a=new Al(Il,Ll,e,t);a.layers=this.layers,this.add(a);let o=new Al(Il,Ll,e,t);o.layers=this.layers,this.add(o);let s=new Al(Il,Ll,e,t);s.layers=this.layers,this.add(s);let c=new Al(Il,Ll,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},zl=class extends Al{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}},Bl=`\\[\\]\\.:\\/`,Vl=RegExp(`[\\[\\]\\.:\\/]`,`g`),Hl=`[^\\[\\]\\.:\\/]`,Ul=`[^`+Bl.replace(`\\.`,``)+`]`,Wl=`((?:WC+[\\/:])*)`.replace(`WC`,Hl),Gl=`(WCOD+)?`.replace(`WCOD`,Ul),Kl=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,Hl),ql=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,Hl),Jl=RegExp(`^`+Wl+Gl+Kl+ql+`$`),Yl=[`material`,`materials`,`bones`,`map`],Xl=class{constructor(e,t,n){let r=n||Zl.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Zl=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(Vl,``)}static parseTrackName(e){let t=Jl.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);Yl.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){H(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){U(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){U(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){U(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){U(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){U(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){U(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){U(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;U(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){U(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){U(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Zl.Composite=Xl,Zl.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Zl.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},Zl.prototype.GetterByBindingType=[Zl.prototype._getValue_direct,Zl.prototype._getValue_array,Zl.prototype._getValue_arrayElement,Zl.prototype._getValue_toArray],Zl.prototype.SetterByBindingTypeAndVersioning=[[Zl.prototype._setValue_direct,Zl.prototype._setValue_direct_setNeedsUpdate,Zl.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Zl.prototype._setValue_array,Zl.prototype._setValue_array_setNeedsUpdate,Zl.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Zl.prototype._setValue_arrayElement,Zl.prototype._setValue_arrayElement_setNeedsUpdate,Zl.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Zl.prototype._setValue_fromArray,Zl.prototype._setValue_fromArray_setNeedsUpdate,Zl.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]],class e{static{e.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}};var Ql=class extends ns{constructor(e=10,t=10,n=4473924,r=8947848){n=new J(n),r=new J(r);let i=t/2,a=e/t,o=e/2,s=[],c=[];for(let e=0,l=0,u=-o;e<=t;e++,u+=a){s.push(-o,0,u,o,0,u),s.push(u,0,-o,u,0,o);let t=e===i?n:r;t.toArray(c,l),l+=3,t.toArray(c,l),l+=3,t.toArray(c,l),l+=3,t.toArray(c,l),l+=3}let l=new Ra;l.setAttribute(`position`,new Ea(s,3)),l.setAttribute(`color`,new Ea(c,3));let u=new Wo({vertexColors:!0,toneMapped:!1});super(l,u),this.type=`GridHelper`}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};function $l(e,t,n,r){let i=eu(r);switch(n){case dn:return e*t;case gn:return e*t/i.components*i.byteLength;case _n:return e*t/i.components*i.byteLength;case vn:return e*t*2/i.components*i.byteLength;case yn:return e*t*2/i.components*i.byteLength;case fn:return e*t*3/i.components*i.byteLength;case pn:return e*t*4/i.components*i.byteLength;case bn:return e*t*4/i.components*i.byteLength;case xn:case Sn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Cn:case wn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case En:case On:return Math.max(e,16)*Math.max(t,8)/4;case Tn:case Dn:return Math.max(e,8)*Math.max(t,8)/2;case kn:case An:case Mn:case Nn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case jn:case Pn:case Fn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case In:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Ln:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case Rn:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case zn:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case Bn:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case Vn:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case Hn:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Un:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case Wn:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Gn:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Kn:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case qn:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Jn:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Yn:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Xn:case Zn:case Qn:return Math.ceil(e/4)*Math.ceil(t/4)*16;case $n:case er:return Math.ceil(e/4)*Math.ceil(t/4)*8;case tr:case nr:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function eu(e){switch(e){case Zt:case Qt:return{byteLength:1,components:1};case en:case $t:case an:return{byteLength:2,components:1};case on:case sn:return{byteLength:2,components:4};case nn:case tn:case rn:return{byteLength:4,components:1};case ln:case un:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`186`}})),typeof window<`u`&&(window.__THREE__?H(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`186`);function tu(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function nu(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var X={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},Z={common:{diffuse:{value:new J(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new q},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new q}},envmap:{envMap:{value:null},envMapRotation:{value:new q},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new q}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new q}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new q},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new q},normalScale:{value:new G(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new q},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new q}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new q}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new q}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new J(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new K},probesMax:{value:new K},probesResolution:{value:new K}},points:{diffuse:{value:new J(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0},uvTransform:{value:new q}},sprite:{diffuse:{value:new J(16777215)},opacity:{value:1},center:{value:new G(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new q},alphaMap:{value:null},alphaMapTransform:{value:new q},alphaTest:{value:0}}},ru={basic:{uniforms:Bc([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.fog]),vertexShader:X.meshbasic_vert,fragmentShader:X.meshbasic_frag},lambert:{uniforms:Bc([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,Z.lights,{emissive:{value:new J(0)},envMapIntensity:{value:1}}]),vertexShader:X.meshlambert_vert,fragmentShader:X.meshlambert_frag},phong:{uniforms:Bc([Z.common,Z.specularmap,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,Z.lights,{emissive:{value:new J(0)},specular:{value:new J(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:X.meshphong_vert,fragmentShader:X.meshphong_frag},standard:{uniforms:Bc([Z.common,Z.envmap,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.roughnessmap,Z.metalnessmap,Z.fog,Z.lights,{emissive:{value:new J(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:X.meshphysical_vert,fragmentShader:X.meshphysical_frag},toon:{uniforms:Bc([Z.common,Z.aomap,Z.lightmap,Z.emissivemap,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.gradientmap,Z.fog,Z.lights,{emissive:{value:new J(0)}}]),vertexShader:X.meshtoon_vert,fragmentShader:X.meshtoon_frag},matcap:{uniforms:Bc([Z.common,Z.bumpmap,Z.normalmap,Z.displacementmap,Z.fog,{matcap:{value:null}}]),vertexShader:X.meshmatcap_vert,fragmentShader:X.meshmatcap_frag},points:{uniforms:Bc([Z.points,Z.fog]),vertexShader:X.points_vert,fragmentShader:X.points_frag},dashed:{uniforms:Bc([Z.common,Z.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:X.linedashed_vert,fragmentShader:X.linedashed_frag},depth:{uniforms:Bc([Z.common,Z.displacementmap]),vertexShader:X.depth_vert,fragmentShader:X.depth_frag},normal:{uniforms:Bc([Z.common,Z.bumpmap,Z.normalmap,Z.displacementmap,{opacity:{value:1}}]),vertexShader:X.meshnormal_vert,fragmentShader:X.meshnormal_frag},sprite:{uniforms:Bc([Z.sprite,Z.fog]),vertexShader:X.sprite_vert,fragmentShader:X.sprite_frag},background:{uniforms:{uvTransform:{value:new q},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:X.background_vert,fragmentShader:X.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new q}},vertexShader:X.backgroundCube_vert,fragmentShader:X.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:X.cube_vert,fragmentShader:X.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:X.equirect_vert,fragmentShader:X.equirect_frag},distance:{uniforms:Bc([Z.common,Z.displacementmap,{referencePosition:{value:new K},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:X.distance_vert,fragmentShader:X.distance_frag},shadow:{uniforms:Bc([Z.lights,Z.fog,{color:{value:new J(0)},opacity:{value:1}}]),vertexShader:X.shadow_vert,fragmentShader:X.shadow_frag}};ru.physical={uniforms:Bc([ru.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new q},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new q},clearcoatNormalScale:{value:new G(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new q},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new q},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new q},sheen:{value:0},sheenColor:{value:new J(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new q},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new q},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new q},transmissionSamplerSize:{value:new G},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new q},attenuationDistance:{value:0},attenuationColor:{value:new J(0)},specularColor:{value:new J(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new q},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new q},anisotropyVector:{value:new G},anisotropyMap:{value:null},anisotropyMapTransform:{value:new q}}]),vertexShader:X.meshphysical_vert,fragmentShader:X.meshphysical_frag};var iu={r:0,b:0,g:0},au=new si,ou=new q;ou.set(-1,0,0,0,1,0,0,0,1);function su(e,t,n,r,i,a){let o=new J(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&(i.isCubeTexture||i.mapping===306)?(l===void 0&&(l=new Y(new cs(1,1,1),new qc({name:`BackgroundCubeMaterial`,uniforms:zc(ru.backgroundCube.uniforms),vertexShader:ru.backgroundCube.vertexShader,fragmentShader:ru.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(au.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isCubeTexture&&i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(ou),l.material.toneMapped=Gr.getTransfer(i.colorSpace)!==mr,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new Y(new Ic(2,2),new qc({name:`BackgroundMaterial`,uniforms:zc(ru.background.uniforms),vertexShader:ru.background.vertexShader,fragmentShader:ru.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=Gr.getTransfer(i.colorSpace)!==mr,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(iu,Uc(e)),n.buffers.color.setClear(iu.r,iu.g,iu.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function cu(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function lu(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function uu(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(H(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`);n.reversedDepthBuffer===!0&&f===!1&&H(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function du(e){let t=this,n=null,r=0,i=!1,a=!1,o=new Ga,s=new q,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var fu=4,pu=6,mu=20,hu=256,gu=new Nl,_u=new J,vu=null,yu=0,bu=0,xu=!1,Su=new K,Cu=new K,wu=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Su}=i;vu=this._renderer.getRenderTarget(),yu=this._renderer.getActiveCubeFace(),bu=this._renderer.getActiveMipmapLevel(),xu=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s,o),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ju(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Au(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(vu,yu,bu),this._renderer.xr.enabled=xu,e.scissorTest=!1,Du(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),vu=this._renderer.getRenderTarget(),yu=this._renderer.getActiveCubeFace(),bu=this._renderer.getActiveMipmapLevel(),xu=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Jt,minFilter:Jt,generateMipmaps:!1,type:an,format:pn,colorSpace:fr,depthBuffer:!1},r=Eu(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Eu(e,t,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Tu(r)),this._blurMaterial=ku(r,e,t),this._ggxMaterial=Ou(r,e,t)}return r}_compileMaterial(e){let t=new Y(new Ra,e);this._renderer.compile(t,gu)}_sceneToCubeUV(e,t,n,r,i){let a=new Al(90,1,t,n),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],c=this._renderer,l=c.autoClear,u=c.toneMapping;c.getClearColor(_u),c.toneMapping=0,c.autoClear=!1,c.state.buffers.depth.getReversed()&&(c.setRenderTarget(r),c.clearDepth(),c.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Y(new cs,new go({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1})));let d=this._backgroundBox,f=d.material,p=!1,m=e.background;m?m.isColor&&(f.color.copy(m),e.background=null,p=!0):(f.color.copy(_u),p=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x+s[t],i.y,i.z)):n===1?(a.up.set(0,0,o[t]),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y+s[t],i.z)):(a.up.set(0,o[t],0),a.position.set(i.x,i.y,i.z),a.lookAt(i.x,i.y,i.z+s[t]));let l=this._cubeSize;Du(r,n*l,t>2?l:0,l,l),c.setRenderTarget(r),p&&c.render(d,a),c.render(e,a)}c.toneMapping=u,c.autoClear=l,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=ju()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Au());let i=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=i;let o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;Du(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,gu)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let t=1;t<r;t++)this._applyGGXFilter(e,t-1,t);t.autoClear=n}_applyGGXFilter(e,t,n){let r=this._renderer,i=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let s=a.uniforms,c=n/(this._lodMeshes.length-1),l=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-l*l)*(c*1.25),{_lodMax:d}=this,f=this._sizeLods[n],p=3*f*(n>d-fu?n-d+fu:0),m=4*(this._cubeSize-f);s.envMap.value=e.texture,s.roughness.value=u,s.mipInt.value=d-t,Du(i,p,m,3*f,2*f),r.setRenderTarget(i),r.render(o,gu),s.envMap.value=i.texture,s.roughness.value=0,s.mipInt.value=d-n,Du(e,p,m,3*f,2*f),r.setRenderTarget(e),r.render(o,gu)}_blur(e,t,n,r){let i=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,i,t,n,a),this._blurPass(i,e,n,n,a)}_blurPass(e,t,n,r,i){let a=this._renderer,o=this._blurMaterial,s=this._lodMeshes[r];s.material=o;let c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=i,c.mipInt.value=this._lodMax-n;let l=this._sizeLods[r];Du(t,3*l*(r>this._lodMax-fu?r-this._lodMax+fu:0),4*(this._cubeSize-l),3*l,2*l),a.setRenderTarget(t),a.render(s,gu)}};function Tu(e){let t=[],n=[],r=e,i=e-fu+1+pu;for(let e=0;e<i;e++){let e=2**r;t.push(e);let i=1/(e-2),a=-i,o=1+i,s=[a,a,o,a,o,o,a,a,o,o,a,o],c=new Float32Array(108),l=new Float32Array(108);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];c.set(r,18*e);for(let t=0;t<6;t++){let n=s[t*2]*2-1,r=s[t*2+1]*2-1;e===0?Cu.set(1,r,n):e===1?Cu.set(-n,1,-r):e===2?Cu.set(-n,r,1):e===3?Cu.set(-1,r,-n):e===4?Cu.set(-n,-1,r):Cu.set(n,r,-1),Cu.toArray(l,(e*6+t)*3)}}let u=new Ra;u.setAttribute(`position`,new Ca(c,3)),u.setAttribute(`outputDirection`,new Ca(l,3)),n.push(new Y(u,null)),r>fu&&r--}return{lodMeshes:n,sizeLods:t}}function Eu(e,t,n){let r=new ii(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function Du(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function Ou(e,t,n){return new qc({name:`PMREMGGXConvolution`,defines:{GGX_SAMPLES:hu,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Mu(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function ku(e,t,n){return new qc({name:`SphericalGaussianBlur`,defines:{SAMPLES:mu,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Mu(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Au(){return new qc({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:Mu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function ju(){return new qc({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Mu(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Mu(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Nu=class extends ii{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new rs(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new cs(5,5,5),i=new qc({name:`CubemapFromEquirect`,uniforms:zc(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new Y(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=Jt),new Rl(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}};function Pu(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new Nu(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new wu(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new wu(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function Fu(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&Er(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Iu(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0||(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++),t}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(i===void 0)return;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else{let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}let s=new(i.count>=65535?Ta:wa)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function Lu(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function Ru(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:U(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function zu(e,t,n){let r=new WeakMap,i=new ni;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new ai(h,p,m,u);g.type=rn,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new G(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function Bu(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var Vu={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function Hu(e,t,n,r,i,a){let o=new ii(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=new Ra;l.setAttribute(`position`,new Ea([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute(`uv`,new Ea([0,2,0,0,2,0],2));let u=new Jc({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Y(l,u),f=new Nl(-1,1,1,-1,0,1),p=null,m=null,h=!1,g,_=null,v=[],y=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<v.length;n++){let r=v[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){v=e,y=v.length>0&&v[0].isRenderPass===!0;let t=o.width,n=o.height;v.length>0&&s===null&&(s=new ii(t,n,{type:an,depthBuffer:!1,stencilBuffer:!1}),c=new ii(t,n,{type:an,depthBuffer:!1,stencilBuffer:!1}));for(let e=0;e<v.length;e++){let r=v[e];r.setSize&&r.setSize(t,n)}},this.begin=function(e,t){if(h||e.toneMapping===0&&v.length===0)return!1;if(_=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return y===!1&&e.setRenderTarget(o),g=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return y},this.end=function(e,t){e.toneMapping=g,h=!0;let n=o,r=s;for(let i=0;i<v.length;i++){let a=v[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(p!==e.outputColorSpace||m!==e.toneMapping){p=e.outputColorSpace,m=e.toneMapping,u.defines={},Gr.getTransfer(p)===`srgb`&&(u.defines.SRGB_TRANSFER=``);let t=Vu[m];t&&(u.defines[t]=``),u.needsUpdate=!0}u.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(_),e.render(d,f),_=null,h=!1},this.isCompositing=function(){return h},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var Uu=new ti,Wu=new as(1,1),Gu=new ai,Ku=new oi,qu=new rs,Ju=[],Yu=[],Xu=new Float32Array(16),Zu=new Float32Array(9),Qu=new Float32Array(4);function $u(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=Ju[i];if(a===void 0&&(a=new Float32Array(i),Ju[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function ed(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function td(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function nd(e,t){let n=Yu[t];n===void 0&&(n=new Int32Array(t),Yu[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function rd(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function id(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(ed(n,t))return;e.uniform2fv(this.addr,t),td(n,t)}}function ad(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(ed(n,t))return;e.uniform3fv(this.addr,t),td(n,t)}}function od(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(ed(n,t))return;e.uniform4fv(this.addr,t),td(n,t)}}function sd(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(ed(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),td(n,t)}else{if(ed(n,r))return;Qu.set(r),e.uniformMatrix2fv(this.addr,!1,Qu),td(n,r)}}function cd(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(ed(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),td(n,t)}else{if(ed(n,r))return;Zu.set(r),e.uniformMatrix3fv(this.addr,!1,Zu),td(n,r)}}function ld(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(ed(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),td(n,t)}else{if(ed(n,r))return;Xu.set(r),e.uniformMatrix4fv(this.addr,!1,Xu),td(n,r)}}function ud(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function dd(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(ed(n,t))return;e.uniform2iv(this.addr,t),td(n,t)}}function fd(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(ed(n,t))return;e.uniform3iv(this.addr,t),td(n,t)}}function pd(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(ed(n,t))return;e.uniform4iv(this.addr,t),td(n,t)}}function md(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function hd(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(ed(n,t))return;e.uniform2uiv(this.addr,t),td(n,t)}}function gd(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(ed(n,t))return;e.uniform3uiv(this.addr,t),td(n,t)}}function _d(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(ed(n,t))return;e.uniform4uiv(this.addr,t),td(n,t)}}function vd(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(Wu.compareFunction=n.isReversedDepthBuffer()?518:515,a=Wu):a=Uu,n.setTexture2D(t||a,i)}function yd(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||Ku,i)}function bd(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||qu,i)}function xd(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||Gu,i)}function Sd(e){switch(e){case 5126:return rd;case 35664:return id;case 35665:return ad;case 35666:return od;case 35674:return sd;case 35675:return cd;case 35676:return ld;case 5124:case 35670:return ud;case 35667:case 35671:return dd;case 35668:case 35672:return fd;case 35669:case 35673:return pd;case 5125:return md;case 36294:return hd;case 36295:return gd;case 36296:return _d;case 35678:case 36198:case 36298:case 36306:case 35682:return vd;case 35679:case 36299:case 36307:return yd;case 35680:case 36300:case 36308:case 36293:return bd;case 36289:case 36303:case 36311:case 36292:return xd}}function Cd(e,t){e.uniform1fv(this.addr,t)}function wd(e,t){let n=$u(t,this.size,2);e.uniform2fv(this.addr,n)}function Td(e,t){let n=$u(t,this.size,3);e.uniform3fv(this.addr,n)}function Ed(e,t){let n=$u(t,this.size,4);e.uniform4fv(this.addr,n)}function Dd(e,t){let n=$u(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Od(e,t){let n=$u(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function kd(e,t){let n=$u(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Ad(e,t){e.uniform1iv(this.addr,t)}function jd(e,t){e.uniform2iv(this.addr,t)}function Md(e,t){e.uniform3iv(this.addr,t)}function Nd(e,t){e.uniform4iv(this.addr,t)}function Pd(e,t){e.uniform1uiv(this.addr,t)}function Fd(e,t){e.uniform2uiv(this.addr,t)}function Id(e,t){e.uniform3uiv(this.addr,t)}function Ld(e,t){e.uniform4uiv(this.addr,t)}function Rd(e,t,n){let r=this.cache,i=t.length,a=nd(n,i);ed(r,a)||(e.uniform1iv(this.addr,a),td(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?Wu:Uu;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function zd(e,t,n){let r=this.cache,i=t.length,a=nd(n,i);ed(r,a)||(e.uniform1iv(this.addr,a),td(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||Ku,a[e])}function Bd(e,t,n){let r=this.cache,i=t.length,a=nd(n,i);ed(r,a)||(e.uniform1iv(this.addr,a),td(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||qu,a[e])}function Vd(e,t,n){let r=this.cache,i=t.length,a=nd(n,i);ed(r,a)||(e.uniform1iv(this.addr,a),td(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||Gu,a[e])}function Hd(e){switch(e){case 5126:return Cd;case 35664:return wd;case 35665:return Td;case 35666:return Ed;case 35674:return Dd;case 35675:return Od;case 35676:return kd;case 5124:case 35670:return Ad;case 35667:case 35671:return jd;case 35668:case 35672:return Md;case 35669:case 35673:return Nd;case 5125:return Pd;case 36294:return Fd;case 36295:return Id;case 36296:return Ld;case 35678:case 36198:case 36298:case 36306:case 35682:return Rd;case 35679:case 36299:case 36307:return zd;case 35680:case 36300:case 36308:case 36293:return Bd;case 36289:case 36303:case 36311:case 36292:return Vd}}var Ud=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Sd(t.type)}},Wd=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Hd(t.type)}},Gd=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},Kd=/(\w+)(\])?(\[|\.)?/g;function qd(e,t){e.seq.push(t),e.map[t.id]=t}function Jd(e,t,n){let r=e.name,i=r.length;for(Kd.lastIndex=0;;){let a=Kd.exec(r),o=Kd.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){qd(n,l===void 0?new Ud(s,e,t):new Wd(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new Gd(s),qd(n,e)),n=e}}}var Yd=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);Jd(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function Xd(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var Zd=37297,Qd=0;function $d(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var ef=new q;function tf(e){Gr._getMatrix(ef,Gr.workingColorSpace,e);let t=`mat3( ${ef.elements.map(e=>e.toFixed(4))} )`;switch(Gr.getTransfer(e)){case pr:return[t,`LinearTransferOETF`];case mr:return[t,`sRGBTransferOETF`];default:return H(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function nf(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+$d(e.getShaderSource(t),r)}return i}function rf(e,t){let n=tf(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}var af={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function of(e,t){let n=af[t];return n===void 0?(H(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var sf=new K;function cf(){return Gr.getLuminanceCoefficients(sf),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${sf.x.toFixed(4)}, ${sf.y.toFixed(4)}, ${sf.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function lf(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(ff).join(`
`)}function uf(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function df(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function ff(e){return e!==``}function pf(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function mf(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var hf=/^[ \t]*#include +<([\w\d./]+)>/gm;function gf(e){return e.replace(hf,vf)}var _f=new Map;function vf(e,t){let n=X[t];if(n===void 0){let e=_f.get(t);if(e!==void 0)n=X[e],H(`WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`)}return gf(n)}var yf=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function bf(e){return e.replace(yf,xf)}function xf(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Sf(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var Cf={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function wf(e){return Cf[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Tf={301:`ENVMAP_TYPE_CUBE`,302:`ENVMAP_TYPE_CUBE`,306:`ENVMAP_TYPE_CUBE_UV`};function Ef(e){return e.envMap===!1?`ENVMAP_TYPE_CUBE`:Tf[e.envMapMode]||`ENVMAP_TYPE_CUBE`}var Df={302:`ENVMAP_MODE_REFRACTION`};function Of(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Df[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var kf={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Af(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:kf[e.combine]||`ENVMAP_BLENDING_NONE`}function jf(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function Mf(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=wf(n),l=Ef(n),u=Of(n),d=Af(n),f=jf(n),p=lf(n),m=uf(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(ff).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(ff).join(`
`),_.length>0&&(_+=`
`)):(g=[Sf(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(ff).join(`
`),_=[Sf(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.numLightProbeGrids>0?`#define USE_LIGHT_PROBES_GRID`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:X.tonemapping_pars_fragment,n.toneMapping===0?``:of(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,X.colorspace_pars_fragment,rf(`linearToOutputTexel`,n.outputColorSpace),cf(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(ff).join(`
`)),o=gf(o),o=pf(o,n),o=mf(o,n),s=gf(s),s=pf(s,n),s=mf(s,n),o=bf(o),s=bf(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=Xd(i,i.VERTEX_SHADER,y),S=Xd(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h)||``,r=i.getShaderInfoLog(x)||``,a=i.getShaderInfoLog(S)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=nf(i,x,`vertex`),n=nf(i,S,`fragment`);U(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):H(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:g},fragmentShader:{log:c,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new Yd(i,h),T=df(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,Zd)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Qd++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var Nf=0,Pf=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Ff(e),t.set(e,n)),n}},Ff=class{constructor(e){this.id=Nf++,this.code=e,this.usedTimes=0}};function If(e){return e===1030||e===37490||e===36285}function Lf(e,t,n,r,i,a){let o=new vi,s=new Pf,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f=r.precision,p={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function m(e){return c.add(e),e===0?`uv`:`uv${e}`}function h(i,o,l,u,h,g){let _=u.fog,v=h.geometry,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,b=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,x=t.get(i.envMap||y,b),S=x&&x.mapping===306?x.image.height:null,C=p[i.type];i.precision!==null&&(f=r.getMaxPrecision(i.precision),f!==i.precision&&H(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,f,`instead.`));let w=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,T=w===void 0?0:w.length,E=0;v.morphAttributes.position!==void 0&&(E=1),v.morphAttributes.normal!==void 0&&(E=2),v.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=ru[C];D=e.vertexShader,O=e.fragmentShader}else{D=i.vertexShader,O=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),k=e.id,A=t.id}let j=e.getRenderTarget(),ee=e.state.buffers.depth.getReversed(),M=h.isInstancedMesh===!0,N=h.isBatchedMesh===!0,P=!!i.map,F=!!i.matcap,te=!!x,I=!!i.aoMap,ne=!!i.lightMap,re=!!i.bumpMap&&i.wireframe===!1,L=!!i.normalMap,ie=!!i.displacementMap,ae=!!i.emissiveMap,oe=!!i.metalnessMap,se=!!i.roughnessMap,ce=i.anisotropy>0,le=i.clearcoat>0,ue=i.dispersion>0,de=i.retroreflectivity>0,fe=i.iridescence>0,pe=i.sheen>0,me=i.transmission>0,he=ce&&!!i.anisotropyMap,ge=le&&!!i.clearcoatMap,_e=le&&!!i.clearcoatNormalMap,ve=le&&!!i.clearcoatRoughnessMap,ye=fe&&!!i.iridescenceMap,R=fe&&!!i.iridescenceThicknessMap,be=pe&&!!i.sheenColorMap,xe=pe&&!!i.sheenRoughnessMap,Se=!!i.specularMap,z=!!i.specularColorMap,Ce=!!i.specularIntensityMap,B=me&&!!i.transmissionMap,V=me&&!!i.thicknessMap,we=!!i.gradientMap,Te=!!i.alphaMap,Ee=i.alphaTest>0,De=!!i.alphaHash,Oe=!!i.extensions,ke=0;i.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(ke=e.toneMapping);let Ae={shaderID:C,shaderType:i.type,shaderName:i.name,vertexShader:D,fragmentShader:O,defines:i.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:f,batching:N,batchingColor:N&&h._colorsTexture!==null,instancing:M,instancingColor:M&&h.instanceColor!==null,instancingMorph:M&&h.morphTexture!==null,outputColorSpace:j===null?e.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:Gr.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:P,matcap:F,envMap:te,envMapMode:te&&x.mapping,envMapCubeUVHeight:S,aoMap:I,lightMap:ne,bumpMap:re,normalMap:L,displacementMap:ie,emissiveMap:ae,normalMapObjectSpace:L&&i.normalMapType===1,normalMapTangentSpace:L&&i.normalMapType===0,packedNormalMap:L&&i.normalMapType===0&&If(i.normalMap.format),metalnessMap:oe,roughnessMap:se,anisotropy:ce,anisotropyMap:he,clearcoat:le,clearcoatMap:ge,clearcoatNormalMap:_e,clearcoatRoughnessMap:ve,dispersion:ue,retroreflection:de,iridescence:fe,iridescenceMap:ye,iridescenceThicknessMap:R,sheen:pe,sheenColorMap:be,sheenRoughnessMap:xe,specularMap:Se,specularColorMap:z,specularIntensityMap:Ce,transmission:me,transmissionMap:B,thicknessMap:V,gradientMap:we,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:Te,alphaTest:Ee,alphaHash:De,combine:i.combine,mapUv:P&&m(i.map.channel),aoMapUv:I&&m(i.aoMap.channel),lightMapUv:ne&&m(i.lightMap.channel),bumpMapUv:re&&m(i.bumpMap.channel),normalMapUv:L&&m(i.normalMap.channel),displacementMapUv:ie&&m(i.displacementMap.channel),emissiveMapUv:ae&&m(i.emissiveMap.channel),metalnessMapUv:oe&&m(i.metalnessMap.channel),roughnessMapUv:se&&m(i.roughnessMap.channel),anisotropyMapUv:he&&m(i.anisotropyMap.channel),clearcoatMapUv:ge&&m(i.clearcoatMap.channel),clearcoatNormalMapUv:_e&&m(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ve&&m(i.clearcoatRoughnessMap.channel),iridescenceMapUv:ye&&m(i.iridescenceMap.channel),iridescenceThicknessMapUv:R&&m(i.iridescenceThicknessMap.channel),sheenColorMapUv:be&&m(i.sheenColorMap.channel),sheenRoughnessMapUv:xe&&m(i.sheenRoughnessMap.channel),specularMapUv:Se&&m(i.specularMap.channel),specularColorMapUv:z&&m(i.specularColorMap.channel),specularIntensityMapUv:Ce&&m(i.specularIntensityMap.channel),transmissionMapUv:B&&m(i.transmissionMap.channel),thicknessMapUv:V&&m(i.thicknessMap.channel),alphaMapUv:Te&&m(i.alphaMap.channel),vertexTangents:!!v.attributes.tangent&&(L||ce),vertexNormals:!!v.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,pointsUvs:h.isPoints===!0&&!!v.attributes.uv&&(P||Te),fog:!!_,useFog:i.fog===!0,fogExp2:!!_&&_.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||v.attributes.normal===void 0&&L===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:ee,skinning:h.isSkinnedMesh===!0,hasPositionAttribute:v.attributes.position!==void 0,morphTargets:v.morphAttributes.position!==void 0,morphNormals:v.morphAttributes.normal!==void 0,morphColors:v.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:g.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:ke,decodeVideoTexture:P&&i.map.isVideoTexture===!0&&Gr.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:ae&&i.emissiveMap.isVideoTexture===!0&&Gr.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Oe&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Oe&&i.extensions.multiDraw===!0||N)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Ae.vertexUv1s=c.has(1),Ae.vertexUv2s=c.has(2),Ae.vertexUv3s=c.has(3),c.clear(),Ae}function g(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(_(n,t),v(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function _(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function v(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function y(e){let t=p[e.type],n;if(t){let e=ru[t];n=Wc.clone(e.uniforms)}else n=e.uniforms;return n}function b(t,n){let r=u.get(n);return r===void 0?(r=new Mf(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function x(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function S(e){s.remove(e)}function C(){s.dispose()}return{getParameters:h,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:x,releaseShaderCache:S,programs:l,dispose:C}}function Rf(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function zf(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Bf(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Vf(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||zf),r.length>1&&r.sort(t||Bf),i.length>1&&i.sort(t||Bf)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function Hf(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new Vf,e.set(t,[i])):n>=r.length?(i=new Vf,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Uf(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new K,color:new J};break;case`SpotLight`:n={position:new K,direction:new K,color:new J,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new K,color:new J,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new K,skyColor:new J,groundColor:new J};break;case`RectAreaLight`:n={color:new J,position:new K,halfWidth:new K,halfHeight:new K}}return e[t.id]=n,n}}}function Wf(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new G,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var Gf=0;function Kf(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function qf(e){let t=new Uf,n=Wf(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new K);let i=new K,a=new si,o=new si;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(Kf);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=Z.LTC_FLOAT_1,r.rectAreaLTC2=Z.LTC_FLOAT_2):(r.rectAreaLTC1=Z.LTC_HALF_1,r.rectAreaLTC2=Z.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=Gf++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function Jf(e){let t=new qf(e),n=[],r=[],i=[];function a(e){d.camera=e,n.length=0,r.length=0,i.length=0}function o(e){n.push(e)}function s(e){r.push(e)}function c(e){i.push(e)}function l(){t.setup(n)}function u(e){t.setupView(n,e)}let d={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:s,pushLightProbeGrid:c}}function Yf(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new Jf(e),t.set(n,[a])):r>=i.length?(a=new Jf(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Xf=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Zf=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Qf=[new K(1,0,0),new K(-1,0,0),new K(0,1,0),new K(0,-1,0),new K(0,0,1),new K(0,0,-1)],$f=[new K(0,-1,0),new K(0,-1,0),new K(0,0,1),new K(0,0,-1),new K(0,-1,0),new K(0,-1,0)],ep=new si,tp=new K,np=new K;function rp(e,t,n){let r=new Uo,i=new G,a=new G,o=new ni,s=new Xc,c=new Zc,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new qc({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new G},radius:{value:4}},vertexShader:Xf,fragmentShader:Zf}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new Ra;m.setAttribute(`position`,new Ca(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new Y(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(H(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){H(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){H(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new ii(i.x,i.y,{format:vn,type:an,minFilter:Jt,magFilter:Jt,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new as(i.x,i.y,rn),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=mn,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=Gt,d.map.depthTexture.magFilter=Gt}else l.isPointLight?(d.map=new Nu(i.x),d.map.depthTexture=new os(i.x,nn)):(d.map=new ii(i.x,i.y),d.map.depthTexture=new as(i.x,i.y,nn)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=mn,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=Jt,d.map.depthTexture.magFilter=Jt):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=Gt,d.map.depthTexture.magFilter=Gt);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),tp.setFromMatrixPosition(l.matrixWorld),e.position.copy(tp),np.copy(e.position),np.add(Qf[t]),e.up.copy($f[t]),e.lookAt(np),e.updateMatrixWorld(),n.makeTranslation(-tp.x,-tp.y,-tp.z),ep.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(ep,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new ii(i.x,i.y,{format:vn,type:an}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=y(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)b(c[e],i,a,o,s)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function ip(e,t){function n(){let t=!1,n=new ni,r=null,i=new ni(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?oe(e.DEPTH_TEST):se(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=Or[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?oe(e.STENCIL_TEST):se(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new J(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ee=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),M=!1,N=0,P=e.getParameter(e.VERSION);P.indexOf(`WebGL`)===-1?P.indexOf(`OpenGL ES`)!==-1&&(N=parseFloat(/^OpenGL ES (\d)/.exec(P)[1]),M=N>=2):(N=parseFloat(/^WebGL (\d)/.exec(P)[1]),M=N>=1);let F=null,te={},I=e.getParameter(e.SCISSOR_BOX),ne=e.getParameter(e.VIEWPORT),re=new ni().fromArray(I),L=new ni().fromArray(ne);function ie(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let ae={};ae[e.TEXTURE_2D]=ie(e.TEXTURE_2D,e.TEXTURE_2D,1),ae[e.TEXTURE_CUBE_MAP]=ie(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),ae[e.TEXTURE_2D_ARRAY]=ie(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),ae[e.TEXTURE_3D]=ie(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),oe(e.DEPTH_TEST),o.setFunc(3),he(!1),ge(1),oe(e.CULL_FACE),pe(0);function oe(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function se(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function ce(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function le(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function ue(t){return h!==t&&(e.useProgram(t),h=t,!0)}let de={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};de[103]=e.MIN,de[104]=e.MAX;let fe={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function pe(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(se(e.BLEND),g=!1);else if(g===!1&&(oe(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:U(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:U(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:U(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:U(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(de[n],de[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(fe[r],fe[i],fe[o],fe[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function me(t,n){t.side===2?se(e.CULL_FACE):oe(e.CULL_FACE);let r=t.side===1;n&&(r=!r),he(r),t.blending===1&&t.transparent===!1?pe(0):pe(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),ve(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?oe(e.SAMPLE_ALPHA_TO_COVERAGE):se(e.SAMPLE_ALPHA_TO_COVERAGE)}function he(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function ge(t){t===0?se(e.CULL_FACE):(oe(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function _e(t){t!==k&&(M&&e.lineWidth(t),k=t)}function ve(t,n,r){t?(oe(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n),e.polygonOffset(n,r))):se(e.POLYGON_OFFSET_FILL)}function ye(t){t?oe(e.SCISSOR_TEST):se(e.SCISSOR_TEST)}function R(t){t===void 0&&(t=e.TEXTURE0+ee-1),F!==t&&(e.activeTexture(t),F=t)}function be(t,n,r){r===void 0&&(r=F===null?e.TEXTURE0+ee-1:F);let i=te[r];i===void 0&&(i={type:void 0,texture:void 0},te[r]=i),(i.type!==t||i.texture!==n)&&(F!==r&&(e.activeTexture(r),F=r),e.bindTexture(t,n||ae[t]),i.type=t,i.texture=n)}function xe(){let t=te[F];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function Se(){try{e.compressedTexImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function z(){try{e.compressedTexImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Ce(){try{e.texSubImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function B(){try{e.texSubImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function V(){try{e.compressedTexSubImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function we(){try{e.compressedTexSubImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Te(){try{e.texStorage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Ee(){try{e.texStorage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function De(){try{e.texImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Oe(){try{e.texImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function ke(t){return d[t]===void 0?e.getParameter(t):d[t]}function Ae(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function je(t){re.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),re.copy(t))}function Me(t){L.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),L.copy(t))}function Ne(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function Pe(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function Fe(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},F=null,te={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new J(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,re.set(0,0,e.canvas.width,e.canvas.height),L.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:oe,disable:se,bindFramebuffer:ce,drawBuffers:le,useProgram:ue,setBlending:pe,setMaterial:me,setFlipSided:he,setCullFace:ge,setLineWidth:_e,setPolygonOffset:ve,setScissorTest:ye,activeTexture:R,bindTexture:be,unbindTexture:xe,compressedTexImage2D:Se,compressedTexImage3D:z,texImage2D:De,texImage3D:Oe,pixelStorei:Ae,getParameter:ke,updateUBOMapping:Ne,uniformBlockBinding:Pe,texStorage2D:Te,texStorage3D:Ee,texSubImage2D:Ce,texSubImage3D:B,compressedTexSubImage2D:V,compressedTexSubImage3D:we,scissor:je,viewport:Me,reset:Fe}}function ap(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new G,u=new WeakMap,d=new Set,f,p=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function h(e,t){return m?new OffscreenCanvas(e,t):xr(`canvas`)}function g(e,t,n){let r=1,i=Se(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=h(n,a));let o=t?h(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),H(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&H(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function _(e){return e.generateMipmaps}function v(t){e.generateMipmap(t)}function y(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function b(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];H(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||H(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?pr:Gr.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function x(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,H(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function S(e,t){return _(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function C(e){let t=e.target;t.removeEventListener(`dispose`,C),T(t),t.isVideoTexture&&u.delete(t),t.isHTMLTexture&&d.delete(t)}function w(e){let t=e.target;t.removeEventListener(`dispose`,w),D(t)}function T(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&E(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function E(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function D(t){let n=r.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),r.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let i=t.textures;for(let t=0,n=i.length;t<n;t++){let n=r.get(i[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(i[t])}r.remove(t)}let O=0;function k(){O=0}function A(){return O}function j(e){O=e}function ee(){let e=O;return e>=i.maxTextures&&H(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),O+=1,e}function M(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function N(t,i){let a=r.get(t);if(t.isVideoTexture&&be(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)H(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)H(`WebGLRenderer: Texture marked for update but image is incomplete`);else{se(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function P(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?se(a,t,i):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i))}function F(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?se(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function te(t,i){let a=r.get(t);t.isCubeDepthTexture!==!0&&t.version>0&&a.__version!==t.version?ce(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let I={[Ht]:e.REPEAT,[Ut]:e.CLAMP_TO_EDGE,[Wt]:e.MIRRORED_REPEAT},ne={[Gt]:e.NEAREST,[Kt]:e.NEAREST_MIPMAP_NEAREST,[qt]:e.NEAREST_MIPMAP_LINEAR,[Jt]:e.LINEAR,[Yt]:e.LINEAR_MIPMAP_NEAREST,[Xt]:e.LINEAR_MIPMAP_LINEAR},re={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function L(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&H(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,I[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,I[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,I[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,ne[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,ne[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,re[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function ie(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,C));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=M(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&E(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function ae(e,t,n){return Math.floor(Math.floor(e/n)/t)}function oe(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=ae(n.start,r.width,4),c=ae(t.start,r.width,4);n.start<=i+1&&a===c&&ae(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function se(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=ie(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=Gr.getPrimaries(Gr.workingColorSpace),r=o.colorSpace===``?null:Gr.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=g(o.image,!1,i.maxTextureSize);t=xe(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=b(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);L(c,o);let h,y=o.mipmaps,C=o.isVideoTexture!==!0,w=f.__version===void 0||l===!0,T=u.dataReady,E=S(o,t);if(o.isDepthTexture)m=x(o.format===hn,o.type),w&&(C?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(y.length>0){C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else C?(w&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&oe(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){C&&w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,y[0].width,y[0].height,t.depth);for(let i=0,a=y.length;i<a;i++)if(h=y[i],o.format!==1023){if(r!==null){if(C){if(T){if(o.layerUpdates.size>0){let t=$l(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else C?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{C&&w&&n.texStorage2D(e.TEXTURE_2D,E,m,y[0].width,y[0].height);for(let t=0,i=y.length;t<i;t++)h=y[t],o.format===1023?C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):C?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(C){if(w&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=$l(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)C?(w&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(w){if(C)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(y.length>0){if(C&&w){let t=Se(y[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=y.length;t<i;t++)h=y[t],C?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(C){if(w){let r=Se(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);_(o)&&v(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function ce(t,o,s){if(o.image.length!==6)return;let c=ie(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=Gr.getPrimaries(Gr.workingColorSpace),r=o.colorSpace===``?null:Gr.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=g(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=xe(o,m[e]);let h=m[0],y=a.convert(o.format,o.colorSpace),x=a.convert(o.type),C=b(o.internalFormat,y,x,o.normalized,o.colorSpace),w=o.isVideoTexture!==!0,T=u.__version===void 0||c===!0,E=l.dataReady,D=S(o,h);L(e.TEXTURE_CUBE_MAP,o);let O;if(f){w&&T&&n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,h.width,h.height);for(let t=0;t<6;t++){O=m[t].mipmaps;for(let r=0;r<O.length;r++){let i=O[r];o.format===1023?w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,y,x,i.data):y===null?H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):w?E&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,y,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,C,i.width,i.height,0,i.data)}}}else{if(O=o.mipmaps,w&&T){O.length>0&&D++;let t=Se(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,D,C,t.width,t.height)}for(let t=0;t<6;t++)if(p){w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,y,x,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,m[t].width,m[t].height,0,y,x,m[t].data);for(let r=0;r<O.length;r++){let i=O[r].image[t].image;w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,y,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,i.width,i.height,0,y,x,i.data)}}else{w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,y,x,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,C,y,x,m[t]);for(let r=0;r<O.length;r++){let i=O[r];w?E&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,y,x,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,C,y,x,i.image[t])}}}_(o)&&v(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function le(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=b(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),R(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,ye(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function ue(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=x(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;R(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ye(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,ye(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=b(o.internalFormat,c,l,o.normalized,o.colorSpace);R(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,ye(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,ye(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function de(t,i,o){let c=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let l=r.get(i.depthTexture);if(l.__renderTarget=i,l.__webglTexture&&i.depthTexture.image.width===i.width&&i.depthTexture.image.height===i.height||(i.depthTexture.image.width=i.width,i.depthTexture.image.height=i.height,i.depthTexture.needsUpdate=!0),c){if(l.__webglInit===void 0&&(l.__webglInit=!0,i.depthTexture.addEventListener(`dispose`,C)),l.__webglTexture===void 0){l.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,l.__webglTexture),L(e.TEXTURE_CUBE_MAP,i.depthTexture);let t=a.convert(i.depthTexture.format),r=a.convert(i.depthTexture.type),o;i.depthTexture.format===1026?o=e.DEPTH_COMPONENT24:i.depthTexture.format===1027&&(o=e.DEPTH24_STENCIL8);for(let n=0;n<6;n++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0,o,i.width,i.height,0,t,r,null)}}else N(i.depthTexture,0);let u=l.__webglTexture,d=ye(i),f=c?e.TEXTURE_CUBE_MAP_POSITIVE_X+o:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)R(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)R(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function fe(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)de(i.__webglFramebuffer[e],t,e);else{let e=t.texture.mipmaps;e&&e.length>0?de(i.__webglFramebuffer[0],t,0):de(i.__webglFramebuffer,t,0)}}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),ue(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else{let r=t.texture.mipmaps;if(r&&r.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),ue(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function pe(t,n,i){let a=r.get(t);n!==void 0&&le(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&fe(t)}function me(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,w);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&R(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=b(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=ye(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),ue(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),L(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps&&i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)le(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else le(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);_(i)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),L(c,a),le(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),_(a)&&v(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),L(r,i),i.mipmaps&&i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)le(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else le(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);_(i)&&v(r),n.unbindTexture()}t.depthBuffer&&fe(t)}function he(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(_(a)){let t=y(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),v(t),n.unbindTexture()}}}let ge=[],_e=[];function ve(t){if(t.samples>0){if(R(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer);let f=t.texture.mipmaps;f&&f.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(ge.length=0,_e.length=0,ge.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&(ge.push(l),_e.push(l),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,_e)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,ge))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function ye(e){return Math.min(i.maxSamples,e.samples)}function R(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function be(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function xe(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(Gr.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&H(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):U(`WebGLTextures: Unsupported texture color space:`,n)),t}function Se(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=ee,this.resetTextureUnits=k,this.getTextureUnits=A,this.setTextureUnits=j,this.setTexture2D=N,this.setTexture2DArray=P,this.setTexture3D=F,this.setTextureCube=te,this.rebindTextures=pe,this.setupRenderTarget=me,this.updateRenderTargetMipmap=he,this.updateMultisampleRenderTarget=ve,this.setupDepthRenderbuffer=fe,this.setupFrameBufferTexture=le,this.useMultisampledRTT=R,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function op(e,t){function n(n,r=``){let i,a=Gr.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var sp=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,cp=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,lp=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new ss(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new qc({vertexShader:sp,fragmentShader:cp,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Y(new Ic(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},up=class extends kr{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new lp,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new G,C=null,w=null,T=new Al;T.viewport=new ni;let E=new Al;E.viewport=new ni;let D=[T,E],O=new zl,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new Li,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new Li,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new Li,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ee(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,ee),r.removeEventListener(`inputsourceschange`,M);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,L.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&H(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&H(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,ee),r.addEventListener(`inputsourceschange`,M),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?hn:mn,a=_.stencil?cn:nn);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new ii(d.textureWidth,d.textureHeight,{format:pn,type:Zt,depthTexture:new as(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new ii(f.framebufferWidth,f.framebufferHeight,{format:pn,type:Zt,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),L.setContext(r),L.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function M(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}let N=new K,P=new K;function F(e,t,n){N.setFromMatrixPosition(t.matrixWorld),P.setFromMatrixPosition(n.matrixWorld);let r=N.distanceTo(P),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function te(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;te(O,i);for(let e=0;e<a.length;e++)te(a[e],i);a.length===2?F(O,T,E):O.projectionMatrix.copy(T.projectionMatrix),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),I(e,O,i)};function I(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=Mr*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let ne=null;function re(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new Al,o.layers.enable(n),o.viewport=new ni,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new ss,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ne&&ne(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let L=new tu;L.setAnimationLoop(re),this.setAnimationLoop=function(e){ne=e},this.dispose=function(){}}},dp=new si,fp=new q;fp.set(-1,0,0,0,1,0,0,0,1);function pp(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Uc(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(dp.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(fp),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function mp(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(g(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,v));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return U(`WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)p(t[n],e,n,a);else p(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(t,n,r,i){if(h(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=_(i);m(i,t.__data,e),typeof i!=`number`&&typeof i!=`boolean`&&!i.isMatrix3&&!ArrayBuffer.isView(i)&&(e+=a.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function m(e,t,n){typeof e==`number`||typeof e==`boolean`?t[0]=e:e.isMatrix3?(t[0]=e.elements[0],t[1]=e.elements[1],t[2]=e.elements[2],t[3]=0,t[4]=e.elements[3],t[5]=e.elements[4],t[6]=e.elements[5],t[7]=0,t[8]=e.elements[6],t[9]=e.elements[7],t[10]=e.elements[8],t[11]=0):ArrayBuffer.isView(e)?t.set(new e.constructor(e.buffer,e.byteOffset,t.length)):e.toArray(t,n)}function h(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:ArrayBuffer.isView(i)?i.slice():i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(ArrayBuffer.isView(i))return!0;else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function g(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=_(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function _(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?H(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(t.boundary=16,t.storage=e.byteLength):H(`WebGLRenderer: Unsupported uniform value type.`,e),t}function v(t){let n=t.target;n.removeEventListener(`dispose`,v);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function y(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:y}}var hp=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),gp=null;function _p(){return gp===null&&(gp=new Ao(hp,16,16,vn,an),gp.name=`DFG_LUT`,gp.minFilter=Jt,gp.magFilter=Jt,gp.wrapS=Ut,gp.wrapT=Ut,gp.generateMipmaps=!1,gp.needsUpdate=!0),gp}var vp=class{constructor(e={}){let{canvas:t=Sr(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Zt}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([bn,yn,_n]),g=new Set([Zt,nn,en,cn,on,sn]),_=new Uint32Array(4),v=new Int32Array(4),y=new K,b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=dr;let j=0,ee=0,M=null,N=-1,P=null,F=new ni,te=new ni,I=null,ne=new J(0),re=0,L=t.width,ie=t.height,ae=1,oe=null,se=null,ce=new ni(0,0,L,ie),le=new ni(0,0,L,ie),ue=!1,de=new Uo,fe=!1,pe=!1,me=new si,he=new K,ge=new ni,_e={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ve=!1;function ye(){return M===null?ae:1}let R=n;function be(e,n){return t.getContext(e,n)}let xe,Se,z,Ce,B,V,we,Te,Ee,De,Oe,ke,Ae,je,Me,Ne,Pe,Fe,Ie,Le,Re,ze,Be;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r186`),t.addEventListener(`webglcontextlost`,Ue,!1),t.addEventListener(`webglcontextrestored`,We,!1),t.addEventListener(`webglcontextcreationerror`,Ge,!1),R===null){let t=`webgl2`;if(R=be(t,e),R===null)throw be(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}Ve()}catch(e){throw t.removeEventListener(`webglcontextlost`,Ue,!1),t.removeEventListener(`webglcontextrestored`,We,!1),t.removeEventListener(`webglcontextcreationerror`,Ge,!1),U(`WebGLRenderer: `+e.message),e}function Ve(){xe=new Fu(R),xe.init(),Re=new op(R,xe),Se=new uu(R,xe,e,Re),z=new ip(R,xe),Se.reversedDepthBuffer&&d&&z.buffers.depth.setReversed(!0),O=R.createFramebuffer(),k=R.createFramebuffer(),A=R.createFramebuffer(),Ce=new Ru(R),B=new Rf,V=new ap(R,xe,z,B,Se,Re,Ce),we=new Pu(T),Te=new nu(R),ze=new cu(R,Te),Ee=new Iu(R,Te,Ce,ze),De=new Bu(R,Ee,Te,ze,Ce),Fe=new zu(R,Se,V),Me=new du(B),Oe=new Lf(T,we,xe,Se,ze,Me),ke=new pp(T,B),Ae=new Hf,je=new Yf(xe),Pe=new su(T,we,z,De,p,s),Ne=new rp(T,De,Se),Be=new mp(R,Ce,Se,z),Ie=new lu(R,xe,Ce),Le=new Lu(R,xe,Ce),Ce.programs=Oe.programs,T.capabilities=Se,T.extensions=xe,T.properties=B,T.renderLists=Ae,T.shadowMap=Ne,T.state=z,T.info=Ce}m!==1009&&(w=new Hu(m,t.width,t.height,o,r,i));let He=new up(T,R);this.xr=He,this.getContext=function(){return R},this.getContextAttributes=function(){return R.getContextAttributes()},this.forceContextLoss=function(){let e=xe.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=xe.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return ae},this.setPixelRatio=function(e){e!==void 0&&(ae=e,this.setSize(L,ie,!1))},this.getSize=function(e){return e.set(L,ie)},this.setSize=function(e,n,r=!0){He.isPresenting?H(`WebGLRenderer: Can't change size while VR device is presenting.`):(L=e,ie=n,t.width=Math.floor(e*ae),t.height=Math.floor(n*ae),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(L*ae,ie*ae).floor()},this.setDrawingBufferSize=function(e,n,r){L=e,ie=n,ae=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009)U(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){H(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(F)},this.getViewport=function(e){return e.copy(ce)},this.setViewport=function(e,t,n,r){e.isVector4?ce.set(e.x,e.y,e.z,e.w):ce.set(e,t,n,r),z.viewport(F.copy(ce).multiplyScalar(ae).round())},this.getScissor=function(e){return e.copy(le)},this.setScissor=function(e,t,n,r){e.isVector4?le.set(e.x,e.y,e.z,e.w):le.set(e,t,n,r),z.scissor(te.copy(le).multiplyScalar(ae).round())},this.getScissorTest=function(){return ue},this.setScissorTest=function(e){z.setScissorTest(ue=e)},this.setOpaqueSort=function(e){oe=e},this.setTransparentSort=function(e){se=e},this.getClearColor=function(e){return e.copy(Pe.getClearColor())},this.setClearColor=function(){Pe.setClearColor(...arguments)},this.getClearAlpha=function(){return Pe.getClearAlpha()},this.setClearAlpha=function(){Pe.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(M!==null){let t=M.texture.format;e=h.has(t)}if(e){let e=M.texture.type,t=g.has(e),n=Pe.getClearColor(),r=Pe.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,R.clearBufferuiv(R.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,R.clearBufferiv(R.COLOR,0,v))}else r|=R.COLOR_BUFFER_BIT}t&&(r|=R.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=R.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&R.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,Ue,!1),t.removeEventListener(`webglcontextrestored`,We,!1),t.removeEventListener(`webglcontextcreationerror`,Ge,!1),Pe.dispose(),Ae.dispose(),je.dispose(),B.dispose(),we.dispose(),De.dispose(),ze.dispose(),Be.dispose(),Oe.dispose(),He.dispose(),He.removeEventListener(`sessionstart`,Qe),He.removeEventListener(`sessionend`,$e),et.stop()};function Ue(e){e.preventDefault(),wr(`WebGLRenderer: Context Lost.`),E=!0}function We(){wr(`WebGLRenderer: Context Restored.`),E=!1;let e=Ce.autoReset,t=Ne.enabled,n=Ne.autoUpdate,r=Ne.needsUpdate,i=Ne.type;Ve(),Ce.autoReset=e,Ne.enabled=t,Ne.autoUpdate=n,Ne.needsUpdate=r,Ne.type=i}function Ge(e){U(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function Ke(e){let t=e.target;t.removeEventListener(`dispose`,Ke),qe(t)}function qe(e){Je(e),B.remove(e)}function Je(e){let t=B.get(e).programs;t!==void 0&&(t.forEach(function(e){Oe.releaseProgram(e)}),e.isShaderMaterial&&Oe.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=_e);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=ut(e,t,n,r,i);z.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Ee.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;ze.setup(i,r,s,n,c);let h,g=Ie;if(c!==null&&(h=Te.get(c),g=Le,g.setIndex(h)),i.isMesh)r.wireframe===!0?(z.setLineWidth(r.wireframeLinewidth*ye()),g.setMode(R.LINES)):g.setMode(R.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),z.setLineWidth(e*ye()),i.isLineSegments?g.setMode(R.LINES):i.isLineLoop?g.setMode(R.LINE_LOOP):g.setMode(R.LINE_STRIP)}else i.isPoints?g.setMode(R.POINTS):i.isSprite&&g.setMode(R.TRIANGLES);if(i.isBatchedMesh){if(xe.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Te.get(c).bytesPerElement:1,o=B.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(R,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function Ye(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),fe===!0&&Me.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,ot(e,t,r),e.side=0,e.needsUpdate=!0,ot(e,t,r),e.side=2):ot(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=je.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),pe=this.localClippingEnabled,fe=Me.init(this.clippingPlanes,pe),fe===!0&&Me.setGlobalState(this.clippingPlanes,t),D!==null&&Ne.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];Ye(o,n,t,e),r.add(o)}else Ye(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=B.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}xe.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let Xe=null;function Ze(e){Xe&&Xe(e)}function Qe(){et.stop()}function $e(){et.start()}let et=new tu;et.setAnimationLoop(Ze),typeof self<`u`&&et.setContext(self),this.setAnimationLoop=function(e){Xe=e,He.setAnimationLoop(e),e===null?et.stop():et.start()},He.addEventListener(`sessionstart`,Qe),He.addEventListener(`sessionend`,$e),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){U(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=He.enabled===!0&&He.isPresenting===!0,r=w!==null&&(M===null||n)&&w.begin(T,M);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),He.enabled===!0&&He.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(He.cameraAutoUpdate===!0&&He.updateCamera(t),t=He.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,M),x=je.get(e,C.length),x.init(t),x.state.textureUnits=V.getTextureUnits(),C.push(x),me.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),de.setFromProjectionMatrix(me,vr,t.reversedDepth),pe=this.localClippingEnabled,fe=Me.init(this.clippingPlanes,pe),b=Ae.get(e,S.length),b.init(),S.push(b),He.enabled===!0&&He.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&tt(e,t,-1/0,T.sortObjects)}tt(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(oe,se),ve=He.enabled===!1||He.isPresenting===!1||He.hasDepthSensing()===!1,ve&&Pe.addToRenderList(b,e),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),fe===!0&&Me.beginShadows();let i=x.state.shadowsArray;if(Ne.render(i,e,t),fe===!0&&Me.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];rt(n,r,e,a)}ve&&Pe.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];nt(b,e,n,n.viewport)}}else r.length>0&&rt(n,r,e,t),ve&&Pe.render(e),nt(b,e,t)}M!==null&&ee===0&&(V.updateMultisampleRenderTarget(M),V.updateRenderTargetMipmap(M)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),ze.resetDefaultState(),N=-1,P=null,C.pop(),C.length>0?(x=C[C.length-1],V.setTextureUnits(x.state.textureUnits),fe===!0&&Me.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function tt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLightProbeGrid)x.pushLightProbeGrid(e);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||e.intersectsFrustum(de)){r&&ge.setFromMatrixPosition(e.matrixWorld).applyMatrix4(me);let i=De.update(e),a=e.material;a.visible&&b.push(e,i,a,n,ge.z,null,t)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||e.intersectsFrustum(de))){let i=De.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),ge.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),ge.copy(e.boundingSphere.center)),ge.applyMatrix4(e.matrixWorld).applyMatrix4(me)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,ge.z,s,t)}}else a.visible&&b.push(e,i,a,n,ge.z,null,t)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)tt(i[e],t,n,r)}function nt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),fe===!0&&Me.setGlobalState(T.clippingPlanes,n),r&&z.viewport(F.copy(r)),i.length>0&&it(i,t,n),a.length>0&&it(a,t,n),o.length>0&&it(o,t,n),z.buffers.depth.setTest(!0),z.buffers.depth.setMask(!0),z.buffers.color.setMask(!0),z.setPolygonOffset(!1)}function rt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=xe.has(`EXT_color_buffer_half_float`)||xe.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new ii(1,1,{generateMipmaps:!0,type:e?an:Zt,minFilter:Xt,samples:Math.max(4,Se.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Gr.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||F;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(ne),re=T.getClearAlpha(),re<1&&T.setClearColor(16777215,.5),T.clear(),ve&&Pe.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),fe===!0&&Me.setGlobalState(T.clippingPlanes,r),it(e,n,r),V.updateMultisampleRenderTarget(a),V.updateRenderTargetMipmap(a),xe.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,at(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(V.updateMultisampleRenderTarget(a),V.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(ne,re),d!==void 0&&(r.viewport=d),T.toneMapping=u}function it(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&at(o,t,n,s,l,c)}}function at(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function ot(e,t,n){t.isScene!==!0&&(t=_e);let r=B.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=Oe.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=Oe.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=we.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,Ke),l=new Map,r.programs=l);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return ct(e,s),d}else s.uniforms=Oe.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=Oe.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Me.uniform),ct(e,s),r.needsLights=ft(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.lightProbeGrid=x.state.lightProbeGridArray.length>0,r.currentProgram=d,r.uniformsList=null,d}function st(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=Yd.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function ct(e,t){let n=B.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function lt(e,t){if(e.length===0)return null;if(e.length===1)return e[0].texture===null?null:e[0];y.setFromMatrixPosition(t.matrixWorld);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n.texture!==null&&n.boundingBox.containsPoint(y))return n}return null}function ut(e,t,n,r,i){t.isScene!==!0&&(t=_e),V.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=M===null?T.outputColorSpace:M.isXRRenderTarget===!0?M.texture.colorSpace:Gr.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=we.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(M===null||M.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=B.get(r),y=x.state.lights;if(fe===!0&&(pe===!0||e!==P)){let t=e===P&&r.id===N;Me.setState(r,e,t)}let b=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==y.state.version?b=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?b=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Me.numPlanes||v.numIntersection!==Me.numIntersection)?b=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.toneMapping===h&&v.morphTargetsCount===_?!!v.lightProbeGrid!=x.state.lightProbeGridArray.length>0&&(b=!0):b=!0:b=!0:b=!0:(b=!0,v.__version=r.version);let S=v.currentProgram;b===!0&&(S=ot(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,S,v));let C=!1,w=!1,E=!1,O=S.getUniforms(),k=v.uniforms;if(z.useProgram(S.program)&&(C=!0,w=!0,E=!0),r.id!==N&&(N=r.id,w=!0),v.needsLights){let e=lt(x.state.lightProbeGridArray,i);v.lightProbeGrid!==e&&(v.lightProbeGrid=e,w=!0)}if(C||P!==e){z.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),O.setValue(R,`projectionMatrix`,e.projectionMatrix),O.setValue(R,`viewMatrix`,e.matrixWorldInverse);let t=O.map.cameraPosition;t!==void 0&&t.setValue(R,he.setFromMatrixPosition(e.matrixWorld)),Se.logarithmicDepthBuffer&&O.setValue(R,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&O.setValue(R,`isOrthographic`,e.isOrthographicCamera===!0),P!==e&&(P=e,w=!0,E=!0)}if(v.needsLights&&(y.state.sunShadowMap.length>0&&O.setValue(R,`sunShadowMap`,y.state.sunShadowMap,V),y.state.directionalShadowMap.length>0&&O.setValue(R,`directionalShadowMap`,y.state.directionalShadowMap,V),y.state.spotShadowMap.length>0&&O.setValue(R,`spotShadowMap`,y.state.spotShadowMap,V),y.state.pointShadowMap.length>0&&O.setValue(R,`pointShadowMap`,y.state.pointShadowMap,V)),i.isSkinnedMesh){O.setOptional(R,i,`bindMatrix`),O.setOptional(R,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),O.setValue(R,`boneTexture`,e.boneTexture,V))}i.isBatchedMesh&&(O.setOptional(R,i,`batchingTexture`),O.setValue(R,`batchingTexture`,i._matricesTexture,V),O.setOptional(R,i,`batchingIdTexture`),O.setValue(R,`batchingIdTexture`,i._indirectTexture,V),O.setOptional(R,i,`batchingColorTexture`),i._colorsTexture!==null&&O.setValue(R,`batchingColorTexture`,i._colorsTexture,V));let A=n.morphAttributes;if((A.position!==void 0||A.normal!==void 0||A.color!==void 0)&&Fe.update(i,n,S),(w||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,O.setValue(R,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(k.envMapIntensity.value=t.environmentIntensity),k.dfgLUT!==void 0&&(k.dfgLUT.value=_p()),w){if(O.setValue(R,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&dt(k,E),a&&r.fog===!0&&ke.refreshFogUniforms(k,a),ke.refreshMaterialUniforms(k,r,ae,ie,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.lightProbeGrid){let e=v.lightProbeGrid;k.probesSH.value=e.texture,k.probesMin.value.copy(e.boundingBox.min),k.probesMax.value.copy(e.boundingBox.max),k.probesResolution.value.copy(e.resolution)}Yd.upload(R,st(v),k,V)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(Yd.upload(R,st(v),k,V),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&O.setValue(R,`center`,i.center),O.setValue(R,`modelViewMatrix`,i.modelViewMatrix),O.setValue(R,`normalMatrix`,i.normalMatrix),O.setValue(R,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];Be.update(n,S),Be.bind(n,S)}}return S}function dt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function ft(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return ee},this.getRenderTarget=function(){return M},this.setRenderTargetTextures=function(e,t,n){let r=B.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),B.get(e.texture).__webglTexture=t,B.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=B.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){M=e,j=t,ee=n;let r=null,i=!1,a=!1;if(e){let o=B.get(e);if(o.__useDefaultFramebuffer!==void 0){z.bindFramebuffer(R.FRAMEBUFFER,o.__webglFramebuffer),F.copy(e.viewport),te.copy(e.scissor),I=e.scissorTest,z.viewport(F),z.scissor(te),z.setScissorTest(I),N=-1;return}if(o.__webglFramebuffer===void 0)V.setupRenderTarget(e);else if(o.__hasExternalTextures)V.rebindTextures(e,B.get(e.texture).__webglTexture,B.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&B.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);V.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=B.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&V.useMultisampledRTT(e)===!1?B.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,F.copy(e.viewport),te.copy(e.scissor),I=e.scissorTest}else F.copy(ce).multiplyScalar(ae).floor(),te.copy(le).multiplyScalar(ae).floor(),I=ue;if(n!==0&&(r=O),z.bindFramebuffer(R.FRAMEBUFFER,r)&&z.drawBuffers(e,r),z.viewport(F),z.scissor(te),z.setScissorTest(I),i){let r=B.get(e.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=B.get(e.textures[t]);R.framebufferTextureLayer(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=B.get(e.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,t.__webglTexture,n)}N=-1};function pt(e){let t=B.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Se.textureFormatReadable(e.format),t.__typeReadable=Se.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=B.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){z.bindFramebuffer(R.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&R.readBuffer(R.COLOR_ATTACHMENT0+s);let u=pt(o);if(u.__formatReadable===!1){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&R.readPixels(t,n,r,i,Re.convert(c),Re.convert(l),a)}finally{let e=M===null?null:B.get(M).__webglFramebuffer;z.bindFramebuffer(R.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=B.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o]),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){z.bindFramebuffer(R.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&R.readBuffer(R.COLOR_ATTACHMENT0+s);let d=pt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=R.createBuffer();R.bindBuffer(R.PIXEL_PACK_BUFFER,f),R.bufferData(R.PIXEL_PACK_BUFFER,a.byteLength,R.STREAM_READ),R.readPixels(t,n,r,i,Re.convert(l),Re.convert(u),0),R.bindBuffer(R.PIXEL_PACK_BUFFER,null);let p=M===null?null:B.get(M).__webglFramebuffer;z.bindFramebuffer(R.FRAMEBUFFER,p);let m=R.fenceSync(R.SYNC_GPU_COMMANDS_COMPLETE,0);return R.flush(),await Dr(R,m,4),R.bindBuffer(R.PIXEL_PACK_BUFFER,f),R.getBufferSubData(R.PIXEL_PACK_BUFFER,0,a),R.bindBuffer(R.PIXEL_PACK_BUFFER,null),R.deleteBuffer(f),R.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;V.setTexture2D(e,0),R.copyTexSubImage2D(R.TEXTURE_2D,n,0,0,o,s,i,a),z.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Re.convert(t.format),_=Re.convert(t.type),v;t.isData3DTexture?(V.setTexture3D(t,0),v=R.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(V.setTexture2DArray(t,0),v=R.TEXTURE_2D_ARRAY):(V.setTexture2D(t,0),v=R.TEXTURE_2D),z.activeTexture(R.TEXTURE0),z.pixelStorei(R.UNPACK_FLIP_Y_WEBGL,t.flipY),z.pixelStorei(R.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),z.pixelStorei(R.UNPACK_ALIGNMENT,t.unpackAlignment);let y=z.getParameter(R.UNPACK_ROW_LENGTH),b=z.getParameter(R.UNPACK_IMAGE_HEIGHT),x=z.getParameter(R.UNPACK_SKIP_PIXELS),S=z.getParameter(R.UNPACK_SKIP_ROWS),C=z.getParameter(R.UNPACK_SKIP_IMAGES);z.pixelStorei(R.UNPACK_ROW_LENGTH,h.width),z.pixelStorei(R.UNPACK_IMAGE_HEIGHT,h.height),z.pixelStorei(R.UNPACK_SKIP_PIXELS,l),z.pixelStorei(R.UNPACK_SKIP_ROWS,u),z.pixelStorei(R.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=B.get(e),r=B.get(t),h=B.get(n.__renderTarget),g=B.get(r.__renderTarget);z.bindFramebuffer(R.READ_FRAMEBUFFER,h.__webglFramebuffer),z.bindFramebuffer(R.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,B.get(e).__webglTexture,i,d+n),R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,B.get(t).__webglTexture,a,m+n)),R.blitFramebuffer(l,u,o,s,f,p,o,s,R.DEPTH_BUFFER_BIT,R.NEAREST);z.bindFramebuffer(R.READ_FRAMEBUFFER,null),z.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||B.has(e)){let n=B.get(e),r=B.get(t);z.bindFramebuffer(R.READ_FRAMEBUFFER,k),z.bindFramebuffer(R.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):R.framebufferTexture2D(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,n.__webglTexture,i),T?R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):R.framebufferTexture2D(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,r.__webglTexture,a),i===0?T?R.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):R.copyTexSubImage2D(v,a,f,p,l,u,o,s):R.blitFramebuffer(l,u,o,s,f,p,o,s,R.COLOR_BUFFER_BIT,R.NEAREST);z.bindFramebuffer(R.READ_FRAMEBUFFER,null),z.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?R.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?R.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):R.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?R.texSubImage2D(R.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?R.compressedTexSubImage2D(R.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):R.texSubImage2D(R.TEXTURE_2D,a,f,p,o,s,g,_,h);z.pixelStorei(R.UNPACK_ROW_LENGTH,y),z.pixelStorei(R.UNPACK_IMAGE_HEIGHT,b),z.pixelStorei(R.UNPACK_SKIP_PIXELS,x),z.pixelStorei(R.UNPACK_SKIP_ROWS,S),z.pixelStorei(R.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps&&R.generateMipmap(v),z.unbindTexture()},this.initRenderTarget=function(e){B.get(e).__webglFramebuffer===void 0&&V.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?V.setTextureCube(e,0):e.isData3DTexture?V.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?V.setTexture2DArray(e,0):V.setTexture2D(e,0),z.unbindTexture()},this.resetState=function(){j=0,ee=0,M=null,z.reset(),ze.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return vr}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Gr._getDrawingBufferColorSpace(e),t.unpackColorSpace=Gr._getUnpackColorSpace()}};function yp(e,t,n,r,i,a){switch(e.save(),e.translate(n,r),e.fillStyle=a,e.strokeStyle=a,e.lineJoin=`round`,e.lineCap=`round`,e.beginPath(),t){case`block`:e.moveTo(-.72*i,-.78*i),e.lineTo(.72*i,-.78*i),e.lineTo(.72*i,-.05*i),e.quadraticCurveTo(.62*i,.6*i,0,.92*i),e.quadraticCurveTo(-.62*i,.6*i,-.72*i,-.05*i),e.closePath(),e.fill();break;case`slash`:e.arc(.55*i,.55*i,1.25*i,Math.PI*1.02,Math.PI*1.48),e.arc(.95*i,.95*i,1.35*i,Math.PI*1.44,Math.PI*1.06,!0),e.closePath(),e.fill(),e.lineWidth=i*.12,e.beginPath(),e.moveTo(-.15*i,.75*i),e.lineTo(.75*i,-.15*i),e.stroke();break;case`stab`:e.moveTo(0,-.95*i),e.lineTo(.42*i,-.3*i),e.lineTo(.14*i,-.3*i),e.lineTo(.14*i,.62*i),e.lineTo(.38*i,.62*i),e.lineTo(.38*i,.76*i),e.lineTo(.12*i,.76*i),e.lineTo(.12*i,.95*i),e.lineTo(-.12*i,.95*i),e.lineTo(-.12*i,.76*i),e.lineTo(-.38*i,.76*i),e.lineTo(-.38*i,.62*i),e.lineTo(-.14*i,.62*i),e.lineTo(-.14*i,-.3*i),e.lineTo(-.42*i,-.3*i),e.closePath(),e.fill();break;case`flourish`:{let t=.24;e.moveTo(0,-i),e.quadraticCurveTo(t*i,-.24*i,i,0),e.quadraticCurveTo(t*i,t*i,0,i),e.quadraticCurveTo(-.24*i,t*i,-i,0),e.quadraticCurveTo(-.24*i,-.24*i,0,-i),e.fill(),e.lineWidth=i*.1,e.beginPath(),e.arc(0,0,.62*i,-.4,.9),e.stroke(),e.beginPath(),e.arc(0,0,.62*i,Math.PI-.4,Math.PI+.9),e.stroke();break}}e.restore()}function Q(e,t){let n=parseInt(e.slice(1),16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${Math.max(0,Math.min(1,t))})`}var bp=e=>Math.max(0,Math.min(1,e)),xp=e=>1-(1-bp(e))**3,Sp=class{byId=new Map;record(e){if(e.kind===`holdEnd`||this.byId.has(e.noteId))return null;let t={judgement:e.judgement,time:e.time,offset:e.offset};return this.byId.set(e.noteId,t),t}get(e){return this.byId.get(e)}prune(e){for(let[t,n]of this.byId)n.time<e&&this.byId.delete(t)}};function Cp(e,t,n,r,i,a,o){let s=[];for(let c of e){if(c.removed)continue;let e=c.time-t;if(e>n||(c.endTime??c.time)<t-r-.5)continue;if(i.isHolding(c.id)){s.push({cue:c,stage:`holding`,tau:e,age:0});continue}if(i.isPending(c.id)){s.push({cue:c,stage:`incoming`,tau:e,age:0});continue}if(i.isVoid(c.id)){let n=o.get(c.id);n!==void 0&&t-n<r&&s.push({cue:c,stage:`void`,tau:e,age:Math.max(0,t-n)});continue}let l=a.get(c.id);l&&t-l.time<r&&s.push({cue:c,stage:l.judgement===`miss`?`miss`:`hit`,tau:e,age:Math.max(0,t-l.time),outcome:l})}return s.sort((e,t)=>e.cue.time-t.cue.time)}function wp(e,t){let n=0;return e.map(e=>{if(e.stage!==`incoming`)return 1;let r=n===0?1:t[n-1]??0;return n++,r})}function Tp(e,t,n,r,i){let a=null,o=1/0;for(let s of e){if(s.removed||!i.isPending(s.id))continue;let e=Math.abs(s.time-n);if(!(e>r)){if(s.lane===t)return null;e<o&&(a=s,o=e)}}return a}function Ep(e,t,n){return 1+(n-1)*bp(e/Math.max(1e-6,t))}function Dp(e,t,n,r,i){let a=bp(e/Math.max(1e-6,t)),o=n+i*a,s=r*a;return{x:Math.sin(o)*s,y:-Math.cos(o)*s}}function Op(e,t,n){let r=2*t,i=Math.max(1,Math.round(r/n)),a=i*2,o=(e%a+a)%a,s=o<=i?o:a-o;return-t+s/i*r}function kp(e,t,n,r){return r+(n-r)*(e/Math.max(1e-6,t))}function Ap(e,t){return e<0||e>=t?0:(1-e/t)**2}function jp(e,t){return e<t?0:e-t}var Mp={block:`square`,slash:`diamond`,stab:`triangle`,flourish:`circle`},Np={block:1,slash:1,stab:1,flourish:1.22};function Pp(e,t,n,r,i){switch(e.beginPath(),Mp[t]){case`square`:e.roundRect(n-i*.86,r-i*.86,i*1.72,i*1.72,i*.32);break;case`diamond`:e.moveTo(n,r-i*1.12),e.lineTo(n+i*1.12,r),e.lineTo(n,r+i*1.12),e.lineTo(n-i*1.12,r),e.closePath();break;case`triangle`:e.moveTo(n-i*1.08,r-i*.78),e.lineTo(n+i*1.08,r-i*.78),e.lineTo(n,r+i*1.12),e.closePath();break;case`circle`:e.arc(n,r,i,0,Math.PI*2)}}function Fp(e,t,n,r,i,a){let o=a.alpha??1;if(o<=.01||i<=.5)return;let s=a.wrong??0;s>0&&(n+=Math.sin(s*40)*i*.25*s);let c=a.dead?`#5d6b63`:I[t].color,l=i*Np[t];e.save(),e.globalAlpha=o,e.shadowColor=c,e.shadowBlur=(a.glow??14)*+!a.dead,Pp(e,t,n,r,l),e.fillStyle=c,e.fill(),e.shadowBlur=0,e.lineWidth=Math.max(1.5,l*(.13+s*.12)),e.strokeStyle=a.dead?`#2a312d`:s>.05?`#ff3b5c`:`#ffffff`,e.stroke();let u=Mp[t]===`triangle`?r-l*.18:r;if(yp(e,t,n,u,l*(Mp[t]===`triangle`?.42:.5),`#04140a`),a.flash&&a.flash>0&&(e.globalAlpha=o*Math.min(1,a.flash),Pp(e,t,n,r,l*1.04),e.fillStyle=`#ffffff`,e.fill()),a.key){e.globalAlpha=o;let t=Math.max(7,l*.36),i=r+l*1.12+t*.9;e.fillStyle=`rgba(0,10,4,0.85)`,e.strokeStyle=c,e.lineWidth=1.5,e.beginPath(),e.roundRect(n-t,i-t,t*2,t*2,t*.35),e.fill(),e.stroke(),e.fillStyle=a.dead?`#8a958f`:`#ffffff`,e.font=`bold ${Math.round(t*1.35)}px monospace`,e.textAlign=`center`,e.textBaseline=`middle`,e.fillText(a.key,n,i+1)}e.restore()}function Ip(e,t,n,r,i,a,o){let s=Math.min(1,a/o);s>=1||(e.save(),e.translate(n,r+a*a*900),e.rotate(s*.9),Fp(e,t,0,0,i*(1-.3*s),{alpha:1-s,dead:!0,glow:0}),e.restore())}function Lp(e,t,n,r,i,a){if(!(a<=0)){e.save(),e.globalCompositeOperation=`lighter`,e.strokeStyle=Q(i,a),e.lineCap=`round`;for(let i=0;i<12;i++){let o=i/12*Math.PI*2+i%2*.13,s=r*(.55+(1-a)*.9),c=s+r*(i%2?.5:.85)*a;e.lineWidth=Math.max(1,r*.09*a),e.beginPath(),e.moveTo(t+Math.cos(o)*s,n+Math.sin(o)*s),e.lineTo(t+Math.cos(o)*c,n+Math.sin(o)*c),e.stroke()}e.globalAlpha=a*.85,e.fillStyle=`#ffffff`,e.beginPath(),e.arc(t,n,r*.42*(.6+.4*a),0,Math.PI*2),e.fill(),e.restore()}}var Rp=class{list=[];burst(e,t,n,r,i,a=4){for(let o=0;o<r;o++){let r=Math.random()*Math.PI*2,o=i*(.35+Math.random()*.75);this.list.push({x:e,y:t,vx:Math.cos(r)*o,vy:Math.sin(r)*o-i*.25,rot:Math.random()*6,vr:(Math.random()-.5)*18,size:a*(.6+Math.random()*.8),life:0,max:.3+Math.random()*.3,color:Math.random()<.25?`#ffffff`:n,gravity:i*2.2})}}crack(e,t,n,r){for(let i of[-1,1])this.list.push({x:e+i*r*.15,y:t,vx:i*(60+Math.random()*40),vy:-90-Math.random()*40,rot:0,vr:i*(3+Math.random()*2),size:r,life:0,max:.55,color:`#5d6b63`,gravity:900,half:{action:n,side:i,r}});for(let n=0;n<7;n++){let n=-Math.PI/2+(Math.random()-.5)*2.2,r=80+Math.random()*120;this.list.push({x:e,y:t,vx:Math.cos(n)*r,vy:Math.sin(n)*r,rot:0,vr:0,size:2.5,life:0,max:.25+Math.random()*.2,color:`#ff3b5c`,gravity:500})}}update(e){for(let t=this.list.length-1;t>=0;t--){let n=this.list[t];n.life+=e,n.life>=n.max?this.list.splice(t,1):(n.vy+=n.gravity*e,n.x+=n.vx*e,n.y+=n.vy*e,n.rot+=n.vr*e)}}draw(e){e.save();for(let t of this.list){let n=1-t.life/t.max;if(t.half){let{action:r,side:i,r:a}=t.half;e.save(),e.translate(t.x,t.y),e.rotate(t.rot),e.beginPath(),e.rect(i<0?-a*2:0,-a*2,a*2,a*4),e.clip(),Fp(e,r,0,0,a,{alpha:n,dead:!0,glow:0}),e.restore();continue}e.globalAlpha=n,e.fillStyle=t.color,e.save(),e.translate(t.x,t.y),e.rotate(t.rot);let r=t.size*(.5+.5*n);e.fillRect(-r/2,-r/2,r,r),e.restore()}e.restore()}clear(){this.list.length=0}};function zp(e,t,n,r,i,a){let o=(n-(_.length*92+(_.length-1)*8))/2,s=r-34-18;e.save(),e.textBaseline=`middle`,_.forEach((n,r)=>{let c=I[n].color,l=o+r*100,u=a.held[r]?1:Ap(t-a.pressAt[r],.15),d=Ap(t-a.hitAt[r],.25),f=u*3;e.fillStyle=d>0?Q(c,.25+.5*d):u>0?Q(c,.28):`rgba(0,10,4,0.7)`,e.strokeStyle=Q(c,.55+.45*Math.max(u,d)),e.lineWidth=u>.5?2.5:1.25,e.beginPath(),e.roundRect(l,s-f,92,34,7),e.fill(),e.stroke(),e.fillStyle=u>.5||d>.3?`#ffffff`:c,e.font=`bold 17px monospace`,e.textAlign=`center`,e.fillText(Pt(i[r]??``),l+15,s+17-f+1),Fp(e,n,l+38,s+17-f,8,{glow:0}),e.font=`bold 10px monospace`,e.textAlign=`left`,e.fillStyle=Q(c,.95),e.fillText(I[n].label,l+51,s+17-f+1)}),e.restore()}function Bp(e,t,n,r,i){i<=0||(e.save(),e.globalCompositeOperation=`lighter`,e.fillStyle=Q(r,i),e.fillRect(0,0,t,n),e.restore())}var $={bg:`#000000`,green:`#39ff6a`,greenDim:`#0b3d18`,greenMid:`#1a8f3c`,white:`#e6ffe9`,danger:`#ff3b5c`,parry:`#7dfcff`,judgement:{perfect:`#e6ffe9`,great:`#39ff6a`,good:`#b6ff3b`,miss:`#ff3b5c`}},Vp={laneWidth:1.05,heroZ:.45,hitDistance:1.6,highwayLength:17,duelDistance:3,enterDistance:9,cueDepth:.5,cueTiltDeg:35},Hp={fov:52,position:[0,6.1,4.4],lookAt:[0,.2,-3.7],shakeOnHit:.25,kickPulseFov:1.4},Up={judgementTextLife:.45,laneFlashLife:.15},Wp={skin:`#f4d6bf`,hair:`#f7da5e`,hairShade:`#d9a933`,outfit:`#565c9e`,outfitDark:`#343873`,leather:`#a8744a`,metal:`#a9b2bc`,metalDark:`#555c66`,eyes:`#3fb8a8`,blade:`#c3cbd4`,materia:`#39ff6a`,scale:.92},Gp={hitGlow:.35,hitGlowDecay:.12,materiaGlow:.2,materiaCutoffGlow:.5,reachAmount:.25,arcAmount:.3,followAmount:1,lungeAmount:.4,echoMax:3,echoOpacity:.16,echoSpreadAmount:.35,echoDelayAmount:.6,grindSparks:10},Kp={hitStop:.05,shudder:.05,knockback:.09,overshoot:1.4,flash:.5,flashDecay:.14},qp={fontSize:16,opacity:.22,speed:14,glyphs:`アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789:.=*+-<>¦`},Jp={lifetime:.13,maxSamples:48,opacity:.32,innerEdge:.45,jitter:.03,smearSamples:10},Yp={initialScale:1,minScale:.5,maxScale:1,lowFps:48,highFps:58},Xp={position:[2.1,4.5,4.1],lookAt:[-.28,1.3,-3],fov:40},Zp={chest:new K(0,1.16,.3),core:new K(0,1.24,.12),weapon:new K(-.3,2.5,-.25),slash:new K(0,1.17,.3),feet:new K(0,.03,0),head:new K(0,1.9,.2)},Qp=new K,$p=.14,em=.5,tm=.13,nm={perfect:`PERFECT`,great:`GREAT`,good:`GOOD`,miss:`MISS`},rm=e=>1-(1-e)*(1-e);function im(e,t){return e<1.2?t*(1.2/e)**.6:t}var am=class{ctx;opts;outcomes=new Sp;voidedAt=new Map;shards=new Rp;held=[!1,!1,!1,!1];pressAt=[-10,-10,-10,-10];hitAt=[-10,-10,-10,-10];onOutcome=null;onPress=null;wrongAt=new Map;now=0;punchAt=-10;punchAmt=0;flashAt=-10;flashColor=`#ffffff`;flashAmt=0;pops=[];off=[];linger;constructor(e,t={}){this.ctx=e,this.opts=t,this.linger=t.linger??.5;let{session:n,chart:r,sfx:i}=e;this.off.push(n.bus.on(`input`,e=>{if(e.lane<0||e.lane>3||(this.held[e.lane]=e.down,!e.down))return;this.pressAt[e.lane]=this.now;let t=r.lanes[e.lane];i.swing(t);let a=Tp(n.conductor.cues,e.lane,e.time,tm,n.judge);a&&(this.wrongAt.set(a.id,this.now),i.clank()),this.onPress?.(t,this.now)}),n.bus.on(`judgement`,e=>this.onJudgement(e)),n.bus.on(`cuesDropped`,e=>{for(let t of e)this.voidedAt.set(t,this.now)}))}onJudgement(e){let t=this.outcomes.record(e);if(!t)return;let n=this.ctx.session.conductor.cues[e.noteId];n&&(t.judgement!==`miss`&&(this.hitAt[n.lane]=this.now),this.onOutcome?.({cue:n,outcome:t}))}staged(e,t){return Cp(this.ctx.session.conductor.cues,e,t,this.linger,this.ctx.session.judge,this.outcomes,this.voidedAt)}wrongShake(e,t){let n=this.wrongAt.get(e);return n===void 0?0:Ap(t-n,.3)}punch(e){let t=Ap(this.now-this.punchAt,$p)*this.punchAmt;this.punchAt=this.now,this.punchAmt=Math.max(e,t)}flash(e,t){this.flashAt=this.now,this.flashColor=e,this.flashAmt=t}react(e,t){if(t.judgement===`miss`)return;let n=t.judgement===`perfect`;this.punch(n?1:t.judgement===`great`?.55:.3),n&&this.flash(I[e].color,e===`flourish`?.22:.12)}update(e,t){this.now=e,this.shards.update(t),this.outcomes.prune(e-5);let n=this.ctx.camera,r=this.opts.framing,i=Ap(e-this.punchAt,$p)*this.punchAmt;if(r){let[e,t,i]=Hp.position,a=Qp.set(n.position.x-e,n.position.y-t,n.position.z-i),o=im(n.aspect,Hp.fov)-n.fov;n.position.set(...r.position).addScaledVector(a,.6),n.lookAt(...r.lookAt),n.fov=im(n.aspect,r.fov)-o}if(i>0){let e=Qp.set(0,0,-1).applyQuaternion(n.quaternion);n.position.addScaledVector(e,i*.28),n.fov-=i*1.6}n.updateProjectionMatrix()}pop(e,t,n){this.pops.push({x:e,y:t,o:n,at:this.now}),this.pops.length>6&&this.pops.shift()}drawPops(e,t){e.save(),e.textAlign=`center`,e.textBaseline=`middle`;for(let n of this.pops){let r=t-n.at;if(r<0||r>em)continue;let i=r/em,a=n.o.judgement,o=$.judgement[a],s=a===`perfect`?1+.35*Ap(r,.12):1;e.globalAlpha=Math.min(1,(1-i)*2.2),e.font=`bold ${Math.round((a===`miss`?20:22)*s)}px monospace`,e.fillStyle=o,e.shadowColor=o,e.shadowBlur=12;let c=n.y-34-rm(i)*26;e.fillText(nm[a],n.x,c),e.shadowBlur=0,a!==`miss`&&a!==`perfect`&&n.o.offset!==0&&(e.font=`bold 11px monospace`,e.fillText(n.o.offset<0?`EARLY`:`LATE`,n.x,c+17))}e.restore()}drawCombo(e,t,n){let r=this.ctx.session.score.combo;if(r<4)return;e.save(),e.textAlign=`left`,e.textBaseline=`middle`;let i=1+.25*Ap(this.now-Math.max(...this.hitAt),.12);e.font=`bold ${Math.round(34*i)}px monospace`,e.fillStyle=`rgba(230,255,233,0.9)`,e.fillText(String(r),t,n),e.font=`11px monospace`,e.fillStyle=`rgba(57,255,106,0.85)`,e.fillText(`COMBO`,t+2,n+24),e.restore()}drawOverlay(e,t,n,r,i=!0){this.shards.draw(e),this.drawPops(e,t),Bp(e,n,r,this.flashColor,Ap(t-this.flashAt,.1)*this.flashAmt),i&&zp(e,t,n,r,this.ctx.keys,this)}enemySpot(e,t=new K){let n=this.ctx.arena.enemyRig();return n?om(n,Zp[e],t):null}screenAt(e){let t=this.ctx.arena.toScreen(e),n=Qp.setFromMatrixColumn(this.ctx.camera.matrixWorld,0),r=this.ctx.arena.toScreen(e.clone().add(n));return{x:t.x,y:t.y,ppu:Math.hypot(r.x-t.x,r.y-t.y)}}dispose(){this.off.forEach(e=>e()),this.shards.clear(),this.pops.length=0}};function om(e,n,r=new K){let i=t[e.kind].scale;return e.root.updateMatrixWorld(!0),e.root.localToWorld(r.copy(n).multiplyScalar(i))}var sm={block:{spot:`weapon`,r:.42},slash:{spot:`slash`,r:.62},stab:{spot:`core`,r:.19},flourish:{spot:`feet`,r:.85}},cm=3.2,lm=[.34,.14],um={perfect:.055,other:.03},dm=.2,fm=.42,pm=.32,mm=.16;function hm(e,t,n){e.beginPath(),e.ellipse(t.x,t.y,Math.max(.5,t.r*n),Math.max(.5,t.ry*n),t.rot,0,Math.PI*2)}var gm=new K,_m=new K,vm=class{ctx;stage;approach=1;impacts=[];ripples=[];constructor(e){this.ctx=e,this.stage=new am(e,{framing:Xp,linger:fm}),this.stage.onOutcome=({cue:e,outcome:t})=>{this.stage.react(e.action,t);let n=this.shapeFor(e.action);if(!n)return;let r=I[e.action].color;if(this.stage.pop(n.x-n.r-56,n.y+10,t),t.judgement===`miss`){this.stage.shards.burst(n.x,n.y,`#5d6b63`,6,120,3);return}let i=t.judgement===`perfect`;this.impacts.push({x:n.x,y:n.y,r:Math.max(26,n.r*1.2),color:r,at:this.stage.now}),this.stage.shards.burst(n.x,n.y,r,i?22:12,i?420:300,5)},this.stage.onPress=(e,t)=>{this.ripples.push({action:e,at:t}),this.ripples.length>8&&this.ripples.shift()}}update(e,t,n){this.approach=n,this.stage.update(e,t)}shapeFor(e){let n=this.ctx.arena.enemyRig();if(!n)return null;let r=sm[e],i=this.stage.enemySpot(r.spot,gm);if(!i)return null;let a=t[n.kind].scale*n.root.scale.x,o=r.r*a,s=this.stage.screenAt(i);if(e===`flourish`){let e=this.ctx.arena.toScreen(_m.copy(i).add(new K(o,0,0))),t=this.ctx.arena.toScreen(_m.copy(i).add(new K(0,0,o))),n=Math.abs(e.x-s.x),r=Math.max(4,Math.abs(t.y-s.y));return{x:s.x,y:s.y,r:n,ry:r,rot:0,ix:s.x,iy:s.y+r,ir:13}}if(e===`slash`){let e=new K(Math.cos(.6),Math.sin(.6),0).multiplyScalar(o),t=this.ctx.arena.toScreen(_m.copy(i).add(e)),n=Math.atan2(t.y-s.y,t.x-s.x),r=Math.hypot(t.x-s.x,t.y-s.y);return{x:s.x,y:s.y,r,ry:r*pm,rot:n,ix:s.x+Math.cos(n)*r*.62,iy:s.y+Math.sin(n)*r*.62-r*.34,ir:Math.max(9,r*.2)}}let c=o*s.ppu;return{x:s.x,y:s.y,r:c,ry:c,rot:0,ix:s.x,iy:s.y,ir:Math.max(8,c*(e===`stab`?.75:.5))}}drawHud(e,t,n,r){let i=this.stage.staged(t,this.approach),a=wp(i,lm);this.drawRipples(e,t),this.drawFollowPoints(e,i,a);let o=i.map((e,t)=>({s:e,a:a[t]})).reverse();for(let{s:n,a:r}of o)this.drawCue(e,n,r,t);for(let n=this.impacts.length-1;n>=0;n--){let r=this.impacts[n],i=Ap(t-r.at,.18);i<=0&&t-r.at>.18?this.impacts.splice(n,1):Lp(e,r.x,r.y,r.r,r.color,i)}let s=this.shapeFor(`stab`);s&&this.stage.drawCombo(e,s.x+Math.max(110,n*.12),s.y+30),this.stage.drawOverlay(e,t,n,r)}drawRipples(e,t){for(let n of this.ripples){let r=Ap(t-n.at,mm);if(r<=0)continue;let i=this.shapeFor(n.action);i&&(e.save(),e.globalAlpha=.3*r,e.fillStyle=I[n.action].color,hm(e,i,1.05-.1*r),e.fill(),e.restore())}}drawFollowPoints(e,t,n){let r=null;e.save(),e.fillStyle=`#e6ffe9`,t.forEach((t,i)=>{let a=n[i];if(t.stage!==`incoming`||a<=.01)return;let o=this.shapeFor(t.cue.action);if(o){if(r&&Math.hypot(o.x-r.x,o.y-r.y)>30)for(let t=1;t<5;t++){let n=t/5;e.globalAlpha=a*.9,e.beginPath(),e.arc(r.x+(o.x-r.x)*n,r.y+(o.y-r.y)*n,2.2,0,Math.PI*2),e.fill()}r=o}}),e.restore()}drawCue(e,t,n,r){if(n<=.01)return;let i=t.cue.action,a=this.shapeFor(i);if(!a)return;let o=this.stage.wrongShake(t.cue.id,r),s=o>0?Math.sin(o*40)*6*o:0,c={...a,x:a.x+s,ix:a.ix+s},l=I[i].color;if(e.save(),t.stage===`incoming`||t.stage===`holding`){let a=this.approach,s=bp((a-t.tau)/(a*.4)),u=t.stage===`holding`?1:Math.max(.86,Ep(t.tau,a,cm)-(t.tau<0?-t.tau*1.2:0)),d=bp(1-t.tau/a);if(this.drawTarget(e,i,c,n*s,+(t.stage===`holding`),r),o>.05&&n>=1&&(e.globalAlpha=o,e.strokeStyle=`#ff3b5c`,e.lineWidth=5,hm(e,c,1.08),e.stroke()),t.stage===`incoming`)e.globalAlpha=n*s*(.35+.65*d),e.strokeStyle=l,e.shadowColor=l,e.shadowBlur=n>=1?10:0,e.lineWidth=n>=1?2.5+2.5*d:2,hm(e,c,u),e.stroke();else if(t.cue.endTime!==null){let n=bp((r-t.cue.time)/(t.cue.endTime-t.cue.time));e.globalAlpha=1,e.strokeStyle=`#ffffff`,e.lineWidth=5,e.beginPath(),e.ellipse(c.x,c.y,c.r*1.15,c.ry*1.15,c.rot,-Math.PI/2,-Math.PI/2+n*Math.PI*2),e.stroke()}}else if(t.stage===`hit`){let n=t.outcome?.judgement===`perfect`?um.perfect:um.other,r=jp(t.age,n),i=xp(r/dm);if(r<dm){let r=t.age<n;e.globalAlpha=(1-i)*(r?.85:.6),e.fillStyle=r?`#ffffff`:l,hm(e,c,1+i*.3),e.fill(),e.globalAlpha=1-i,e.lineWidth=4*(1-i)+1,e.strokeStyle=`#ffffff`,e.shadowColor=l,e.shadowBlur=18,e.stroke()}}else{let n=bp(t.age/fm);e.globalAlpha=1-n,e.lineWidth=3,e.strokeStyle=t.stage===`miss`?`#ff3b5c`:`#5d6b63`;for(let t=0;t<4;t++){let r=t/4*Math.PI*2+.2,i=r+Math.PI/4,a=Math.cos(i)*n*26,o=Math.sin(i)*n*14+n*n*120;e.beginPath(),e.ellipse(c.x+a,c.y+o,c.r,c.ry,c.rot,r,r+Math.PI/2-.25),e.stroke()}}e.restore()}drawTarget(e,t,n,r,i,a){if(r<=.01)return;let o=I[t].color,s=r>=.99;if(e.globalAlpha=r,hm(e,n,1),e.fillStyle=t===`flourish`?Q(o,.16+i*.2):`rgba(0,8,3,0.32)`,e.fill(),e.lineWidth=s?4:2.5,e.strokeStyle=o,e.shadowColor=o,e.shadowBlur=s?16:0,e.stroke(),e.shadowBlur=0,e.lineWidth=1.2,e.strokeStyle=Q(`#ffffff`,.7),hm(e,n,.86),e.stroke(),t===`slash`&&(e.lineWidth=2.5,e.strokeStyle=`#ffffff`,e.beginPath(),e.moveTo(n.x-Math.cos(n.rot)*n.r*.95,n.y-Math.sin(n.rot)*n.r*.95),e.lineTo(n.x+Math.cos(n.rot)*n.r*.95,n.y+Math.sin(n.rot)*n.r*.95),e.stroke()),t===`block`){let t=Math.sin(a*20)*1.5;e.fillStyle=o,e.beginPath(),e.moveTo(n.x-7,n.y-n.r-6+t),e.lineTo(n.x+7,n.y-n.r-6+t),e.lineTo(n.x,n.y-n.r+2+t),e.closePath(),e.fill()}e.fillStyle=`rgba(0,10,4,0.85)`,e.beginPath(),e.arc(n.ix,n.iy,n.ir*1.25,0,Math.PI*2),e.fill(),e.lineWidth=1.5,e.strokeStyle=o,e.stroke(),yp(e,t,n.ix,n.iy-n.ir*.12,n.ir*.62,o);let c=Pt(this.ctx.keys[_.indexOf(t)]??``);e.font=`bold ${Math.round(Math.max(10,n.ir*.85))}px monospace`,e.textAlign=`center`,e.textBaseline=`middle`,e.fillStyle=`#ffffff`,e.fillText(c,n.ix+n.ir*1.25,n.iy+n.ir*1)}dispose(){this.stage.dispose(),this.impacts.length=0,this.ripples.length=0}},ym={key:`approach-ring`,label:`APPROACH RING · ON THE ENEMY`,tagline:`No lanes: a ring shrinks onto the spot of the enemy you must hit and closes on the beat.`,hypothesis:`An osu!-style approach ring anchored on the enemy (weapon = block, chest cut line = slash, core = stab, feet = flourish) is the most readable timing cue there is, and putting it on the body makes reading the cue the same as reading the fight: timing accuracy and readability rise over the 4-lane baseline.`,inspiration:[`osu!`,`Rhythm Heaven`,`Sekiro (deflect timing)`],howTo:[`A ring shrinks onto a spot on the enemy. Press as it closes onto the target.`,`Weapon raised = A BLOCK · cut line on the chest = S SLASH · glowing core = D STAB · ring at its feet = F FLOURISH.`,`Faint rings show the next cues, so you can read the rhythm ahead.`],options:{musicMapping:`instruments`,highway:!1,laneLabels:!1,enemyIcon:!1,judgementHud:!1,approachSeconds:1.15,keyLegend:`A S D F`},create:e=>new vm(e)},bm={key:`baseline`,label:`BASELINE · 4 LANES`,tagline:`The current game: four lanes on the floor, cues scroll to a hit line.`,hypothesis:`Control condition. The 4-lane floor highway with the INSTRUMENTS mapping is the reference every other experiment is rated against.`,inspiration:[`Guitar Hero`,`Thumper`],howTo:[`Cues scroll down four lanes toward the line in front of you.`,`Press the lane’s key as a cue reaches the line: A block · S slash · D stab · F flourish.`,`Gold measures are boss combos: miss once and the measure repeats.`],options:{musicMapping:`instruments`,keyLegend:`A S D F`}},xm=Math.PI/180,Sm=78*xm,Cm=26*xm,wm=.55,Tm=.4,Em=23,Dm={perfect:.055,other:.03},Om=.24,km=.5,Am=12,jm=46,Mm=class{ctx;stage;approach=1;impacts=[];target=null;lastTarget={x:0,y:0,ppu:100};orbit=[];offDuel;constructor(e){this.ctx=e,this.stage=new am(e,{framing:Xp,linger:km}),this.stage.onOutcome=({cue:e,outcome:t})=>{this.stage.react(e.action,t);let n=this.lastTarget;if(this.stage.pop(n.x-95,n.y+10,t),t.judgement===`miss`){this.stage.shards.crack(n.x,n.y,e.action,Em),this.scatterOrbit(`#5d6b63`,160);return}this.orbit.push({action:e.action,at:this.stage.now}),this.orbit.length>Am&&this.orbit.shift();let r=I[e.action].color,i=t.judgement===`perfect`;this.impacts.push({x:n.x,y:n.y,r:i?46:34,color:r,at:this.stage.now}),this.stage.shards.burst(n.x,n.y,r,i?24:14,i?440:320,5)},this.offDuel=e.session.bus.on(`duel`,e=>{e.type===`defeated`?this.scatterOrbit(null,520):(e.type===`enemyEnter`||e.type===`escaped`)&&(this.orbit.length=0)})}scatterOrbit(e,t){let n=this.lastTarget;this.orbit.forEach((r,i)=>{let a=this.orbitPos(i,this.stage.now,n.x,n.y);this.stage.shards.burst(a.x,a.y,e??I[r.action].color,4,t,5)}),this.orbit.length=0}orbitPos(e,t,n,r){let i=this.orbit[e],a=xp((t-i.at)/.15),o=e/Am*Math.PI*2+t*1.3,s=jm*a;return{x:n+Math.cos(o)*s,y:r+Math.sin(o)*s*.8}}update(e,t,n){this.approach=n,this.stage.update(e,t)}drawHud(e,t,n,r){let i=this.stage.enemySpot(`chest`);this.target=i?this.stage.screenAt(i):null,this.target&&(this.lastTarget=this.target);let a=this.lastTarget,o=r*Tm,s=this.stage.staged(t,this.approach);this.target&&(this.drawBeatRings(e,t,a.x,a.y,o),this.drawReticle(e,t,a.x,a.y,s)),this.target&&this.orbit.forEach((n,r)=>{let i=this.orbitPos(r,t,a.x,a.y);Fp(e,n.action,i.x,i.y,6,{glow:6})});for(let n=s.length-1;n>=0;n--)this.drawCue(e,s[n],t,a.x,a.y,o);for(let n=this.impacts.length-1;n>=0;n--){let r=this.impacts[n];t-r.at>.2?this.impacts.splice(n,1):Lp(e,r.x,r.y,r.r,r.color,Ap(t-r.at,.2))}this.target&&this.stage.drawCombo(e,a.x+70,a.y+Math.max(110,r*.17)),this.stage.drawOverlay(e,t,n,r)}drawBeatRings(e,t,n,r,i){let a=this.approach,o=this.ctx.chart.beatsPerBar;e.save();for(let s of this.ctx.session.conductor.plays){if(s.start>t+a)break;if(!(s.start+s.dur<t))for(let c=0;c<o;c++){let l=s.start+s.dur*c/o-t;if(l<=.02||l>a)continue;let u=l/a;e.globalAlpha=(c===0?.3:.14)*(1-u*.6)*bp((a-l)/(a*.25)),e.strokeStyle=s.combo?`#ffd23b`:`#c8ffd8`,e.lineWidth=c===0?2:1,e.beginPath(),e.arc(n,r,i*u,0,Math.PI*2),e.stroke()}}e.restore()}drawReticle(e,t,n,r,i){let a=i.find(e=>e.stage===`incoming`),o=this.ctx.session.conductor.beatAt(t),s=(1-(o-Math.floor(o)))**4,c=Math.max(...this.stage.pressAt.map(e=>Ap(t-e,.12))),l=a?I[a.cue.action].color:`#c8ffd8`,u=a?bp(1-a.tau/.5):0,d=27+s*3+c*6;e.save(),e.fillStyle=`rgba(0,10,4,0.3)`,e.beginPath(),e.arc(n,r,d,0,Math.PI*2),e.fill(),e.globalAlpha=.75+.25*u,e.strokeStyle=u>0?Q(l,1):`rgba(230,255,233,0.85)`,e.lineWidth=2.5+u*1.5,e.shadowColor=l,e.shadowBlur=8+u*10,e.beginPath(),e.arc(n,r,d,0,Math.PI*2),e.stroke(),e.shadowBlur=0;for(let t=0;t<4;t++){let i=t*Math.PI/2+Math.PI/4;e.beginPath(),e.moveTo(n+Math.cos(i)*(d+4),r+Math.sin(i)*(d+4)),e.lineTo(n+Math.cos(i)*(d+11),r+Math.sin(i)*(d+11)),e.stroke()}e.restore()}drawCue(e,t,n,r,i,a){let o=this.approach,s=t.cue.action,c=Op(t.cue.id,Sm,Cm),l=Pt(this.ctx.keys[_.indexOf(s)]??``),u=I[s].color;if(t.stage===`incoming`||t.stage===`holding`){let d=t.stage===`holding`?0:Math.max(0,t.tau),f=Dp(d,o,c,a,wm),p=bp(d/o),m=bp((o-t.tau)/(o*.18)),h=Em*(.75+.35*(1-p)),g=t.tau<0?.5+.5*Math.sin(n*60):1,_=Dp(Math.min(o,d+.12),o,c,a,wm),v=e.createLinearGradient(r+_.x,i+_.y,r+f.x,i+f.y);v.addColorStop(0,Q(u,0)),v.addColorStop(1,Q(u,.55*m)),e.save(),e.strokeStyle=v,e.lineWidth=h*.9,e.lineCap=`round`,e.beginPath(),e.moveTo(r+_.x,i+_.y),e.lineTo(r+f.x,i+f.y),e.stroke(),e.restore(),Fp(e,s,r+f.x,i+f.y,h,{alpha:m*g,key:p<.85?l:void 0,wrong:this.stage.wrongShake(t.cue.id,n)});return}if(t.stage===`hit`){let n=t.outcome?.judgement===`perfect`?Dm.perfect:Dm.other,a=jp(t.age,n);if(a>=Om)return;let o=xp(a/Om);Fp(e,s,r,i,Em*(1.15+o*.9),{alpha:1-o,flash:+(t.age<n)});return}if(t.stage===`void`){let n=Dp(Math.max(0,t.tau+t.age),o,c,a,wm);Ip(e,s,r+n.x,i+n.y,Em,t.age,km);return}let d=bp(t.age/km);e.save(),e.globalAlpha=Math.max(0,.6-d*3),e.strokeStyle=`#ff3b5c`,e.lineWidth=3,e.beginPath(),e.moveTo(r-10,i-10),e.lineTo(r+10,i+10),e.moveTo(r+10,i-10),e.lineTo(r-10,i+10),e.stroke(),e.restore()}dispose(){this.offDuel(),this.stage.dispose(),this.impacts.length=0,this.orbit.length=0}},Nm={key:`converge`,label:`CONVERGE · BADGES ONTO THE ENEMY`,tagline:`No lanes: cue badges fly in from around the enemy and land on its chest on the beat.`,hypothesis:`When every cue badge flies into the enemy and lands on its chest exactly on the hit time, timing and fiction coincide and the eyes never leave the fight: fun and music connection rise over the 4-lane baseline without losing readability.`,inspiration:[`Rhythm Heaven`,`Sayonara Wild Hearts`,`Thumper`],howTo:[`Badges fly in from around the enemy and land on its chest. Press as one lands.`,`The badge says which key: A blue shield BLOCK · S green diamond SLASH · D amber arrow STAB · F pink star FLOURISH.`,`The faint circles closing in are beats: badges on the same circle land together.`],options:{musicMapping:`instruments`,highway:!1,laneLabels:!1,enemyIcon:!1,judgementHud:!1,approachSeconds:1.5,keyLegend:`A S D F`},create:e=>new Mm(e)};function Pm(e,t=3){return Number.isFinite(e)?(1-(e-Math.floor(e)))**t:0}function Fm(e){return Number.isFinite(e)?e-Math.floor(e):0}function Im(e,t){if(!Number.isFinite(e)||!Number.isFinite(t)||t<=e)return null;let n=Math.floor(t);return n>Math.floor(e)?n:null}var Lm=class{mesh;samples=[];pos;col;geo;color=new J;stepped=0;alpha=1;busy=!1;constructor(e){let t=Jp.maxSamples;this.pos=new Float32Array(t*2*3),this.col=new Float32Array(t*2*4),this.geo=new Ra,this.geo.setAttribute(`position`,new Ca(this.pos,3)),this.geo.setAttribute(`color`,new Ca(this.col,4));let n=[];for(let e=0;e<t-1;e++){let t=e*2;n.push(t,t+1,t+2,t+1,t+3,t+2)}this.geo.setIndex(n),this.mesh=new Y(this.geo,new go({vertexColors:!0,transparent:!0,side:2,depthWrite:!1,blending:2})),this.mesh.frustumCulled=!1,e.add(this.mesh)}setColor(e,t=0,n=.6){this.color.set(e);let r={h:0,s:0,l:0};this.color.getHSL(r),this.color.setHSL((r.h+t/360+1)%1,1,n)}push(e,t,n){let r=this.samples[this.samples.length-1];if(r&&n<r.at)return;let i=this.stepped,a=()=>(Math.random()-.5)*i;this.samples.push({b:e.clone().add(new K(a(),a(),a())),t:t.clone().add(new K(a(),a(),a())),at:n}),this.samples.length>Jp.maxSamples&&this.samples.shift()}update(e){for(;this.samples.length&&e-this.samples[0].at>Jp.lifetime;)this.samples.shift();let t=this.samples;for(let n=0;n<t.length;n++){let{b:r,t:i,at:a}=t[n],o=Math.max(0,1-(e-a)/Jp.lifetime),s=o*o*Jp.opacity*this.alpha;this.pos.set([r.x,r.y,r.z,i.x,i.y,i.z],n*6);let{r:c,g:l,b:u}=this.color;this.col.set([c,l,u,0,c,l,u,s],n*8)}this.geo.setDrawRange(0,Math.max(0,(t.length-1)*6)),this.geo.attributes.position.needsUpdate=!0,this.geo.attributes.color.needsUpdate=!0,t.length||(this.busy=!1)}},Rm=class{max;mesh;p=[];v=[];life=[];size=[];next=0;m=new si;q=new Rr;s=new K;constructor(e,t=900){this.max=t,this.mesh=new zo(new cs(.11,.11,.11),new go,t),this.mesh.instanceMatrix.setUsage(_r),this.mesh.frustumCulled=!1,this.mesh.renderOrder=5;for(let e=0;e<t;e++)this.p.push(new K),this.v.push(new K),this.life.push(0),this.size.push(1),this.mesh.setColorAt(e,new J(0));e.add(this.mesh)}burst(e,t,n,r,i=new K(0,0,-1),a=1){let o=new J(t);for(let t=0;t<n;t++){let t=this.next;this.next=(this.next+1)%this.max,this.p[t].copy(e),this.v[t].set((Math.random()-.5)*r+i.x*r*.6,Math.random()*r*.9+1+i.y*r*.6,(Math.random()-.5)*r+i.z*r*.6),this.life[t]=.4+Math.random()*.5,this.size[t]=a*(.6+Math.random()*.8),this.mesh.setColorAt(t,Math.random()<.2?new J($.white):o)}this.mesh.instanceColor&&(this.mesh.instanceColor.needsUpdate=!0)}update(e){for(let t=0;t<this.max;t++){let n=this.life[t];if(n<=0)this.s.setScalar(0);else{n-=e,this.life[t]=n;let r=this.v[t];r.y-=14*e,this.p[t].addScaledVector(r,e),this.p[t].y<.05&&(this.p[t].y=.05,r.y*=-.3,r.x*=.7,r.z*=.7),this.s.setScalar(Math.max(0,Math.min(1,n*2))*this.size[t])}this.m.compose(this.p[t],this.q,this.s),this.mesh.setMatrixAt(t,this.m)}this.mesh.instanceMatrix.needsUpdate=!0}},zm=class{pool=[];constructor(e,t=16){for(let n=0;n<t;n++){let t=new Y(new Lc(.42,.5,32),new go({transparent:!0,depthWrite:!1,depthTest:!1,side:2,blending:2}));t.visible=!1,t.renderOrder=12,e.add(t),this.pool.push({mesh:t,age:0,life:1,grow:1})}}spawn(e,t,n,r=.3,i=2.5){let a=this.pool.find(e=>!e.mesh.visible)??this.pool[0];a.mesh.position.copy(e),a.mesh.lookAt(e.clone().add(n)),a.mesh.material.color.set(t),a.mesh.visible=!0,a.age=0,a.life=r,a.grow=i}update(e){for(let t of this.pool){if(!t.mesh.visible)continue;t.age+=e;let n=t.age/t.life;n>=1?t.mesh.visible=!1:(t.mesh.scale.setScalar(1+n*t.grow),t.mesh.material.opacity=1-n)}}},Bm=new K(0,1,0),Vm=class{scene;camera;arena;voxels;rings=[];ringGeo=new Lc(.42,.5,40);punchAmt=0;shakeAmt=0;flinchAmt=0;squashAmt=0;stretchAmt=0;flashes=[];pops=[];now=0;heroScale;constructor(e,t,n){this.scene=e,this.camera=t,this.arena=n,this.voxels=new Rm(e,500),this.heroScale=n.heroRig.root.scale.clone();for(let t=0;t<12;t++){let t=new go({transparent:!0,depthWrite:!1,depthTest:!1,side:2,blending:2}),n=new Y(this.ringGeo,t);n.visible=!1,n.renderOrder=13,e.add(n),this.rings.push({mesh:n,mat:t,age:0,life:1,grow:1})}}clashPoint(){return new K(.1,1.5,(Vp.heroZ-Vp.duelDistance)/2)}enemyChest(){let e=this.arena.enemyRig(),t=e?e.root.position.z:-Vp.duelDistance,n=e?e.root.scale.y:1;return new K(0,1.3*Math.max(.6,n),t+.35)}bladeTip(){return this.arena.heroRig.bladeTip.getWorldPosition(new K)}sparks(e,t,n,r=4,i=Bm,a=1){this.voxels.burst(e,t,n,r,i,a)}ring(e,t,n,r=.3,i=2.5){let a=this.rings.find(e=>!e.mesh.visible)??this.rings[0];a.mesh.position.copy(e),a.mesh.lookAt(e.clone().add(n)),a.mat.color.set(t),a.mat.opacity=1,a.mesh.scale.setScalar(1),a.mesh.visible=!0,a.age=0,a.life=r,a.grow=i}punch(e){this.punchAmt=Math.max(this.punchAmt,e)}shake(e){this.shakeAmt=Math.max(this.shakeAmt,e)}flinchEnemy(e){this.flinchAmt=Math.max(this.flinchAmt,e)}squashHero(e){this.squashAmt=e}stretchHero(e){this.stretchAmt=Math.max(this.stretchAmt,e)}flash(e,t=.25,n=.14){this.flashes.push({color:e,at:this.now,strength:t,life:n})}pop(e,t,n,r=22,i=.6){this.pops.push({text:e,pos:t.clone(),color:n,at:this.now,size:r,life:i}),this.pops.length>24&&this.pops.shift()}update(e,t){this.now=e,this.voxels.update(t);for(let e of this.rings){if(!e.mesh.visible)continue;e.age+=t;let n=e.age/e.life;n>=1?e.mesh.visible=!1:(e.mesh.scale.setScalar(1+n*e.grow),e.mat.opacity=1-n)}let n=this.camera;if(this.punchAmt>.001||this.shakeAmt>.001){let e=this.punchAmt,t=this.shakeAmt;n.position.z-=e*.45,n.position.y-=e*.12,n.position.x+=(Math.random()-.5)*t,n.position.y+=(Math.random()-.5)*t,n.fov-=e*2.4,n.updateProjectionMatrix()}this.punchAmt=Math.max(0,this.punchAmt-t*7*Math.max(.3,this.punchAmt)),this.shakeAmt=Math.max(0,this.shakeAmt-t*1.2);let r=this.arena.enemyRig();r&&this.flinchAmt>.001&&(r.root.position.z-=this.flinchAmt*.35,r.torso.rotation.x-=this.flinchAmt*.5),this.flinchAmt=Math.max(0,this.flinchAmt-t*6);let i=this.squashAmt-this.stretchAmt;this.arena.heroRig.root.scale.set(this.heroScale.x*(1+i*.07),this.heroScale.y*(1-i*.1),this.heroScale.z*(1+i*.07)),this.stretchAmt=Math.max(0,this.stretchAmt-t*5)}draw(e,t,n,r){this.flashes=this.flashes.filter(e=>t-e.at<e.life);for(let i of this.flashes){let a=1-(t-i.at)/i.life;a<=0||a>1.0001||(e.globalAlpha=i.strength*a*a,e.fillStyle=i.color,e.fillRect(0,0,n,r))}e.globalAlpha=1,this.pops=this.pops.filter(e=>t-e.at<e.life),e.textAlign=`center`,e.textBaseline=`middle`;for(let n of this.pops){let r=t-n.at;if(r<0)continue;let i=r/n.life,a=this.arena.toScreen(n.pos),o=r<.06?1.5-r/.06*.5:1;e.globalAlpha=Math.min(1,(1-i)*2.2),e.font=`bold ${Math.round(n.size*o)}px monospace`,e.lineWidth=4,e.strokeStyle=`rgba(0,0,0,0.75)`,e.strokeText(n.text,a.x,a.y-i*34),e.fillStyle=n.color,e.fillText(n.text,a.x,a.y-i*34)}e.globalAlpha=1}dispose(){this.scene.remove(this.voxels.mesh),this.voxels.mesh.geometry.dispose(),this.voxels.mesh.material.dispose(),this.voxels.mesh.dispose();for(let e of this.rings)this.scene.remove(e.mesh),e.mat.dispose();this.ringGeo.dispose(),this.arena.heroRig.root.scale.copy(this.heroScale)}},Hm=e=>440*2**((e-69)/12),Um=class{ctx;out;noiseBuf=null;constructor(e,t){this.ctx=e,this.out=t}noise(){if(!this.noiseBuf){let{ctx:e}=this;this.noiseBuf=e.createBuffer(1,Math.floor(e.sampleRate*.5),e.sampleRate);let t=this.noiseBuf.getChannelData(0);for(let e=0;e<t.length;e++)t[e]=Math.random()*2-1}return this.noiseBuf}env(e,t,n,r=.001){let i=this.ctx.createGain();return i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(t,e+r),i.gain.exponentialRampToValueAtTime(1e-4,e+r+n),i.connect(this.out),i}tone(e,t,n,r,i,a){let o=this.ctx.createOscillator();o.type=t,o.frequency.setValueAtTime(n,e),o.frequency.exponentialRampToValueAtTime(Math.max(20,r),e+a),o.connect(this.env(e,i,a)),o.start(e),o.stop(e+a+.03)}hiss(e,t,n,r,i,a,o=1){let s=this.ctx.createBufferSource();s.buffer=this.noise();let c=this.ctx.createBiquadFilter();c.type=t,c.Q.value=o,c.frequency.setValueAtTime(n,e),c.frequency.exponentialRampToValueAtTime(r,e+a),s.connect(c).connect(this.env(e,i,a)),s.start(e,Math.random()*.3,a+.05)}at(e){return Math.max(this.ctx.currentTime,e??this.ctx.currentTime)}draw(e,t){let n=this.at(t);e===`block`?(this.hiss(n,`bandpass`,1400,500,.12,.06,1.5),this.tone(n,`triangle`,420,260,.08,.05)):(this.hiss(n,`bandpass`,e===`stab`?5200:3600,1200,.16,.07,1.8),this.tone(n,`square`,2400,1800,.025,.02))}impact(e,t=1,n){let r=this.at(n),i=t;switch(this.tone(r,`sine`,150,48,.42*i,.16),this.hiss(r,`highpass`,3500,1800,.22*i,.05),e){case`block`:this.tone(r,`square`,2900,2100,.07*i,.12),this.tone(r,`triangle`,4350,3600,.06*i,.22);break;case`slash`:this.hiss(r,`bandpass`,6500,900,.22*i,.13,1.2);break;case`stab`:this.tone(r,`square`,1700,420,.1*i,.06);break;case`flourish`:for(let[e,t]of[1320,1660,1980,2640].entries())this.tone(r+e*.025,`triangle`,t,t,.05*i,.25);this.tone(r,`sine`,90,30,.4*i,.4)}}drum(e,t){let n=this.at(t);e===`don`?(this.tone(n,`sine`,190,70,.55,.2),this.hiss(n,`lowpass`,900,200,.18,.06)):(this.tone(n,`square`,1250,1150,.06,.035),this.hiss(n,`bandpass`,4200,2600,.22,.045,3),this.tone(n,`triangle`,880,820,.08,.06))}whiff(e){let t=this.at(e);this.hiss(t,`lowpass`,700,250,.12,.08),this.tone(t,`triangle`,260,140,.07,.09)}lockOn(e){let t=this.at(e);this.tone(t,`sine`,2600,2600,.035,.03)}tierUp(e,t){let n=this.at(t),r=74+e*2;[0,4,7,12].forEach((e,t)=>this.tone(n+t*.035,`square`,Hm(r+e),Hm(r+e),.05,.09))}tierDown(e){let t=this.at(e);this.tone(t,`sawtooth`,520,110,.07,.22)}},Wm=class{ctx;opts;intensity=1;color=`#39ff6a`;grid;gridOpacity;group=new Fi;baseRing;closeRing;burstRing;lastBeat=-1/0;beat=0;pulse=0;downbeat=!1;constructor(e,t){this.ctx=e,this.opts=t;let n=e.scene.children.find(e=>e instanceof Ql);this.grid=t.grid?n??null:null;let r=this.grid?.material;this.gridOpacity=r?.opacity??.35;let i=(e,t,n)=>{let r=new Y(new Lc(e,t,64),new go({color:this.color,transparent:!0,opacity:n,depthWrite:!1,blending:2,side:2}));return r.rotation.x=-Math.PI/2,this.group.add(r),r};this.baseRing=i(.86,.95,.3),this.closeRing=i(.94,1,0),this.burstRing=i(.9,1,0),this.group.position.set(0,.03,Vp.heroZ),this.group.visible=t.heroRing??!1,e.scene.add(this.group)}get state(){return{beat:this.beat,pulse:this.pulse,downbeat:this.downbeat}}update(e){let{session:t,arena:n,camera:r}=this.ctx,i=t.conductor.beatAt(e);this.beat=i;let a=this.ctx.chart.beatsPerBar,o=Im(this.lastBeat,i);this.lastBeat=i;let s=e<0&&i<0?0:Pm(i,4);this.pulse=s;let c=(Math.floor(i)%a+a)%a;this.downbeat=c===0;let l=this.intensity,u=this.downbeat?1.8:1;if(o!==null&&this.opts.rain&&this.ctx.rain.pulse(this.opts.rain*l*u),this.grid){let e=this.grid.material;e.opacity=Math.min(1,this.gridOpacity*(1+s*1.6*l*u)),e.color.set(this.color).lerp(new J(1,1,1),.35)}if(this.group.visible){let e=this.color;this.baseRing.material.color.set(e),this.baseRing.material.opacity=.18+.5*s*l;let t=Fm(i);this.closeRing.material.color.set(e),this.closeRing.scale.setScalar(1+(1-t)*1.4),this.closeRing.material.opacity=.05+.4*t*t*Math.min(1,l),this.burstRing.material.color.set(e),this.burstRing.scale.setScalar(1+(1-s)*1.8*u),this.burstRing.material.opacity=.75*s*l}let d=n.enemyRig();if(d&&this.opts.enemyBob){let e=this.opts.enemyBob*s*l*u;d.root.scale.x*=1+e,d.root.scale.z*=1+e,d.root.scale.y*=1-e*.6}this.opts.camera&&(r.fov-=this.opts.camera*s*l*u,r.updateProjectionMatrix())}draw(e,t,n){let r=this.opts.frame;if(!r)return;let i=Math.min(1,r*this.pulse*this.intensity*(this.downbeat?1.6:1));if(i<.01)return;let a=Math.min(t,n)*.12,o=Q(this.color,i),s=Q(this.color,0),c=[[0,0,0,a,0,0,t,a],[0,n,0,n-a,0,n-a,t,a],[0,0,a,0,0,0,a,n],[t,0,t-a,0,t-a,0,a,n]];for(let[t,n,r,i,a,l,u,d]of c){let c=e.createLinearGradient(t,n,r,i);c.addColorStop(0,o),c.addColorStop(1,s),e.fillStyle=c,e.fillRect(a,l,u,d)}}dispose(){this.ctx.scene.remove(this.group);for(let e of[this.baseRing,this.closeRing,this.burstRing])e.geometry.dispose(),e.material.dispose();if(this.grid){let e=this.grid.material;e.opacity=this.gridOpacity,e.color.set(16777215)}}},Gm=[12,27];function Km(){let e=Rt(),t=e.timing.beatsPerBar??4,n=new Set(Gm.map(e=>e*t)),r=[];for(let t of e.notes)t.action===`flourish`?r.push({...t}):t.action===`block`&&r.push(n.has(t.beat)?{beat:t.beat,action:`flourish`}:{...t});return{...e,meta:{...e.meta,charter:`freestyle transform of the lab chart`,description:`LAB.EXE with only the enemy attacks (blocks) and finishers charted.`},encounters:[{beat:0,enemy:`grunt`,name:`GRUNT`},{beat:8*t+1,enemy:`duelist`,name:`DUELIST`},{beat:12*t+1,enemy:`grunt`,name:`GRUNT MK2`},{beat:16*t+1,enemy:`knight`,name:`KNIGHT`},{beat:22*t+1,enemy:`brute`,name:`BRUTE`},{beat:27*t+1,enemy:`brute`,name:`DAEMON`}],prompts:[],combos:[],notes:r}}var qm={perfect:.035,good:.075};function Jm(e,t,n=qm){let r=Math.round(e*2),i=(e-r/2)*t,a=Math.abs(i);return{slot:r,offset:i,quality:a<=n.perfect?`perfect`:a<=n.good?`good`:`whiff`}}var Ym=[{mult:1,at:0,label:`x1`,color:`#39ff6a`},{mult:2,at:4,label:`x2`,color:`#7dfcff`},{mult:4,at:10,label:`x4`,color:`#ffd23b`},{mult:8,at:18,label:`x8`,color:`#ff8a2e`},{mult:16,at:28,label:`x16`,color:`#ff4fd8`}],Xm=class{streak=0;lastHitBeat=-1/0;get tier(){let e=0;return Ym.forEach((t,n)=>{this.streak>=t.at&&(e=n)}),e}get mult(){return Ym[this.tier].mult}get progress(){let e=this.tier,t=Ym[e+1];if(!t)return 1;let n=Ym[e].at;return(this.streak-n)/(t.at-n)}hit(e){let t=this.tier;return this.streak++,this.lastHitBeat=e,this.tier>t?`up`:null}whiff(e){return this.lastHitBeat=e,this.drop(1)}hurt(e){return this.lastHitBeat=e,this.drop(2)}idle(e){return e-this.lastHitBeat<4?null:(this.lastHitBeat=e,this.streak>0?this.drop(1):null)}drop(e){let t=this.tier,n=Math.max(0,t-e);return this.streak=t===0?0:Ym[n].at,t>0?`down`:null}},Zm=.5;function Qm(e,t,n=0){if(e===`whiff`)return 0;let r=Math.abs(n%2)===1;return(e===`perfect`?1.2:1)*(1+t*.2)*(r?Zm:1)}function $m(e,t){return e===`whiff`?0:(e===`perfect`?120:80)*t}var eh=class{last=-1/0;take(e){return e<=this.last?!1:(this.last=e,!0)}},th={k808:[1,1,1,1,1],perc:[1,1,1,1,1],lead:[0,1,1,1,1],vox:[0,0,1,1,1],backing:[0,0,0,1,1]};function nh(e,t){let n=th[e];return n?n[Math.max(0,Math.min(n.length-1,t))]:1}var rh=[1,0,2,1,1,2,3,0];function ih(e,t,n,r){let i=rh[(e%8+8)%8];return i===0||n.some(e=>Math.abs(e-t)<r)?null:i}function ah(e,t,n){let r=0;for(let i=Math.ceil(e);i<t;i++)n.some(e=>Math.abs(e-i)<.5)||r++;return r}function oh(e,t=0){return Math.max(6,Math.round(e*(1.15+.1*t)))}var sh=0,ch=3,lh={1:`slash`,2:`stab`,3:`flourish`},uh=24;function dh(e){let{session:t,chart:n,engine:r,audio:i,sfx:a,arena:o,autoplay:s}=e,l=t.conductor,u=new Vm(e.scene,e.camera,o),d=new Um(i,a.output),f=new Wm(e,{grid:!0,heroRing:!0,enemyBob:.05,rain:.25,camera:.4,frame:.22}),p=new Xm,m=new eh,h={hits:0,perfect:0,whiffs:0,broken:0,finished:0,escaped:0,peakTier:0,spare:[]},g=i.createGain();g.gain.value=.9,g.connect(r.musicBus);let _=new Set,v=new Set,y=n.beatsPerBar,b=0,S=0,C=-1/0,w=-1/0,T={at:-10,quality:`whiff`},E=e=>60/n.tempo.bpmAtBeat(Math.max(0,e)),D=()=>Ym[p.tier],O=n.notes.filter(e=>e.action===`block`).map(e=>e.beat),k=n.encounters.map(e=>{let t=n.notes.filter(t=>t.encounter===e.index&&t.action===`flourish`).pop()?.beat??e.startBeat+16,r=oh(ah(e.startBeat,t,O),e.index);return{max:r,hp:r,brokenAt:null,finisher:null,finisherBeat:t}}),A=e=>{let t=k[e];return t?(t.finisher??=l.cues.find(t=>t.encounter===e&&t.action===`flourish`&&!t.removed)??null,t.finisher):null},j=e=>{let n=t.duel.activeEncounter(e);if(n===null)return null;let r=t.duel.enemies[n],i=k[n];return!i||!r||r.state!==`fighting`?null:{k:n,e:i}},ee=e=>{let t=p.tier;for(let[n,a]of r.parts){let r=nh(n,t);a.gain.cancelScheduledValues(i.currentTime),a.gain.setValueAtTime(a.gain.value,i.currentTime),a.gain.setTargetAtTime(r,Math.max(i.currentTime,e),r>0?.02:.06)}};for(let[e,t]of r.parts)t.gain.value=nh(e,0);let M=e=>r.ctxTimeFor(n.tempo.beatToSec(Math.ceil(l.beatAt(e)+.001))),N=(t,n)=>{if(!t)return;ee(M(n));let r=D();t===`up`?(h.peakTier=Math.max(h.peakTier,p.tier),d.tierUp(p.tier),u.pop(`FURY ${r.label}`,o.heroRig.root.position.clone().setY(2.6),r.color,30,.9),u.flash(r.color,.18,.25),u.ring(o.heroRig.root.position.clone().setY(.05),r.color,new K(0,1,0),.45,4),e.rain.pulse(1.2)):(d.tierDown(),u.pop(`${r.label}`,o.heroRig.root.position.clone().setY(2.4),`#8a9a90`,22,.6))},P=(e,n,a)=>{let o=i.currentTime,s=l.beatAt(n),u=Math.max(0,Math.floor(s/y)),d=c(u),f=Math.round(s*2),m=a===`perfect`?.5:.38,h=p.tier;if(e===1){let e=d.leadTones[(f%4+4)%4]??81;for(let n of x(i,g,o,e,E(s)*.45,m*1.6,t.patch))r.connectBend(n.detune);h>=3&&x(i,g,o,e+12,E(s)*.3,m*.7,t.patch)}else if(e===2)ot(i,g,o,E(s)/8,m),h>=3&&at(i,g,o,d.root808+12,m*.6);else{let e=Math.max(...d.chord);ct(i,g,o,e+12,m,f%2==0?`a`:`o`),h>=4&&ct(i,g,o+.02,e+19,m*.6,`e`)}},F=(t,n,r)=>{let i=lh[t]??`slash`,a=l.beatAt(n),s=Jm(a,E(a),qm),c=s.quality!==`whiff`&&m.take(s.slot);if(d.draw(i),u.sparks(u.bladeTip(),D().color,4,2.5),T={at:r,quality:c?s.quality:`whiff`},!c){h.whiffs++,d.whiff(),o.playMove(i,r,!1),u.pop(`OFF BEAT`,u.clashPoint().setY(2.1),`#9aa8a0`,16,.45),u.flash(`#000000`,.12,.12),N(p.whiff(a),r);return}let f=j(n);h.hits++,s.quality===`perfect`&&h.perfect++,P(t,n,s.quality),N(p.hit(a),r),b+=$m(s.quality,p.mult);let g=D(),_=s.quality===`perfect`;if(o.playMove(i,r,f!==null),!f)return;let v=Qm(s.quality,p.tier,s.slot),y=f.e,x=y.brokenAt!==null;y.hp=Math.max(0,y.hp-v);let S=u.enemyChest();d.impact(i,_?1:.75),u.sparks(S,g.color,Math.round((_?14:9)+p.tier*4),4+p.tier),_&&u.sparks(S,$.white,5,6),u.flinchEnemy(_?.9:.6),u.punch(.2+.08*p.tier+(_?.1:0)),u.flash(g.color,.04+.02*p.tier,.1),u.pop(x?`+${$m(s.quality,p.mult)}`:`${Math.round(v*10)/10}`,S.clone().add(new K((Math.random()-.5)*.8,.5,0)),_?$.white:g.color,_?22:17,.5),!x&&y.hp<=0&&(y.brokenAt=r,h.broken++,h.spare.push(Math.round(y.finisherBeat-a)),d.impact(`flourish`,1),u.pop(`BROKEN!`,S.clone().setY(S.y+1.3),I.flourish.color,34,1.1),u.flash(I.flourish.color,.3,.3),u.shake(.15),u.punch(1),e.rain.pulse(1.5))},te=e=>{let r=l.beatAt(e);if(!Number.isFinite(C))return;let i=Math.floor(C*2)+1,a=Math.floor(r*2);for(let r=i;r<=a;r++){let i=n.tempo.beatToSec(r/2),a=t.cuesBetween(i-.5,i+.5).map(e=>e.time),o=ih(r,i,a,E(r/2)*.6);o!==null&&j(i)&&F(o,i,e)}},ne=[t.bus.on(`input`,e=>{e.down&&e.lane===sh&&u.sparks(u.bladeTip(),I.block.color,4,2.5)}),t.bus.on(`action`,e=>{if(e.kind===`holdEnd`||!e.hit){e.kind===`tap`&&!e.hit&&u.flash($.danger,.1,.18);return}let t=I[e.action].color,n=e.action===`block`?u.clashPoint():u.enemyChest();d.impact(e.action,e.judgement===`perfect`?1:.8),u.sparks(n,t,e.action===`flourish`?40:16,e.action===`flourish`?7:5),u.punch(e.action===`flourish`?1.2:.4),u.shake(e.action===`flourish`?.25:.06),u.flash(t,e.action===`flourish`?.4:.1,.2),u.stretchHero(1)}),t.bus.on(`duel`,e=>{let t=l.beatAt(e.time);e.type===`blocked`?(N(p.hit(t),S),b+=$m(e.judgement===`perfect`?`perfect`:`good`,p.mult)):e.type===`playerHit`?(N(p.hurt(t),S),u.flash($.danger,.28,.3),u.pop(`OUCH  FURY DOWN`,o.heroRig.root.position.clone().setY(2.3),$.danger,20,.8)):e.type===`defeated`?(h.finished++,b+=1e3*p.mult,u.flash($.white,.45,.35),u.pop(`FINISHED`,u.enemyChest().setY(2.6),$.white,36,1.2)):e.type===`escaped`&&(h.escaped++,u.pop(`ESCAPED`,u.enemyChest().setY(2.4),$.danger,30,1.1))})],re=(e,n,r)=>{let i=t.duel.activeEncounter(n),a=i===null?void 0:k[i],o=i===null?void 0:t.duel.enemies[i];if(!a||!o||o.state===`waiting`)return;let s=r/2-150,c=a.hp/a.max,u=a.brokenAt!==null;e.fillStyle=`rgba(0,8,3,0.85)`,e.fillRect(s-3,43,306,16);let d=I.flourish.color;if(e.fillStyle=u?Q(d,.6+.4*Pm(l.beatAt(n),3)):$.danger,e.fillRect(s,46,u?300:300*c,10),e.strokeStyle=Q($.white,.7),e.lineWidth=1,e.strokeRect(s-3,43,306,16),e.textAlign=`center`,e.font=`bold 12px monospace`,o.state!==`fighting`)return;let f=A(i);if(u&&f){let t=Math.max(0,Math.ceil(l.beatAt(f.time)-l.beatAt(n)));e.fillStyle=d,e.font=`bold 15px monospace`,e.fillText(t>0?`BROKEN · FINISHER IN ${t}`:`FINISH HIM!`,r/2,76)}else f&&f.time-n<E(0)*y*1.5?(e.fillStyle=Q($.danger,.6+.4*Pm(l.beatAt(n),2)),e.font=`bold 15px monospace`,e.fillText(`BREAK IT BEFORE IT ESCAPES!`,r/2,76)):(e.fillStyle=Q($.white,.8),e.fillText(`HP ${Math.ceil(a.hp)} / ${a.max}`,r/2,74))},L=(e,t,n)=>{let r=D(),i=n-24,a=Pm(l.beatAt(t),3);e.textAlign=`right`,e.font=`bold 13px monospace`,e.fillStyle=Q(r.color,.85),e.fillText(`FURY`,i,116),e.font=`bold ${46+Math.round(p.tier*4+a*4)}px monospace`,e.fillStyle=r.color,e.shadowColor=r.color,e.shadowBlur=4+p.tier*2,e.fillText(r.label,i,160),e.shadowBlur=0,e.fillStyle=`rgba(0,8,3,0.8)`,e.fillRect(i-150,170,150,8),e.fillStyle=r.color,e.fillRect(i-150,170,150*p.progress,8);let o=Ym[p.tier+1];e.font=`11px monospace`,e.fillStyle=Q($.white,.7),e.fillText(o?`${o.at-p.streak} on-beat to ${o.label}`:`MAX FURY`,i,192),e.font=`bold 18px monospace`,e.fillStyle=$.white,e.fillText(b.toString().padStart(7,`0`),i,218),e.font=`10px monospace`,e.fillStyle=Q($.white,.55),e.fillText(`FURY SCORE`,i,232)},ie=(e,r,i,a)=>{let o=l.beatAt(r);if(!Number.isFinite(o))return;let s=i/2,c=a-40,u=Math.min(300,i*.3),d=u/3,f=D();e.fillStyle=`rgba(0,8,3,0.7)`,e.fillRect(s-u-10,c-20,u*2+20,40);for(let t=Math.ceil((o-3)*2);t<=Math.floor((o+3)*2);t++){let n=t/2-o,r=t%2==0,i=r&&(t/2%y+y)%y===0,a=Math.max(0,1-Math.abs(n)/3);e.fillStyle=Q(i?$.white:f.color,a*(r?.95:.5));let l=i?16:r?11:6;for(let t of[-1,1])n<0||e.fillRect(s+t*n*d-1.5,c-l,3,l*2)}for(let i of t.cuesBetween(r-.1,r+n.tempo.beatToSec(3)+1)){if(t.duel.outcome(i.id)!==`pending`)continue;let n=l.beatAt(i.time)-o;if(n<-.1||n>3)continue;let r=I[i.action].color;for(let t of[-1,1]){let a=s+t*n*d;e.fillStyle=`rgba(0,0,0,0.6)`,e.beginPath(),e.arc(a,c,12,0,Math.PI*2),e.fill(),e.strokeStyle=r,e.lineWidth=2,e.stroke(),yp(e,i.action,a,c,7,r)}}let p=Pm(o,4),m=r-T.at,h=m<.15?1-m/.15:0;e.fillStyle=Q(h>0?T.quality===`whiff`?`#5d6b63`:T.quality===`perfect`?$.white:f.color:f.color,.5+.5*Math.max(p,h));let g=11+6*p+4*h;e.beginPath(),e.moveTo(s,c+g),e.lineTo(s-g,c),e.lineTo(s,c-g),e.lineTo(s+g,c),e.closePath(),e.fill(),e.font=`bold 13px monospace`,e.textAlign=`right`,e.fillStyle=Q(I.block.color,.95),e.fillText(`A  BLOCK`,s-u-20,c+5),e.textAlign=`left`,e.fillStyle=Q(f.color,.95),e.fillText(`S D F  ATTACK`,s+u+20,c+5)};return{mapInput(e,n){if(e.lane===sh)return e;if(!e.down)return _.delete(e.lane)?{...e,lane:ch}:null;let r=j(e.time),i=r?A(r.k):null;return r&&i&&r.e.brokenAt!==null&&t.judge.isPending(i.id)&&Math.abs(e.time-i.time)<=ce.good?(_.add(e.lane),v.add(i.id),{...e,lane:ch}):(F(e.lane,e.time,n),null)},pollInputs(e){if(s)return[];let n=j(e),a=n?A(n.k):null;if(!n||!a||n.e.brokenAt===null||v.has(a.id)||!t.judge.isPending(a.id))return[];let o=Math.max(0,Math.min(.08,i.currentTime-r.ctxTimeFor(e)));return e<a.time-o?[]:(v.add(a.id),[{lane:ch,down:!0,time:a.time,moveAt:a.time},{lane:ch,down:!1,time:a.time+.05}])},update(e,t){S=e;let i=l.beatAt(e);if(s&&te(e),Number.isFinite(i)&&N(p.idle(i),e),i<uh){let t=Math.floor(i)+1;t>w&&n.tempo.beatToSec(t)-e<.12&&t>=0&&(w=t,d.lockOn(r.ctxTimeFor(n.tempo.beatToSec(t))))}C=i,f.color=D().color,f.intensity=.55+p.tier*.3;let a=j(e),c=o.enemyRig();if(c&&a&&a.e.brokenAt!==null){let t=Math.sin(e*9);c.torso.rotation.z+=t*.12,c.body.rotation.x+=.25;let n=c.dizzy.material;n.opacity=.9,c.dizzy.rotation.z=e*6}u.update(e,t)},drawHud(e,t,n,r){f.draw(e,n,r),re(e,t,n),L(e,t,n),ie(e,t,n,r),u.draw(e,t,n,r)},dispose(){ne.forEach(e=>e());for(let e of r.parts.values())e.gain.cancelScheduledValues(0),e.gain.value=1;g.disconnect(),f.dispose(),u.dispose()}}}var fh={key:`freestyle`,label:`FREESTYLE ON THE BEAT`,tagline:`Only the enemy is charted. Attack freely on the beat; FURY climbs and the song grows.`,hypothesis:`Expressive freedom is more fun than following a chart: if the player chooses when and how to attack (judged only against the beat grid) and the music grows with their streak, they feel like the author of the song.`,inspiration:[`Metal: Hellsinger`,`Crypt of the NecroDancer`],howTo:[`Only enemy attacks are charted: press A to BLOCK when it winds up.`,`Between them attack freely with S D F on any beat or half-beat. Off-beat swings whiff.`,`On-beat streaks raise FURY x2 to x16: more damage, more music. Break the enemy before its finisher.`],options:{highway:!1,laneLabels:!1,enemyIcon:!0,prompts:!1,musicMapping:`sword`,keys:[`KeyA`,`KeyS`,`KeyD`,`KeyF`],keyLegend:`A block · S D F attack`},chart:Km,create:dh},ph={perfect:.06,great:.11,good:.16,miss:.2};function mh(e,t,n){for(let r of e){let e=t-r.time;if(!(e>n.good))return e<-n.miss?null:r}return null}function hh(e,t,n){return!e||t>=e.time?null:e.time-t<=n.good?e.time:null}var gh=class{held=[];get size(){return this.held.length}isHeld(e){return this.held.some(t=>t.cueId===e)}heldLanes(){return this.held.map(e=>e.down.lane)}hold(e,t,n){let r=this.takeLane(e.lane);return this.held.push({down:e,up:null,at:t,cueId:n}),r}up(e){for(let t=this.held.length-1;t>=0;t--){let n=this.held[t];if(n.down.lane===e.lane&&!n.up)return n.up=e,!0}return!1}due(e,t=0){let n=[],r=[];for(let i of this.held)i.at<=e+t?n.push(..._h(i)):r.push(i);return this.held=r,n}takeLane(e){let t=[];return this.held=this.held.filter(n=>n.down.lane!==e||(t.push(..._h(n)),!1)),t}};function _h(e){let t=[{...e.down,moveAt:e.at}];return e.up&&t.push({...e.up,time:Math.max(e.up.time,e.down.time)}),t}var vh={perfect:1,great:.85,good:.7,miss:0};function yh(e){let{session:t,chart:n,engine:r,audio:i,sfx:a,arena:o}=e,s=new Vm(e.scene,e.camera,o),c=new Um(i,a.output),l=new Wm(e,{grid:!0,heroRing:!0,enemyBob:.06,rain:.3,camera:.5,frame:.2}),u=new gh,d=[],f=new Set,p=0,m=e=>t.conductor.cues.filter(n=>n.lane===e&&!n.removed&&t.judge.isPending(n.id)).sort((e,t)=>e.time-t.time),h=e=>n.lanes[e],g=e=>{c.draw(e),s.sparks(s.bladeTip(),I[e].color,4,2.5)},_=[t.bus.on(`input`,e=>{if(!e.down||!e.auto)return;let t=h(e.lane);t&&g(t)}),t.bus.on(`action`,e=>{if(e.kind===`holdEnd`)return;if(!e.hit){e.kind===`tap`&&e.judgement===`miss`&&s.flash($.danger,.1,.18);return}let t=vh[e.judgement],n=I[e.action].color;f.delete(e.noteId)||c.impact(e.action,t);let r=e.action===`block`?s.clashPoint():s.enemyChest();s.sparks(r,n,Math.round(10+14*t),5),s.sparks(r,$.white,5,6),s.punch(e.action===`flourish`?1:.35+.35*t),s.shake(e.action===`flourish`?.18:.05),s.flash(n,.06+.08*t,.12),s.stretchHero(1),e.action!==`block`&&s.flinchEnemy(.6+.4*t)}),t.bus.on(`duel`,e=>{e.type===`playerHit`&&s.flash($.danger,.22,.25),e.type===`defeated`&&s.flash($.white,.35,.3)})];return{mapInput(e){if(!e.down)return u.up(e)?null:e;let t=h(e.lane);if(!t)return e;g(t);let n=mh(m(e.lane),e.time,ph),i=hh(n,e.time,ph);return i===null||!n?e:(d.push(...u.hold(e,i,n.id)),f.add(n.id),c.impact(t,1,r.ctxTimeFor(i)),s.pop(`ON BEAT`,s.clashPoint().setY(2.4),Q($.white,.9),15,.5),null)},pollInputs(e){let t=Math.max(0,Math.min(.08,i.currentTime-r.ctxTimeFor(e))),n=d.splice(0,d.length);return n.push(...u.due(e,t)),n},update(e,t){l.update(e),p+=(+(u.size>0)-p)*Math.min(1,t*30),s.squashHero(p),s.update(e,t)},drawHud(e,r,i,a){l.draw(e,i,a),bh(e,t.conductor.beatAt(r),o.laneScreen(),n.beatsPerBar),s.draw(e,r,i,a)},dispose(){_.forEach(e=>e()),l.dispose(),s.dispose()}}}function bh(e,t,n,r){if(!Number.isFinite(t)||n.xs.length===0)return;let i=Math.min(...n.xs)-n.width*.8,a=Math.max(...n.xs)+n.width*.8,o=n.y,s=Fm(t),c=(1-s)**4;for(let n=1;n<=3;n++){let c=(n-s)*34,l=((Math.floor(t)+n)%r+r)%r===0,u=l?6:4;e.globalAlpha=Math.max(0,1-(n-s)/3.2),e.fillStyle=l?$.white:$.green;for(let t of[i-c,a+c])e.beginPath(),e.arc(t,o,u,0,Math.PI*2),e.fill()}e.globalAlpha=1;for(let t of[i,a])e.strokeStyle=Q($.green,.5+.5*c),e.lineWidth=2+3*c,e.beginPath(),e.arc(t,o,9+6*c,0,Math.PI*2),e.stroke(),e.fillStyle=Q($.white,.25+.7*c),e.beginPath(),e.arc(t,o,4+4*c,0,Math.PI*2),e.fill()}var xh={key:`on-beat`,label:`ON-BEAT ASSIST`,tagline:`Forgiving timing; every hit resolves exactly on the beat, and the arena pulses.`,hypothesis:`When the game reacts on the beat instead of on your key press, everyone feels on-rhythm: generous windows plus on-beat reactions beat precise judging for fun and flow.`,inspiration:[`Hi-Fi Rush`],howTo:[`Same four lanes: A block · S slash · D stab · F flourish.`,`Timing is generous. Press a bit early and the hero coils, then strikes right on the beat.`,`Everything pulses with the music: ride the pulse, not the numbers.`],options:{musicMapping:`instruments`,keyLegend:`A S D F`,windows:ph},create:yh},Sh=Math.PI/180,Ch=`#ffd23b`,wh=`#ff3b5c`;function Th(e,t,n){let r=document.createElement(`canvas`);r.width=e,r.height=t,n(r.getContext(`2d`));let i=new is(r);return i.colorSpace=dr,i.anisotropy=4,i}function Eh(e,t,n,r,i,a){e.beginPath(),e.roundRect(t,n,r,i,a)}function Dh(e){let t=I[e].color;return Th(256,128,n=>{n.shadowColor=t,n.shadowBlur=14,n.fillStyle=t,Eh(n,10,10,236,108,22),n.fill(),n.shadowBlur=0,n.strokeStyle=`#ffffff`,n.lineWidth=6,Eh(n,13,13,230,102,20),n.stroke(),yp(n,e,128,64,40,`#04140a`)})}function Oh(e){let t=I[e].color;return Th(256,128,n=>{n.fillStyle=Q(t,.16),Eh(n,10,10,236,108,22),n.fill(),n.strokeStyle=t,n.lineWidth=8,Eh(n,12,12,232,104,20),n.stroke(),yp(n,e,128,64,36,Q(t,.75))})}function kh(){return Th(4,256,e=>{let t=e.createLinearGradient(0,256,0,0);t.addColorStop(0,`#ffffff`),t.addColorStop(.55,`#777777`),t.addColorStop(1,`#111111`),e.fillStyle=t,e.fillRect(0,0,4,256)})}var Ah=class{chart;group=new Fi;hitZ=-Vp.hitDistance;cueMats;bodyMats;receptors=[];laneFloors=[];beatLines=[];pools=[];hitLine;rails=[];railMats=[];tilt=Vp.cueTiltDeg*Sh;constructor(e,t){this.chart=t,e.add(this.group);let n=Vp.laneWidth,r=Vp.highwayLength,i=kh(),a=n*_.length,o=new Y(new Ic(a+.2,r+.6),new go({color:0,transparent:!0,opacity:.55,alphaMap:i,depthWrite:!1}));o.rotation.x=-Math.PI/2,o.position.set(0,.008,this.hitZ-r/2+.3),this.group.add(o),_.forEach((e,t)=>{let a=I[e].color,o=new go({color:a,transparent:!0,opacity:.1,alphaMap:i,depthWrite:!1,blending:2});this.laneFloors.push(o);let s=new Y(new Ic(n*.94,r),o);s.rotation.x=-Math.PI/2,s.position.set(this.laneX(t),.012,this.hitZ-r/2),this.group.add(s);let c=new Y(new Ic(n*.9,Vp.cueDepth),new go({map:Oh(e),transparent:!0,depthTest:!1,depthWrite:!1}));this.placeTile(c,t,this.hitZ,.02),c.renderOrder=9,this.group.add(c),this.receptors.push(c)});for(let e=0;e<=_.length;e++){let t=e===0||e===_.length,a=new Y(new Ic(t?.05:.025,r),new go({color:13172696,transparent:!0,opacity:t?.55:.25,alphaMap:i,depthWrite:!1}));a.rotation.x=-Math.PI/2,a.position.set((e-_.length/2)*n,.016,this.hitZ-r/2),this.group.add(a)}this.hitLine=new Y(new Ic(a+.4,.07),new go({color:16777215,transparent:!0,depthTest:!1,depthWrite:!1})),this.hitLine.rotation.x=-Math.PI/2,this.hitLine.position.set(0,.03,this.hitZ+Vp.cueDepth*.5*Math.cos(this.tilt)),this.hitLine.renderOrder=9,this.group.add(this.hitLine);let s=new Ic(a,1);for(let e=0;e<48;e++){let e=new Y(s,new go({color:13172696,transparent:!0,opacity:.1,depthWrite:!1}));e.rotation.x=-Math.PI/2,e.visible=!1,this.group.add(e),this.beatLines.push(e)}this.cueMats=_.map(e=>new go({map:Dh(e),transparent:!0,depthTest:!1,depthWrite:!1})),this.bodyMats=_.map(e=>new go({color:I[e].color,transparent:!0,opacity:.45,depthTest:!1,depthWrite:!1}));for(let e=0;e<_.length;e++)this.pools.push([]);let c=new Ic(.16,1);for(let e=0;e<8;e++){let e=new go({color:Ch,transparent:!0,opacity:.8,depthWrite:!1,depthTest:!1,blending:2}),t=new Y(c,e);t.rotation.x=-Math.PI/2,t.renderOrder=8,t.visible=!1,this.group.add(t),this.rails.push(t),this.railMats.push(e)}}laneX(e){return(e-(_.length-1)/2)*Vp.laneWidth}receptorPoint(e){return new K(this.laneX(e),.1,this.hitZ)}cueZ(e,t,n){return this.hitZ-(e-t)/n*Vp.highwayLength}placeTile(e,t,n,r){e.rotation.set(-Math.PI/2+this.tilt,0,0);let i=Vp.cueDepth/2;e.position.set(this.laneX(t),r+Math.sin(this.tilt)*i,n)}cueMesh(e,t){let n=this.pools[e],r=n[t];if(!r){let t=new Y(new Ic(Vp.laneWidth*.86,Vp.cueDepth),this.cueMats[e].clone());t.renderOrder=11;let i=new Y(new Ic(Vp.laneWidth*.36,1),this.bodyMats[e]);i.rotation.x=-Math.PI/2,i.renderOrder=10,this.group.add(t,i),r={tile:t,body:i},n.push(r)}return r}update(e,t,n,r,i,a,o){let s=Vp.highwayLength,c=n.judge,l=this.chart.beatsPerBar,u=0,d=0;for(let r of n.conductor.plays){if(r.start>e+t)break;if(!(r.start+r.dur<e-.1)){for(let n=0;n<l&&u<this.beatLines.length;n++){let i=r.start+r.dur*n/l;if(i<e-.05||i>e+t)continue;let a=this.cueZ(i,e,t)+Vp.cueDepth*.5,o=this.beatLines[u++];o.visible=!0,o.position.set(0,.014,a),o.scale.y=n===0?.06:.03;let c=(this.hitZ-a)/s;o.material.opacity=(n===0?.32:.12)*(1-c*.7)}if(r.combo&&d+1<this.rails.length){let n=Math.min(this.hitZ+.6,this.cueZ(r.start,e,t)+Vp.cueDepth*.5),i=Math.max(this.hitZ-s,this.cueZ(r.start+r.dur,e,t)+Vp.cueDepth*.5);if(n>i){let t=r.status===`failed`,a=r.attempt>1||t?wh:Ch;for(let r of[-1,1]){let o=this.rails[d],s=this.railMats[d++];o.visible=!0,o.position.set(r*(Vp.laneWidth*2+.12),.02,(n+i)/2),o.scale.y=n-i-.06,s.color.set(a),s.opacity=t?.35+.35*Math.sin(e*40):.8}}}}}for(;u<this.beatLines.length;u++)this.beatLines[u].visible=!1;for(;d<this.rails.length;d++)this.rails[d].visible=!1;this.receptors.forEach((t,n)=>{let o=e-a[n],s=e-i[n],c=o>=0&&o<.18?1-o/.18:0,l=r[n]?1:s>=0&&s<.12?1-s/.12:0;t.scale.setScalar(1+c*.18+l*.06),t.material.opacity=.75+.25*Math.max(c,l),this.laneFloors[n].opacity=.09+l*.12+c*.25});let f=Array(_.length).fill(0);for(let r of n.conductor.cues){if(r.removed||r.time>e+t+.05||(r.endTime??r.time)<e-.3)continue;let n=c.isPending(r.id),i=c.isHolding(r.id),a=c.isVoid(r.id)?o.get(r.id):void 0,l=a===void 0?1/0:e-a;if(!n&&!i&&!(l<.3))continue;let u=this.cueMesh(r.lane,f[r.lane]++),d=i?this.hitZ:this.cueZ(r.time,e,t),p=(this.hitZ-d)/s,m=Math.min(1,(1-p)/.12),h=n&&e>r.time;u.tile.visible=!0,this.placeTile(u.tile,r.lane,d,.03+(l<.3?l*1.5:0));let g=u.tile.material;if(g.opacity=Math.max(0,m)*(h?.45:1)*(l<.3?1-l/.3:1),g.color.set(l<.3?wh:`#ffffff`),r.endTime!==null&&l===1/0){let n=Math.max(this.hitZ-s,this.cueZ(r.endTime,e,t)),i=Math.max(.01,d-n);u.body.visible=!0,u.body.position.set(this.laneX(r.lane),.025,(d+n)/2),u.body.scale.y=i}else u.body.visible=!1}this.pools.forEach((e,t)=>{for(let n=f[t];n<e.length;n++)e[n].tile.visible=!1,e[n].body.visible=!1});let p=n.conductor.beatAt(e);this.hitLine.material.opacity=.7+.3*(1-(p-Math.floor(p)))**3}},jh={farZ:-9,hitZ:-Vp.hitDistance,halfWidth:.5,lift:.42,badge:.36},Mh={height:66,badge:23,drum:31},Nh={perfect:.055,other:.03},Ph=.24,Fh=.45,Ih=class{ctx;layout;stage;approach=1;impacts=[];hit={x:0,y:0,r:30};v=new K;constructor(e,t){this.ctx=e,this.layout=t,this.stage=new am(e,{framing:t===`strip`?Xp:null,linger:Fh}),this.stage.onOutcome=({cue:e,outcome:t})=>{this.stage.react(e.action,t);let n=this.hit;if(this.stage.pop(n.x,n.y-n.r*1.1,t),t.judgement===`miss`){this.stage.shards.crack(n.x,n.y,e.action,n.r*.75);return}let r=I[e.action].color,i=t.judgement===`perfect`;this.impacts.push({x:n.x,y:n.y,r:n.r*(i?1.6:1.2),color:r,at:this.stage.now}),this.stage.shards.burst(n.x,n.y,r,i?22:12,i?420:300,5)}}update(e,t,n){this.approach=n,this.stage.update(e,t)}drawHud(e,t,n,r){let i=this.stage.staged(t,this.approach*1.02);this.layout===`column`?this.drawColumn(e,t,i):this.drawStrip(e,t,n,i);for(let n=this.impacts.length-1;n>=0;n--){let r=this.impacts[n];t-r.at>.2?this.impacts.splice(n,1):Lp(e,r.x,r.y,r.r,r.color,Ap(t-r.at,.2))}let a=this.layout===`strip`?{x:this.hit.x+70,y:this.hit.y-Mh.height/2-34}:{x:this.hit.x+Math.max(150,n*.16),y:this.hit.y-20};this.stage.drawCombo(e,a.x,a.y),this.stage.drawOverlay(e,t,n,r)}key(e){return Pt(this.ctx.keys[_.indexOf(e.action)]??``)}beats(e,t){let n=[],r=this.ctx.chart.beatsPerBar;for(let i of this.ctx.session.conductor.plays){if(i.start>e+this.approach)break;if(i.start+i.dur<e-t)continue;let a=i.combo?i.attempt>1||i.status===`failed`?wh:Ch:null;for(let o=0;o<r;o++){let s=i.start+i.dur*o/r;s>=e-t&&s<=e+this.approach&&n.push({time:s,down:o===0,combo:a})}}return n}floor(e,t,n=0){return this.ctx.arena.toScreen(this.v.set(t,n,e))}columnZ(e){return jh.hitZ+(jh.farZ-jh.hitZ)*(e/this.approach)}drawColumn(e,t,n){let{farZ:r,hitZ:i,halfWidth:a,lift:o}=jh,s=i+.55,c=this.floor(r,-a),l=this.floor(r,a),u=this.floor(s,-a),d=this.floor(s,a),f=e.createLinearGradient(0,c.y,0,u.y);f.addColorStop(0,`rgba(57,255,106,0)`),f.addColorStop(.3,`rgba(57,255,106,0.07)`),f.addColorStop(1,`rgba(57,255,106,0.16)`),e.save(),e.fillStyle=f,e.beginPath(),e.moveTo(c.x,c.y),e.lineTo(l.x,l.y),e.lineTo(d.x,d.y),e.lineTo(u.x,u.y),e.closePath(),e.fill();let p=(t,n,r,i,o)=>{let s=this.floor(n,t*a),c=this.floor(r,t*a);e.strokeStyle=i,e.lineWidth=o,e.beginPath(),e.moveTo(s.x,s.y),e.lineTo(c.x,c.y),e.stroke()};for(let e of[-1,1])p(e,r,s,`rgba(200,255,216,0.7)`,2);let m=this.beats(t,.1);for(let n of m){let o=this.columnZ(n.time-t);if(o>s)continue;let c=this.floor(o,-a),l=this.floor(o,a),u=(i-o)/(i-r);e.strokeStyle=`rgba(200,255,216,${(n.down?.4:.16)*(1-u*.7)})`,e.lineWidth=n.down?2:1,e.beginPath(),e.moveTo(c.x,c.y),e.lineTo(l.x,l.y),e.stroke()}for(let e of this.ctx.session.conductor.plays){if(!e.combo||e.start>t+this.approach||e.start+e.dur<t)continue;let n=Math.min(s,this.columnZ(e.start-t)),i=Math.max(r,this.columnZ(e.start+e.dur-t)),a=e.attempt>1||e.status===`failed`?wh:Ch;for(let e of[-1,1])p(e*1.06,n,i,a,4)}e.restore();let h=this.ctx.arena.toScreen(this.v.set(0,o,i)),g=this.stage.screenAt(this.v.set(0,o,i)).ppu,_=jh.badge*g*1.2;this.hit={x:h.x,y:h.y,r:_},this.drawGate(e,t,h.x,h.y,_,n);for(let a=n.length-1;a>=0;a--){let s=n[a];if(s.stage===`incoming`||s.stage===`holding`){let n=s.stage===`holding`?0:s.tau,a=this.columnZ(Math.max(n,-.12)),c=this.ctx.arena.toScreen(this.v.set(0,o,a)),l=this.floor(a,0),u=jh.badge*this.stage.screenAt(this.v.set(0,o,a)).ppu,d=bp((1-(i-a)/(i-r))/.15)*(n<0?.5:1);e.save(),e.globalAlpha=.35*d,e.fillStyle=`#000000`,e.beginPath(),e.ellipse(l.x,l.y,u*.8,u*.25,0,0,Math.PI*2),e.fill(),e.restore(),Fp(e,s.cue.action,c.x,c.y,u,{alpha:d,key:u>10?this.key(s.cue):void 0,wrong:this.stage.wrongShake(s.cue.id,t)})}else if(s.stage===`hit`)this.drawBurst(e,s,h.x,h.y,_*.85);else if(s.stage===`void`){let t=this.columnZ(Math.max(0,s.tau+s.age)),n=this.ctx.arena.toScreen(this.v.set(0,o,t)),r=jh.badge*this.stage.screenAt(this.v.set(0,o,t)).ppu;Ip(e,s.cue.action,n.x,n.y,r,s.age,Fh)}}}drawGate(e,t,n,r,i,a){let o=this.ctx.session.conductor.beatAt(t),s=(1-(o-Math.floor(o)))**4,c=Math.max(...this.stage.pressAt),l=this.stage.pressAt.indexOf(c),u=Ap(t-c,.14),d=a.find(e=>e.stage===`incoming`),f=d?bp(1-d.tau/.4):0,p=I[_[l]??`block`].color;e.save(),e.fillStyle=u>0?Q(p,.35*u):`rgba(0,10,4,0.45)`,e.beginPath(),e.arc(n,r,i*(1+u*.12),0,Math.PI*2),e.fill(),e.lineWidth=3+s*1.5,e.strokeStyle=u>0?p:`rgba(230,255,233,${.7+.3*Math.max(s,f)})`,e.shadowColor=`#e6ffe9`,e.shadowBlur=6+f*10,e.stroke(),e.shadowBlur=0,e.lineWidth=1,e.strokeStyle=`rgba(230,255,233,0.4)`,e.beginPath(),e.arc(n,r,i*.72,0,Math.PI*2),e.stroke(),e.restore()}drawBurst(e,t,n,r,i){let a=t.outcome?.judgement===`perfect`?Nh.perfect:Nh.other,o=jp(t.age,a);if(o>=Ph)return;let s=xp(o/Ph);Fp(e,t.cue.action,n,r,i*(1.1+s*.9),{alpha:1-s,flash:+(t.age<a)})}drawStrip(e,t,n,r){let i=this.stage.enemySpot(`chest`);if(i){let e=this.stage.screenAt(i);this.hit={x:e.x,y:e.y,r:Mh.drum}}let{x:a,y:o}=this.hit,s=Mh.height,c=n-24,l=a-90;e.save();let u=e.createLinearGradient(l,0,c,0);u.addColorStop(0,`rgba(0,10,4,0)`),u.addColorStop(.08,`rgba(0,14,6,0.5)`),u.addColorStop(1,`rgba(0,14,6,0.62)`),e.fillStyle=u,e.fillRect(l,o-s/2,c-l+24,s),e.fillStyle=`rgba(200,255,216,0.35)`,e.fillRect(l+20,o-s/2,c-l,1.5),e.fillRect(l+20,o+s/2-1.5,c-l,1.5);for(let n of this.ctx.session.conductor.plays){if(!n.combo||n.start>t+this.approach||n.start+n.dur<t)continue;let r=Math.max(a,kp(n.start-t,this.approach,c,a)),i=Math.min(c,kp(n.start+n.dur-t,this.approach,c,a));e.fillStyle=n.attempt>1||n.status===`failed`?wh:Ch,e.fillRect(r,o-s/2-2,i-r,4),e.fillRect(r,o+s/2-2,i-r,4)}for(let n of this.beats(t,.05)){let r=kp(n.time-t,this.approach,c,a);if(r<a+Mh.drum)continue;e.fillStyle=`rgba(200,255,216,${n.down?.42:.16})`;let i=n.down?s:s*.45;e.fillRect(r-(n.down?1:.5),o-i/2,n.down?2:1,i)}e.restore(),this.drawGate(e,t,a,o,Mh.drum,r);for(let n=r.length-1;n>=0;n--){let i=r[n];if(i.stage===`incoming`||i.stage===`holding`){let n=i.stage===`holding`?0:i.tau,r=kp(Math.max(n,-.15),this.approach,c,a),s=bp((c-r)/60)*(n<0?.5:1);Fp(e,i.cue.action,r,o,Mh.badge,{alpha:s,key:this.key(i.cue),wrong:this.stage.wrongShake(i.cue.id,t)})}else if(i.stage===`hit`)this.drawBurst(e,i,a,o,Mh.badge);else if(i.stage===`void`){let t=kp(Math.max(0,i.tau+i.age),this.approach,c,a);Ip(e,i.cue.action,t,o,Mh.badge,i.age,Fh)}}}dispose(){this.stage.dispose(),this.impacts.length=0}},Lh=`Read the badge: A blue shield BLOCK · S green diamond SLASH · D amber arrow STAB · F pink star FLOURISH.`,Rh={key:`one-lane`,label:`ONE LANE · COLUMN`,tagline:`One central lane through the enemy: badge colour and shape say which key.`,hypothesis:`Mapping actions to lane positions costs attention. With one lane through the fight and the key read from badge colour + shape (Taiko’s don/ka), the eyes stay on a narrow column over the enemy: readability and fun match or beat the 4-lane baseline.`,inspiration:[`Taiko no Tatsujin`,`Thumper`,`Rhythm Heaven`],howTo:[`Every cue slides down one lane, through the enemy, to the ring in front of you.`,Lh,`Press as the badge reaches the ring.`],options:{musicMapping:`instruments`,highway:!1,laneLabels:!1,judgementHud:!1,approachSeconds:1.35,keyLegend:`A S D F`},create:e=>new Ih(e,`column`)},zh={key:`one-lane-strip`,label:`ONE LANE · TAIKO STRIP`,tagline:`One horizontal track at the enemy’s chest: badges slide onto the enemy, Taiko style.`,hypothesis:`A Taiko-style horizontal strip whose drum sits on the enemy’s chest keeps cue, timing and target on one line through the fight; reading colour + shape for the key is no harder than lane position, and fun rises over the 4-lane baseline.`,inspiration:[`Taiko no Tatsujin`,`Rhythm Heaven`,`Muse Dash`],howTo:[`Badges slide in from the right along one track onto the ring on the enemy’s chest.`,Lh,`Press as the badge reaches the ring.`],options:{musicMapping:`instruments`,highway:!1,laneLabels:!1,enemyIcon:!1,judgementHud:!1,approachSeconds:1.7,keyLegend:`A S D F`},create:e=>new Ih(e,`strip`)};function Bh(){let e=Rt();return{...e,meta:{...e.meta,description:`LAB.EXE without its cue notes: your hits play them.`},audio:{...e.audio,procedural:P}}}function Vh(){let e=Rt();return{...e,meta:{...e.meta,description:`LAB.EXE on quarter notes, cued by sound only.`},notes:e.notes.filter(e=>Math.abs(e.beat-Math.round(e.beat))<1e-6)}}function Hh(){let e=[];for(let t of a())t.chart&&e.push({beat:t.beat,action:t.chart.action});e.sort((e,t)=>e.beat-t.beat||_.indexOf(e.action)-_.indexOf(t.action));let t=e=>l.find(t=>t.encounter===e).callBar;return{format:o,version:3,meta:{title:`ECHO.EXE`,artist:`procedural (Web Audio)`,charter:`playtest lab generator`,difficulty:`lab`,description:`Call and response: the enemy plays a bar, you answer it.`},audio:{procedural:f,lengthBeats:u},timing:{bpm:124,offsetMs:0,beatsPerBar:4},encounters:E.map((e,n)=>({beat:n===0?0:t(n)*4-1,enemy:e.enemy,name:e.name})),prompts:[{beat:0,text:`LISTEN to the enemy, then ANSWER`,beats:8}],notes:e}}var Uh=e=>440*2**((e-69)/12),Wh={uh:[640,1190,2390],ee:[300,2500,3200],oo:[340,870,2250],r:[420,1300,1700]},Gh=class{ctx;bus;noise=null;constructor(e){this.ctx=e,this.bus=e.createGain()}play(e,t,n,r,i){let a=[],o=c(r),s=[...o.chord].sort((e,t)=>e-t);switch(e){case`hup`:{a.push(this.noiseBurst(t,`bandpass`,1400,.22,.035,1)),a.push(...this.voice(t+.02,.11,Uh(o.root808+12),Wh.uh,.62,1.25));let e=this.ctx.createOscillator();e.frequency.setValueAtTime(Uh(o.root808+12),t),e.frequency.exponentialRampToValueAtTime(Uh(o.root808),t+.1),e.connect(this.env(t,.5,.004,.16)).connect(this.bus),e.start(t),e.stop(t+.2),a.push(e);break}case`whoosh`:{let e=this.src(),r=this.ctx.createBiquadFilter();r.type=`bandpass`,r.Q.value=2.5,r.frequency.setValueAtTime(500,t),r.frequency.exponentialRampToValueAtTime(8e3,t+n);let i=this.ctx.createGain();i.gain.setValueAtTime(1e-4,t),i.gain.linearRampToValueAtTime(.09,t+.03),i.gain.exponentialRampToValueAtTime(.8,t+n-.01),i.gain.linearRampToValueAtTime(0,t+n),e.connect(r).connect(i).connect(this.bus),e.loop=!0,e.start(t),e.stop(t+n+.02),a.push(e);let s=o.leadTones[3]??81,c=this.ctx.createOscillator();c.type=`sawtooth`,c.frequency.setValueAtTime(Uh(s-12),t),c.frequency.exponentialRampToValueAtTime(Uh(s),t+n);let l=this.ctx.createBiquadFilter();l.type=`lowpass`,l.frequency.setValueAtTime(600,t),l.frequency.exponentialRampToValueAtTime(5e3,t+n);let u=this.ctx.createGain();u.gain.setValueAtTime(1e-4,t),u.gain.linearRampToValueAtTime(.03,t+.03),u.gain.exponentialRampToValueAtTime(.18,t+n-.01),u.gain.linearRampToValueAtTime(0,t+n),c.connect(l).connect(u).connect(this.bus),c.start(t),c.stop(t+n+.02),a.push(c);break}case`tick`:{let e=(i===0?s[2]:s[s.length-1])+12;for(let[n,r,i]of[[1,.75,.06],[2.76,.22,.025]]){let o=this.ctx.createOscillator();o.frequency.value=Uh(e)*n,o.connect(this.env(t,r,.001,i)).connect(this.bus),o.start(t),o.stop(t+.08),a.push(o)}a.push(this.noiseBurst(t,`highpass`,5e3,.3,.012,.7));break}case`three`:{a.push(this.noiseBurst(t,`highpass`,4200,.2,.05,.8));let e=Uh(s[s.length-1]-12);a.push(...this.voice(t+.04,n,e,Wh.r,.7,1,Wh.ee,.07));break}case`two`:{a.push(this.noiseBurst(t,`highpass`,3e3,.35,.018,1));let e=Uh(s[s.length-2]-12);a.push(...this.voice(t+.012,n,e,Wh.oo,.6,1));break}}return a}dispose(){this.bus.disconnect()}env(e,t,n,r){let i=this.ctx.createGain();return i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(t,e+n),i.gain.exponentialRampToValueAtTime(1e-4,e+n+r),i}src(){if(!this.noise){let{ctx:e}=this;this.noise=e.createBuffer(1,e.sampleRate,e.sampleRate);let t=this.noise.getChannelData(0),n=777;for(let e=0;e<t.length;e++)n=n*1103515245+12345&2147483647,t[e]=n/2147483647*2-1}let e=this.ctx.createBufferSource();return e.buffer=this.noise,e}noiseBurst(e,t,n,r,i,a){let o=this.src(),s=this.ctx.createBiquadFilter();return s.type=t,s.frequency.value=n,s.Q.value=a,o.connect(s).connect(this.env(e,r,.002,i)).connect(this.bus),o.start(e,Math.random()*.5,i+.05),o}voice(e,t,n,r,i,a,o,s=0){let{ctx:c}=this,l=c.createOscillator();l.type=`sawtooth`,l.frequency.setValueAtTime(n*1.06,e),l.frequency.exponentialRampToValueAtTime(n,e+.05);let u=c.createGain();r.forEach((t,n)=>{let r=c.createBiquadFilter();r.type=`bandpass`,r.frequency.setValueAtTime(t,e),o&&r.frequency.linearRampToValueAtTime(o[n],e+s),r.Q.value=[6,9,11][n];let i=c.createGain();i.gain.value=[1.6,1,.5][n]*a,l.connect(r).connect(i).connect(u)});let d=c.createGain();return d.gain.setValueAtTime(0,e),d.gain.linearRampToValueAtTime(i,e+.012),d.gain.setValueAtTime(i,e+t*.7),d.gain.exponentialRampToValueAtTime(1e-4,e+t),u.connect(d).connect(this.bus),l.start(e),l.stop(e+t+.02),[l]}},Kh=.003;function qh(e,t,n){let r=e-t>Kh?e:t;switch(n){case`perfect`:return{when:r,gain:.92,shelfDb:3,lowpassHz:2e4};case`great`:return{when:r,gain:.85,shelfDb:0,lowpassHz:2e4};default:return{when:r,gain:.68,shelfDb:-2,lowpassHz:4200}}}function Jh(e,t,n){switch(e){case`block`:return[{kind:`hup`,time:t-n,dur:n*.4,step:0}];case`slash`:return[{kind:`whoosh`,time:t-n,dur:n,step:0}];case`stab`:return[{kind:`tick`,time:t-n,dur:.06,step:0},{kind:`tick`,time:t-n/2,dur:.06,step:1}];case`flourish`:return[{kind:`three`,time:t-2*n,dur:n*.6,step:0},{kind:`two`,time:t-n,dur:n*.6,step:1}]}}function Yh(e,t,n){return e<=t?1:Math.max(0,1-(e-t)/Math.max(1e-6,n))}function Xh(e){return e<0?0:e<.015?e/.015:Math.exp(-(e-.015)/.07)}function Zh(e,t=.12,n=.32){if(e<-t||e>n)return 0;if(e<=0){let n=1+e/t;return n*n}let r=1-e/n;return r*r*(3-2*r)}var Qh=class{punches=[];punch(e,t,n){this.punches.push({at:e,strength:t,color:n}),this.punches.length>12&&this.punches.shift()}level(e){let t=0,n=`#ffffff`;for(let r of this.punches){let i=Xh(e-r.at)*r.strength;i>t&&(t=i,n=r.color)}return{k:t,color:n}}apply(e,t){this.punches=this.punches.filter(e=>t-e.at<.6);let{k:n}=this.level(t);n<=.001||(e.position.z-=.32*n,e.position.y-=.06*n,e.fov-=2.6*n,e.updateProjectionMatrix())}drawFlash(e,t,n,r){let{k:i,color:a}=this.level(t);if(i<=.01)return;let o=e.createRadialGradient(n/2,r/2,Math.min(n,r)*.3,n/2,r/2,n*.75);o.addColorStop(0,Q(a,0)),o.addColorStop(1,Q(a,.28*i)),e.fillStyle=o,e.fillRect(0,0,n,r)}},$h=.2,eg={block:`HUP!`,slash:`WHOOSH`,stab:`TICK TICK`,flourish:`3, 2…`},tg={perfect:1,great:.7,good:.45,miss:0};function ng(e){let{audio:t,engine:n,session:r,chart:i,arena:a,camera:o,keys:s}=e,c=60/i.tempo.bpmAtBeat(0),l=new Gh(t),u=t.createGain();u.gain.value=.9,l.bus.connect(u).connect(n.output);let d=new Qh,f=new Map,p=e=>{let r=t.currentTime;e.events.forEach((t,i)=>{if(!(n.ctxTimeFor(t.time)<=r))for(let t of e.nodes[i]??[])try{t.stop()}catch{}})},m=[r.bus.on(`cues`,e=>{for(let t of e)f.set(t.id,{cue:t,events:Jh(t.action,t.time,c),nodes:[]})}),r.bus.on(`cuesDropped`,e=>{for(let t of e){let e=f.get(t);e&&(p(e),f.delete(t))}}),r.bus.on(`action`,e=>{if(!e.hit||e.kind===`holdEnd`)return;let t=r.conductor.cues[e.noteId],n=Math.max(t?.time??e.time,e.time);d.punch(n,tg[e.judgement]*(e.action===`flourish`?1.4:1),I[e.action].color)})],h=()=>{let e=t.currentTime;for(let[t,i]of f)i.events.forEach((t,a)=>{if(i.nodes[a])return;let o=n.ctxTimeFor(t.time);if(o>e+$h)return;let s=r.conductor.playAt(t.time)?.bar??i.cue.bar;i.nodes[a]=o<e-.03?[]:l.play(t.kind,Math.max(o,e),t.dur,s,t.step)}),n.ctxTimeFor(i.cue.time)<e-2&&f.delete(t)},g=e=>{let t=null;for(let n of f.values()){let i=n.events[0].time;e<i||e>n.cue.time+.08||r.judge.isVoid(n.cue.id)||n.cue.removed||(!t||n.cue.time<t.cue.time)&&(t={cue:n.cue,progress:Math.min(1,(e-i)/Math.max(.01,n.cue.time-i))})}return t};return{update:e=>{h(),d.apply(o,e);let t=a.enemyRig();if(!t)return;let n=Yh(r.conductor.beatAt(e),36,20),i=n>0?g(e):null;i&&(t.icon.visible=!0,t.icon.material=t.iconMats[i.cue.action],t.icon.material.opacity=n*(.55+.45*i.progress),t.icon.scale.setScalar(.55+.25*i.progress))},drawHud:(e,t,n,i)=>{d.drawFlash(e,t,n,i);let o=r.conductor.beatAt(t),c=Yh(o,36,20);if(e.textAlign=`center`,e.textBaseline=`middle`,c>0){let r=g(t),l=a.enemyScreen();if(r&&l){let t=I[r.cue.action].color,n=_.indexOf(r.cue.action);e.globalAlpha=c,e.font=`bold 26px monospace`,e.fillStyle=t,e.shadowColor=t,e.shadowBlur=10,e.fillText(Pt(s[n]??``),l.x+62,l.y-6),e.shadowBlur=0,e.font=`bold 15px monospace`,e.textAlign=`right`,e.fillText(eg[r.cue.action],l.x-48,l.y-6),e.textAlign=`center`,e.globalAlpha=1}o>32&&(e.font=`bold 15px monospace`,e.fillStyle=Q(`#e6ffe9`,Math.min(1,(1-c)*3)*.9),e.fillText(`THE KEYS FADE OUT · KEEP LISTENING`,n/2,i*.2))}else o<64&&(e.font=`bold 16px monospace`,e.fillStyle=`rgba(230,255,233,0.85)`,e.fillText(`EARS ONLY`,n/2,i*.2))},dispose:()=>{m.forEach(e=>e());for(let e of f.values())p(e);f.clear(),l.dispose(),u.disconnect()}}}var rg={key:`by-ear`,label:`BY EAR · SOUND CUES ONLY`,tagline:`No highway, no icons: every move is announced by its own sound a beat ahead.`,hypothesis:`With a distinct audio count-in per action at a fixed musical lead, players can play by ear with their eyes on the fight and rate control and music connection at least as high as baseline, so the game can be fully music-first.`,inspiration:[`Rhythm Heaven`,`Rhythm Doctor`,`Patapon`],howTo:[`No cues on screen: each move is announced by a sound, and you hit on the next beat.`,`"HUP!" = A block · rising whoosh = S slash · tick-tick = D stab.`,`A voice counting "three, two" = F flourish: hit on the "one".`,`The first enemy shows the key with each sound, then it is ears only.`],options:{highway:!1,laneLabels:!1,enemyIcon:!1,musicMapping:`sword`,keyLegend:`A S D F`},chart:Vh,create:ng},ig=new Map;function ag(e,t,n,r){let i=`${e}@${r}`,a=ig.get(i);if(!a){let e=[...t.keys()];a=w(e.map(e=>t.get(e)),n,r).then(t=>new Map(e.map((e,n)=>[e,t[n]]))),ig.set(i,a)}return a}var og=class{ctx;bus;buffers=null;live=new Set;noise=null;disposed=!1;constructor(e){this.ctx=e,this.bus=e.createGain()}load(e,t,n){return ag(e,t,n,this.ctx.sampleRate).then(e=>{this.disposed||(this.buffers=e)})}get ready(){return this.buffers!==null}hit(e,t,n,r=1){let i=this.buffers?.get(D(e));if(!i||this.disposed)return null;let{ctx:a}=this,o=qh(t,a.currentTime,n),s=a.createBufferSource();s.buffer=i;let c=a.createBiquadFilter();c.type=`highshelf`,c.frequency.value=2500,c.gain.value=o.shelfDb;let l=a.createBiquadFilter();l.type=`lowpass`,l.frequency.value=o.lowpassHz;let u=a.createGain();return u.gain.value=o.gain*r,s.connect(c).connect(l).connect(u).connect(this.bus),this.track(s),s.start(o.when),o.when}thunk(e=this.ctx.currentTime){if(this.disposed)return;let{ctx:t}=this,n=t.createOscillator();n.frequency.setValueAtTime(140,e),n.frequency.exponentialRampToValueAtTime(48,e+.09);let r=t.createGain();r.gain.setValueAtTime(0,e),r.gain.linearRampToValueAtTime(.32,e+.004),r.gain.exponentialRampToValueAtTime(1e-4,e+.14);let i=t.createBiquadFilter();i.type=`lowpass`,i.frequency.value=380,n.connect(r).connect(i).connect(this.bus),this.track(n),n.start(e),n.stop(e+.16),this.noiseHit(e,`lowpass`,700,.12,.05)}ghost(e,t=this.ctx.currentTime){if(this.disposed)return;let n={block:300,slash:1500,stab:3200,flourish:2200}[e];this.noiseHit(t,`bandpass`,n,.07,.035)}dispose(){this.disposed=!0;for(let e of this.live)try{e.stop()}catch{}this.live.clear(),this.bus.disconnect()}noiseHit(e,t,n,r,i){let{ctx:a}=this;if(!this.noise){this.noise=a.createBuffer(1,Math.ceil(a.sampleRate*.25),a.sampleRate);let e=this.noise.getChannelData(0),t=4242;for(let n=0;n<e.length;n++)t=t*1103515245+12345&2147483647,e[n]=t/2147483647*2-1}let o=a.createBufferSource();o.buffer=this.noise;let s=a.createBiquadFilter();s.type=t,s.frequency.value=n,s.Q.value=1.4;let c=a.createGain();c.gain.setValueAtTime(0,e),c.gain.linearRampToValueAtTime(r,e+.002),c.gain.exponentialRampToValueAtTime(1e-4,e+i),o.connect(s).connect(c).connect(this.bus),this.track(o),o.start(e,0,i+.02)}track(e){this.live.add(e),e.onended=()=>this.live.delete(e)}};function sg(e,t){let n=null,r=e.bus.on(`input`,e=>{if(!e.down)return;let r={lane:e.lane,time:e.time,judged:!1};n=r,queueMicrotask(()=>{r.judged||t(r.lane,r.time)})}),i=e.bus.on(`judgement`,e=>{n&&n.lane===e.lane&&e.kind!==`holdEnd`&&(n.judged=!0)});return()=>{r(),i()}}var cg=`none`,lg={perfect:1,great:.7,good:.45,miss:0},ug=.16;function dg(e,t){let n=Math.floor(e/4),r=e/4-n;if(n<2)return{phase:`intro`,x:null,frac:r};let i=t[Math.floor((n-2)/2)];return i?{phase:n===i.callBar?`call`:`response`,x:i,frac:r}:{phase:`outro`,x:null,frac:r}}function fg(t){let{audio:n,engine:r,session:i,chart:o,arena:s,camera:c,keys:u}=t,d=new og(n);d.bus.connect(r.musicBus),d.load(`${f}:answers`,e(a()),124);let p=new Qh,m=new Map,h=new Map,g=e=>o.tempo.beatToSec(e),v=(e,t=.32)=>{let{phase:n,x:r}=dg(i.conductor.beatAt(e),l);if(n!==`call`||!r)return null;let a=null;for(let n of r.notes){let i=g(r.callBar*4+n.beat),o=Zh(e-i,.12,t);o>0&&(!a||o>a.k)&&(a={action:n.action,k:o,at:i})}return a};s.setEnemyPoseFilter(e=>{let{phase:t}=dg(i.conductor.beatAt(e.t),l);if(t===`call`){let t=v(e.t);return{...e,next:t&&{action:t.action,progress:t.k}}}return t===`response`?{...e,next:null}:e});let y=[i.bus.on(`judgement`,e=>{if(e.kind===`holdEnd`)return;let t=i.conductor.cues[e.noteId],n=t&&o.notes[t.noteId];if(!t||!n)return;let a=e.judgement===`miss`?e.time:Math.max(t.time,e.time);if(m.set(D(n.beat),{judgement:e.judgement,at:a}),e.judgement===`miss`){d.thunk();return}d.hit(n.beat,r.ctxTimeFor(t.time),e.judgement);let s=lg[e.judgement]*(n.action===`flourish`?1.5:1);p.punch(a,s,I[n.action].color);let c=l.find(e=>e.responseBar===Math.floor(n.beat/4));c&&c.notes.map(e=>m.get(D(c.responseBar*4+e.beat))).every(e=>e&&e.judgement!==`miss`)&&h.set(c.index,a)}),sg(i,e=>d.ghost(_[e]??`block`))],b=(e,t,n)=>{let{phase:r,x:a,frac:o}=dg(i.conductor.beatAt(t),l);if(r===`outro`)return;let s=Math.min(520,n*.46),c=n/2-s/2,u=r===`call`,d=u?$.danger:$.green;e.fillStyle=`rgba(0,10,4,0.62)`,e.strokeStyle=Q(d,.7),e.lineWidth=1.5,e.beginPath(),e.roundRect(c,50,s,54,8),e.fill(),e.stroke();let f=e=>c+22+e/4*(s-44);for(let t=0;t<4;t++){let n=Math.floor(o*4)===t;e.fillStyle=Q(d,n?.75:.25),e.beginPath(),e.arc(f(t),95,n?3.5:2.5,0,Math.PI*2),e.fill()}e.fillStyle=Q(d,.5),e.fillRect(f(o*4)-1,56,2,42),e.textAlign=`right`,e.textBaseline=`middle`,e.font=`bold 18px monospace`;let p=r===`intro`?`GET READY`:u?`LISTEN`:`ANSWER`,_=u?.65+.35*(1-o*4%1)**2:1;if(e.fillStyle=Q(u?`#ff8a8a`:`#e6ffe9`,_),e.fillText(p,c-14,77),e.textAlign=`center`,!a)return;for(let n of a.notes){let r=f(n.beat),i=I[n.action].color;if(u){let o=g(a.callBar*4+n.beat);if(t<o-.03)continue;let s=Xh(t-o);yp(e,n.action,r,73,13+7*s,i)}else{let o=m.get(D(a.responseBar*4+n.beat));if(!o)e.globalAlpha=ug,yp(e,n.action,r,73,13,i),e.globalAlpha=1;else if(o.judgement===`miss`)e.globalAlpha=.35,yp(e,n.action,r,73,12,`#7a2a2a`),e.globalAlpha=1,e.strokeStyle=$.danger,e.lineWidth=2.5,e.beginPath(),e.moveTo(r-9,64),e.lineTo(r+9,82),e.moveTo(r+9,64),e.lineTo(r-9,82),e.stroke();else{let a=Xh(t-o.at);e.shadowColor=i,e.shadowBlur=8+14*a,yp(e,n.action,r,73,14+8*a,i),e.shadowBlur=0}}}let v=h.get(a.index);if(!u&&v!==void 0&&t-v<.9){let r=Math.min(1,(t-v)/.9);e.globalAlpha=1-r,e.font=`bold ${Math.round(22+8*(1-r))}px monospace`,e.fillStyle=$.white,e.fillText(`ECHO!`,n/2,128+14*r),e.globalAlpha=1}};return{update:e=>{p.apply(c,e);let t=s.enemyRig(),n=v(e,.45);if(!t||!n)return;let r=Xh(e-n.at);t.root.scale.multiplyScalar(1+.12*r),t.root.position.z+=.35*r,t.icon.visible=!0,t.icon.material=t.iconMats[n.action],t.icon.material.opacity=Math.min(1,n.k*1.4),t.icon.scale.setScalar(.55+.45*n.k+.25*r)},drawHud:(e,t,n,r)=>{p.drawFlash(e,t,n,r),b(e,t,n);let i=v(t,.45),a=s.enemyScreen();if(i&&a){let t=_.indexOf(i.action);e.globalAlpha=Math.min(1,i.k*1.4),e.font=`bold 24px monospace`,e.fillStyle=I[i.action].color,e.textAlign=`center`,e.fillText(Pt(u[t]??``),a.x+64,a.y-4),e.globalAlpha=1}},dispose:()=>{y.forEach(e=>e()),s.setEnemyPoseFilter(null),d.dispose()}}}var pg={key:`call-response`,label:`CALL & RESPONSE · ANSWER THE ENEMY`,tagline:`The enemy plays a one-bar phrase; you play it back in the next bar. No highway.`,hypothesis:`Listen-and-repeat turns the duel into a musical conversation: with no highway, players watch the enemy, remember its phrase and answer it, and rate fun and music connection above baseline.`,inspiration:[`Patapon`,`Rhythm Heaven`,`Simon`],howTo:[`The enemy plays a short phrase (LISTEN): watch its poses and the icons it shows.`,`Next bar (ANSWER), play the same phrase back in the same rhythm.`,`A block · S slash · D stab · F flourish. Your answers play the notes.`],options:{highway:!1,enemyIcon:!1,musicMapping:cg,keyLegend:`A S D F`},chart:Hh,create:fg},mg=[`808`,`LEAD`,`SNARE`,`VOX`],hg={perfect:1,great:.7,good:.45,miss:0},gg={key:`keysound`,label:`KEYSOUND · YOU PLAY THE SONG`,tagline:`The cue notes are cut from the song: only your hits play them, on the beat.`,hypothesis:`When the cue notes sound only on your hits (808s, lead notes, snares, vocal chops), every press feels like authorship and the music connection score beats baseline; the "not right" feeling comes from the song playing every cue note whether or not you press.`,inspiration:[`beatmania IIDX`,`DJMAX`,`Rock Band`,`Hi-Fi Rush`],howTo:[`The song is missing its 808s, lead notes, snares and vocal chops. You play them.`,`Same four lanes: A 808 (block) · S lead (slash) · D snare (stab) · F vocals (flourish).`,`Each hit sounds on the beat, brightest on PERFECT. A miss leaves a hole in the song.`],options:{musicMapping:cg,keyLegend:`A S D F`},chart:Bh,create:t=>{let{audio:n,engine:r,session:i,chart:a,arena:o,camera:s}=t,c=new og(n);c.bus.connect(r.musicBus),c.load(Lt,e(h(Lt)),a.tempo.bpmAtBeat(0));let l=new Qh,u=_.map(()=>-10),d=[i.bus.on(`judgement`,e=>{if(e.kind===`holdEnd`)return;let t=i.conductor.cues[e.noteId],n=t&&a.notes[t.noteId];if(!t||!n)return;if(e.judgement===`miss`){c.thunk();return}c.hit(n.beat,r.ctxTimeFor(t.time),e.judgement);let o=Math.max(t.time,e.time);u[e.lane]=o;let s=hg[e.judgement]*(n.action===`flourish`?1.4:1);l.punch(o,s,I[n.action].color)}),sg(i,e=>c.ghost(_[e]??`block`))];return{update:e=>l.apply(s,e),drawHud:(e,t,n,r)=>{l.drawFlash(e,t,n,r);let i=o.laneScreen(),a=((i.xs[0]??0)+(i.xs[3]??0))/2;e.textAlign=`center`,e.textBaseline=`middle`,_.forEach((n,o)=>{let s=i.xs[o]??0,c=s+(s-a)*.35,l=Xh(t-u[o]),d=I[n].color;e.font=`bold ${Math.round(13+5*l)}px monospace`,e.fillStyle=Q(d,.55+.45*l),e.shadowColor=d,e.shadowBlur=12*l,e.fillText(mg[o],c,r-88-4*l),e.shadowBlur=0})},dispose:()=>{d.forEach(e=>e()),c.dispose()}}}},_g=class{scene;max;mesh;pos;col;p=[];v=[];c=[];life;maxLife;next=0;constructor(e,t=320){this.scene=e,this.max=t,this.pos=new Float32Array(t*6),this.col=new Float32Array(t*6),this.life=new Float32Array(t),this.maxLife=new Float32Array(t);for(let e=0;e<t;e++)this.p.push(new K),this.v.push(new K),this.c.push(new J);let n=new Ra;n.setAttribute(`position`,new Ca(this.pos,3)),n.setAttribute(`color`,new Ca(this.col,3)),this.mesh=new ns(n,new Wo({vertexColors:!0,transparent:!0,blending:2,depthWrite:!1,depthTest:!1})),this.mesh.frustumCulled=!1,this.mesh.renderOrder=14,e.add(this.mesh)}burst(e,t,n,r,i){let a=new J(t),o=new J(`#ffffff`);for(let t=0;t<n;t++){let t=this.next;this.next=(this.next+1)%this.max,this.p[t].copy(e);let n=r*(.45+Math.random()*.75);this.v[t].set(Math.random()-.5,Math.random()-.35,Math.random()-.5).normalize().multiplyScalar(.8).add(i).normalize().multiplyScalar(n);let s=.18+Math.random()*.3;this.life[t]=s,this.maxLife[t]=s,this.c[t].copy(a).lerp(o,Math.random()*.7)}}update(e){let{pos:t,col:n}=this;for(let r=0;r<this.max;r++){let i=this.life[r],a=r*6;if(i<=0){t.fill(0,a,a+6),n.fill(0,a,a+6);continue}i-=e,this.life[r]=i;let o=this.v[r],s=this.p[r];o.y-=9*e,o.multiplyScalar(Math.max(0,1-2.5*e)),s.addScaledVector(o,e);let c=Math.max(0,i/this.maxLife[r]),l=.035+.02*c;t[a]=s.x,t[a+1]=s.y,t[a+2]=s.z,t[a+3]=s.x-o.x*l,t[a+4]=s.y-o.y*l,t[a+5]=s.z-o.z*l;let u=this.c[r];n[a]=u.r*c,n[a+1]=u.g*c,n[a+2]=u.b*c,n[a+3]=u.r*c*.3,n[a+4]=u.g*c*.3,n[a+5]=u.b*c*.3}this.mesh.geometry.attributes.position.needsUpdate=!0,this.mesh.geometry.attributes.color.needsUpdate=!0}dispose(){this.scene.remove(this.mesh),this.mesh.geometry.dispose(),this.mesh.material.dispose()}};function vg(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`),n=t.createRadialGradient(64,64,0,64,64,64);n.addColorStop(0,`rgba(255,255,255,1)`),n.addColorStop(.18,`rgba(255,255,255,0.55)`),n.addColorStop(.5,`rgba(255,255,255,0.08)`),n.addColorStop(1,`rgba(255,255,255,0)`),t.fillStyle=n,t.fillRect(0,0,128,128),t.fillStyle=`rgba(255,255,255,0.95)`;for(let[e,n]of[[64,5],[5,64]])t.beginPath(),t.moveTo(64-e,64),t.quadraticCurveTo(64,64,64,64-n),t.quadraticCurveTo(64,64,64+e,64),t.quadraticCurveTo(64,64,64,64+n),t.quadraticCurveTo(64,64,64-e,64),t.fill();let r=new is(e);return r.colorSpace=dr,r}var yg=class{parent;sprite;mat;constructor(e,t){this.parent=e,this.mat=new Ja({map:t,transparent:!0,depthTest:!1,depthWrite:!1,blending:2}),this.sprite=new co(this.mat),this.sprite.renderOrder=15,this.sprite.visible=!1,e.add(this.sprite)}set(e,t,n,r,i=0){this.sprite.visible=n>.01,this.sprite.visible&&(this.sprite.position.copy(e),this.mat.color.set(t).multiplyScalar(Math.min(2,.6+n)),this.mat.opacity=Math.min(1,n),this.mat.rotation=i,this.sprite.scale.setScalar(r))}dispose(){this.parent.remove(this.sprite),this.mat.dispose()}},bg=class{ctx;noise=null;out;constructor(e,t,n=1){this.ctx=e,this.out=e.createGain(),this.out.gain.value=n,this.out.connect(t)}noiseBuf(){if(!this.noise){let{ctx:e}=this;this.noise=e.createBuffer(1,Math.floor(e.sampleRate*.6),e.sampleRate);let t=this.noise.getChannelData(0);for(let e=0;e<t.length;e++)t[e]=Math.random()*2-1}return this.noise}dest(e){if(e===0||!(`createStereoPanner`in this.ctx))return this.out;let t=this.ctx.createStereoPanner();return t.pan.value=Math.max(-1,Math.min(1,e)),t.connect(this.out),t}tone(e,t,n,r,i,a,o=0,s=.002){let{ctx:c}=this,l=c.createOscillator();l.type=t,l.frequency.setValueAtTime(n,e),l.frequency.exponentialRampToValueAtTime(Math.max(20,r),e+a);let u=c.createGain();return u.gain.setValueAtTime(1e-4,e),u.gain.exponentialRampToValueAtTime(i,e+s),u.gain.exponentialRampToValueAtTime(1e-4,e+a),l.connect(u).connect(this.dest(o)),l.start(e),l.stop(e+a+.03),l}noiseBurst(e,t,n,r,i,a,o=0,s=1.2,c=.002){let{ctx:l}=this,u=l.createBufferSource();u.buffer=this.noiseBuf();let d=l.createBiquadFilter();d.type=t,d.Q.value=s,d.frequency.setValueAtTime(n,e),d.frequency.exponentialRampToValueAtTime(Math.max(20,r),e+a);let f=l.createGain();f.gain.setValueAtTime(1e-4,e),f.gain.exponentialRampToValueAtTime(i,e+c),f.gain.exponentialRampToValueAtTime(1e-4,e+a),u.connect(d).connect(f).connect(this.dest(o)),u.start(e,Math.random()*.1,a+.05)}metal(e,t,n,r,i=0){for(let[a,o,s]of[[1,1,1],[2.76,.55,.7],[5.4,.35,.45],[8.93,.18,.3]])this.tone(e,a>5?`sine`:`triangle`,t*a,t*a*.995,n*o,r*s,i);this.noiseBurst(e,`highpass`,6e3,3e3,n*.9,.04,i,.8)}},xg=[`left`,`right`,`low`,`high`],Sg=[`KeyA`,`KeyF`,`KeyS`,`KeyD`],Cg=[`ArrowLeft`,`ArrowRight`,`ArrowDown`,`ArrowUp`],wg={left:{label:`LEFT`,arrow:`←`,color:`#45c8ff`,sx:-1,sy:0,pitch:880,pan:-.65,yaw:.5,tilt:0},right:{label:`RIGHT`,arrow:`→`,color:`#ff4fd8`,sx:1,sy:0,pitch:1175,pan:.65,yaw:-.5,tilt:0},low:{label:`LOW`,arrow:`↓`,color:`#ffb22e`,sx:0,sy:-1,pitch:587,pan:0,yaw:0,tilt:-.22},high:{label:`HIGH`,arrow:`↑`,color:`#ff3b5c`,sx:0,sy:1,pitch:1480,pan:0,yaw:0,tilt:.2}};function Tg(e){let t=60/e;return{warn:t*2,windup:t,swing:Math.min(.09,t/4),recover:.08}}function Eg(e,t,n){let r=-1;for(let n=0;n<e.length&&e[n].time<=t;n++)r=n;let i=r>=0?e[r]:null,a=e[r+1]??null,o=i?t-i.time:1/0;if(!a)return{next:null,windup:0,swing:0,last:i,lastAge:o};let s=a.time-n.swing,c=i?i.time+n.recover:-1/0,l=Math.min(s,Math.max(c,s-n.windup)),u=s-l;return{next:a,windup:1-(1-(u<=1e-6?+(t>=l):Ag((t-l)/u)))**3,swing:t<=s?0:Ag((t-s)/n.swing)**2,last:i,lastAge:o}}function Dg(e,t,n){return Ag(1-(e-t)/n)}var Og={gain:{perfect:1,great:.75,good:.45,miss:-.75},fill:.8},kg=class{value=0;capacity;constructor(e){this.capacity=Math.max(1,(e-1)*Og.fill)}apply(e){let t=this.full;return this.value=Math.max(0,Math.min(this.capacity,this.value+Og.gain[e])),!t&&this.full}get ratio(){return this.value/this.capacity}get full(){return this.value>=this.capacity-1e-9}};function Ag(e){return e<0?0:e>1?1:e}var jg={armX:-1.15,armY:0,armZ:.2,offX:-.5,offZ:.25,twist:0,lean:0,crouch:0,fwd:0},Mg={left:{armX:0,armY:-.7,armZ:-1.65,offX:-.9,offZ:.6,twist:-.6,lean:-.1},right:{armX:0,armY:-.35,armZ:1.45,offX:-.2,offZ:1.1,twist:.7,lean:-.1},high:{armX:-3.15,armY:0,armZ:.12,offX:-2.6,offZ:-.2,lean:-.3,crouch:.06},low:{armX:.45,armY:0,armZ:-1.05,offX:.3,twist:-.5,lean:.3,crouch:-.34}},Ng={left:{armX:0,armY:1.25,armZ:-1.5,twist:.35,lean:.12,fwd:.95},right:{armX:0,armY:-1.5,armZ:1.5,twist:-.35,lean:.12,fwd:.95},high:{armX:-1.6,armY:0,armZ:.1,offX:-1.2,lean:.32,crouch:-.1,fwd:.95},low:{armX:-.55,armY:0,armZ:-.15,twist:.3,lean:.45,crouch:-.36,fwd:.95}},Pg={left:{armX:-.4,armY:-.4,armZ:-2,twist:-.45,lean:-.3,fwd:.15},right:{armX:-.4,armY:-.2,armZ:1.95,twist:.5,lean:-.3,fwd:.15},high:{armX:-3.5,armZ:.3,lean:-.42,crouch:.04,fwd:.05},low:{armX:.35,armZ:-.4,twist:-.3,lean:-.25,crouch:-.12,fwd:.1}},Fg={left:{armX:0,armY:2.15,armZ:-1.45,twist:.75,lean:.2,fwd:1.15},right:{armX:0,armY:-2.3,armZ:1.45,twist:-.75,lean:.2,fwd:1.15},high:{armX:-.75,armZ:.1,lean:.5,crouch:-.15,fwd:1.15},low:{armX:-.1,armZ:0,twist:.65,lean:.5,crouch:-.36,fwd:1.15}},Ig={armX:-.2,armY:0,armZ:.5,offX:-.1,offZ:.4,lean:.55,crouch:-.32,twist:.15};function Lg(e,t,n){let r={...e};for(let i of Object.keys(t))r[i]=e[i]+(t[i]-e[i])*n;return r}function Rg(e){return{...jg,...e}}function zg(e,t,n){e.weaponArm.rotation.set(t.armX,t.armY,t.armZ),e.offArm.rotation.set(t.offX,0,t.offZ),e.body.rotation.set(0,t.twist,0),e.torso.rotation.x=t.lean,e.head.rotation.x=-t.lean*.4,e.body.position.y=t.crouch*n}function Bg(e,t,n){e.noiseBurst(n,`bandpass`,2400,900,.09,.07,t.pan*.7,1.5)}function Vg(e,t,n,r){let i=n?.2:.15;e.metal(r,t.pitch,i,n?.55:.4,t.pan),e.metal(r,t.pitch*1.5,i*.35,.25,t.pan),e.tone(r,`square`,t.pitch*.5,t.pitch*.35,i*.35,.05,t.pan),e.noiseBurst(r,`bandpass`,3800,1800,i*1.6,.06,t.pan,2),n&&e.noiseBurst(r+.01,`highpass`,7e3,11e3,.07,.3,t.pan,.7,.01)}function Hg(e,t,n){e.tone(n,`sine`,150,45,.5,.28,t.pan*.8),e.noiseBurst(n,`lowpass`,1800,200,.45,.2,t.pan*.8,.8),e.tone(n,`square`,90,60,.08,.12,t.pan*.8)}function Ug(e,t){e.tone(t,`sawtooth`,220,880,.05,.35,0,.05),e.metal(t+.02,1760,.08,.6)}function Wg(e,t,n){e.tone(n,`sine`,t?90:140,30,t?.7:.45,t?.7:.4),e.noiseBurst(n,`bandpass`,900,7e3,t?.35:.2,.28,0,1.4,.01),e.metal(n,t?1175:1480,t?.16:.1,t?1.1:.6),t&&e.metal(n+.06,2349,.07,.9)}var Gg={position:[0,7.5,8.5],lookAt:[0,.6,-2.4],fov:30},Kg=new K(0,1.55,-.9),qg={left:new K(-1,1.55,-.9),right:new K(1,1.55,-.9),high:new K(0,2.45,-.9),low:new K(0,.7,-.9)},Jg={right:0,low:Math.PI/2,left:Math.PI,high:-Math.PI/2},Yg=.62,Xg=.05,Zg=.17,Qg=.06,$g={key:`parry`,label:`PARRY · DIRECTIONAL DEFLECTS`,tagline:`Every cue is a strike from a side: press that direction on the beat to deflect it.`,hypothesis:`Direction is intuitive (no symbol-to-key memory), action and reaction happen in the same instant, and a crisp deflect (clang, sparks, hit-stop, blade snap) is the most satisfying rhythm-combat verb; a posture meter that ends in a finisher makes each enemy a little story.`,inspiration:[`Sekiro (deflects, posture)`,`Punch-Out!! (dodges)`,`Beat Saber (directions)`],howTo:[`The enemy swings at you from a side. Press that side as its warning arc closes on the beat.`,`A ←  ·  S ↓  ·  D ↑  ·  F →   (arrow keys work too)`,`Clean deflects fill the enemy’s POSTURE bar; full posture turns its last blow into a DEATHBLOW.`],options:{highway:!1,laneLabels:!1,enemyIcon:!1,musicMapping:`instruments`,keys:Sg,altKeys:Cg,keyLegend:`A ←   S ↓   D ↑   F →`},create:e=>e_(e)};function e_(e){let{arena:n,session:r,chart:i,scene:a,camera:o}=e,s=i.tempo.bpmAtBeat(0),c=Tg(s),l=pe.walkInBeats*60/s,u=new bg(e.audio,e.sfx.output,.9);n.view={...Gg},n.duelEffects=!1,n.pressMove=()=>`block`,n.telegraph=(e,t,n,r)=>({encounter:e,enterAge:r-t,next:null,last:null});let d=vg(),f=new _g(a),p=new Rm(a,300),m=new Lm(a),h=Array.from({length:4},()=>({glint:new yg(a,d),at:-10,life:.1,size:1,color:`#ffffff`,pos:new K})),g=0,_=(e,t,n,r)=>{let i=h[g];g=(g+1)%h.length,i.pos.copy(e),i.color=t,i.size=n,i.life=r,i.at=w},v=new Map,y=e=>{let t=v.get(e);return t||(t=new kg(i.encounters[e]?.noteIds.length??8),v.set(e,t)),t},b=new Map,x=[,,,,].fill(-10),S=[,,,,].fill(-10),C=[,,,,].fill(!1),w=0,T=-10,E=-10,D={yaw:0,tilt:0,at:-10,hold:.22},O=0,k={sx:0,sy:0,amp:0,at:-10},A=null,j=-10,ee=-10,M=null,N=null,P=new K,F=new K,te=new K,I=()=>{let e=document.getElementById(`app`);e&&(e.classList.remove(`glitch`),e.offsetWidth,e.classList.add(`glitch`))},ne=(t,r,i,a,o)=>{let s=wg[t],c=r===`perfect`;Vg(u,s,c,e.audio.currentTime);let l=qg[t];f.burst(l,s.color,c?46:30,c?7:5.5,P.set(s.sx*.9,s.sy*.7+.45,.35)),_(l,c?`#ffffff`:s.color,c?2.6:1.9,.16),_(l,s.color,c?4.2:3,.26),T=o,E=o+Xg,n.hitStop(Xg,o),O=c?.2:.13,D={yaw:s.yaw,tilt:s.tilt,at:w,hold:.22},c&&(j=w),y(i).apply(r)&&!a&&(Ug(u,e.audio.currentTime+.03),ee=w),a&&(M={k:i,at:w,deathblow:y(i).full,riposted:!1,shattered:!1,dir:t})},re=(t,r)=>{let i=wg[t];y(r).apply(`miss`),Hg(u,i,e.audio.currentTime),k={sx:-i.sx,sy:-i.sy,amp:.55,at:w},A={d:t,at:w},D={yaw:-i.yaw*.8,tilt:.16-i.tilt*.5,at:w,hold:.3},n.hurtHero(w),I()},L=[r.bus.on(`input`,t=>{if(!t.down)return;let n=xg[t.lane];if(!n)return;let r=wg[n];x[t.lane]=w,Bg(u,r,e.audio.currentTime),D={yaw:r.yaw*.7,tilt:r.tilt*.7,at:w,hold:.16}}),r.bus.on(`action`,e=>{if(e.kind===`holdEnd`)return;let t=xg[e.lane];t&&(S[e.lane]=w,C[e.lane]=e.hit,e.hit?(b.set(e.noteId,e.time),ne(t,e.judgement,e.encounter,e.final,e.time)):re(t,e.encounter))})],ie=r=>{if(!M)return;let a=r-M.at;if(!M.riposted&&a>=Qg&&(M.riposted=!0,n.playHeroMove(`stab`),D={yaw:0,tilt:-.12,at:w,hold:.3}),!M.shattered&&a>=Zg){M.shattered=!0;let r=i.encounters[M.k]?.enemy??`grunt`,a=t[r],o=P.set(0,1.3*a.scale,-Vp.duelDistance+.6),s=M.deathblow;Wg(u,s,e.audio.currentTime),p.burst(o,a.accent,s?60:36,s?8:6,F.set(0,.3,-1),1.4),p.burst(o,s?$.danger:`#ffffff`,s?40:18,6,F.set(0,1,0),1),f.burst(o,s?$.danger:`#ffffff`,s?90:50,9,F.set(0,.6,.2)),_(o,s?$.danger:`#ffffff`,s?7:4.5,s?.45:.3),_(o,`#ffffff`,s?3.5:2.5,.18),T=w,E=w+(s?.11:.07),n.hitStop(s?.11:.07,w),O=s?.42:.28,j=w,N=s?{text:`DEATHBLOW`,color:$.danger,at:w}:{text:`RIPOSTE`,color:$.white,at:w}}},ae=(e,a)=>{let o=n.enemyRig(!0),s=r.duel.activeEncounter(e);if(!o||s===null)return;let u=r.duel.enemies[s],d=t[o.kind].scale;if(u.state===`escaped`)return;if(u.state===`defeated`){let t=M&&M.k===s&&!M.shattered;o.root.visible=!!t,t&&M&&(zg(o,Lg(Rg(Pg[M.dir]),Ig,Math.min(1,(e-M.at)/.08)),d),o.body.rotation.y+=Math.sin(e*90)*.05,o.root.position.z=-Vp.duelDistance+.2,o.root.scale.setScalar(1),o.root.position.y=0,o.bodyMat.emissive.set(`#ffffff`),o.bodyMat.emissiveIntensity=.6);return}if(!o.root.visible)return;let f=r.encounterCues(s).map(e=>{let t=b.get(e.id),n=i.lanes.indexOf(e.action);return{id:e.id,lane:n,time:t===void 0?e.time:Math.min(e.time,t)}});f.sort((e,t)=>e.time-t.time);let p=Eg(f,a,c),h={...jg},g=0,_=0;if(p.last&&p.lastAge<.6){let e=xg[p.last.lane];if(r.duel.outcome(p.last.id)===`hit`){let t=a-(b.get(p.last.id)??p.last.time),n=1-(1-Math.min(1,t/.1))**3;h=Lg(Rg(Ng[e]),Pg[e],n),h=Lg(h,jg,t_((t-.14)/.3)),_=Math.max(0,1-t/.12)}else{let t=p.lastAge,n=1-(1-Math.min(1,t/.12))**2;h=Lg(Rg(Ng[e]),Fg[e],n),h=Lg(h,jg,t_((t-.22)/.32))}}if(p.next){let t=xg[p.next.lane];if(p.windup>0){h=Lg(h,Mg[t],p.windup),g=p.windup;let n=Math.sin(e*75)*.04*p.windup*(1-p.swing);h.armZ+=n}p.swing>0&&(h=Lg(h,Ng[t],p.swing))}let y=v.get(s);y?.full&&(h=Lg(h,Ig,.18+.06*Math.sin(e*6))),zg(o,h,d);let x=Math.min(1,Math.max(0,(e-(r.encounterStart(s)??0))/l));o.root.position.z+=h.fwd*x;let S=p.next?xg[p.next.lane]:p.last?xg[p.last.lane]:null,C=S?wg[S].color:`#ffffff`;o.weaponMat.emissive.set(C).multiplyScalar(g*1.5).lerp(new J(`#ffffff`),_),y?.full&&(o.eyeMat.color.set($.danger),o.coreMat.color.set($.danger),o.core.scale.setScalar(1.4+.3*Math.sin(e*12))),(p.next&&p.swing>0||p.last&&p.lastAge<.1)&&S&&(o.root.updateMatrixWorld(!0),o.weaponTip.getWorldPosition(F),o.weaponArm.getWorldPosition(P),P.lerp(F,.45),m.setColor(C,0,.62),m.alpha=1,m.push(P,F,e))};return{update(e,t){w=e;let r=e>=T&&e<E?T:e;ie(e),ae(e,r),m.update(e),f.update(t),p.update(t);for(let t of h){let n=Math.max(0,1-(e-t.at)/t.life);t.glint.set(t.pos,t.color,n*1.4,t.size*(.7+.3*n),t.at*7)}let i=e-D.at,a=i<D.hold?1:Math.max(0,1-(i-D.hold)/.18),s=Math.min(1,i/.035);n.setHeroLean(D.yaw*a*s,D.tilt*a*s),O=Math.max(0,O-t*2),o.getWorldDirection(te),O>0&&o.position.addScaledVector(te,O*O*5);let c=e-k.at;if(c<.4){let e=k.amp*Math.exp(-c*9)*Math.cos(c*45);o.position.x+=k.sx*e+(Math.random()-.5)*.05*e,o.position.y+=k.sy*e*.6}},drawHud(i,a,o,s){let l=r.duel.activeEncounter(a),u=l===null?null:r.duel.enemies[l],d=u&&u.state!==`defeated`&&u.state!==`escaped`,f=n.toScreen(Kg),p=n.toScreen(qg.right),m=Math.max(60,Math.abs(p.x-f.x));i.save(),i.lineCap=`round`;for(let[t,n]of xg.entries()){let r=wg[n],o=Jg[n],s=Math.max(0,1-(a-x[t])/.15),c=Math.max(0,1-(a-S[t])/.28);i.strokeStyle=Q(c>0?C[t]?`#ffffff`:$.danger:r.color,(d?.22:.08)+.5*s+.7*c),i.lineWidth=3+4*s+6*c,i.beginPath(),i.arc(f.x,f.y,m*(1+.06*c),o-Yg,o+Yg),i.stroke();let l=f.x+Math.cos(o)*m,u=f.y+Math.sin(o)*m,p=(d?.75:.35)+.25*s;i.fillStyle=s>0?Q(r.color,.5*s+.2):`rgba(0,8,4,0.82)`,i.strokeStyle=Q(r.color,p),i.lineWidth=2,i.beginPath(),i.arc(l,u,12,0,Math.PI*2),i.fill(),i.stroke(),i.font=`bold 14px monospace`,i.textAlign=`center`,i.textBaseline=`middle`,i.fillStyle=s>0?$.white:Q(r.color,p),i.fillText(Pt(e.keys[t]??``),l,u+1)}for(let e of r.cuesBetween(a-.15,a+c.warn)){if(r.duel.outcome(e.id)!==`pending`)continue;let t=xg[e.lane];if(!t)continue;let n=wg[t],o=Dg(e.time,a,c.warn),s=a>e.time?Math.max(0,1-(a-e.time)/.15):1,l=Jg[t],u=m*(1+1.7*(1-o)),d=Math.min(1,o*3)*s,p=Yg*(.55+.45*o);i.shadowColor=n.color,i.shadowBlur=8+14*o,i.strokeStyle=Q(n.color,d),i.lineWidth=3+6*o*o,i.beginPath(),i.arc(f.x,f.y,u,l-p,l+p),i.stroke(),i.strokeStyle=Q(n.color,.25+.6*o*o*s),i.lineWidth=4+3*o,i.beginPath(),i.arc(f.x,f.y,m,l-Yg,l+Yg),i.stroke();let h=f.x+Math.cos(l)*(u+12),g=f.y+Math.sin(l)*(u+12);i.save(),i.translate(h,g),i.rotate(l),i.fillStyle=Q(n.color,d),i.beginPath(),i.moveTo(-6,0),i.lineTo(8,-9),i.lineTo(8,9),i.closePath(),i.fill(),i.restore(),i.shadowBlur=0}i.restore();let h=n.enemyRig(),g=h?n.toScreen(P.copy(h.root.position).setY(2.45*t[h.kind].scale)):null;if(l!==null&&g&&d){let e=v.get(l),t=e?.ratio??0,n=e?.full??!1,r=g.x,o=g.y-6;i.fillStyle=`rgba(0,0,0,0.6)`,i.fillRect(r-95-2,o-5,194,10);let s=Math.max(0,1-(a-ee)/.5),c=n?.75+.25*Math.sin(a*14):t;i.fillStyle=`rgb(255,${Math.round(190-150*c)},${Math.round(60-40*c)})`,i.shadowColor=n?$.danger:`#ffb22e`,i.shadowBlur=n?16:6,i.fillRect(r-95*t,o-3,190*t,6),i.shadowBlur=0,i.fillStyle=Q($.white,.75),i.font=`bold 11px monospace`,i.textAlign=`center`,i.fillText(n?`POSTURE BROKEN · DEFLECT ITS LAST BLOW`:`POSTURE`,r,o-14),s>0&&(i.strokeStyle=Q(`#ffffff`,s),i.lineWidth=2,i.strokeRect(r-95-4-8*(1-s),o-7,198+16*(1-s),14))}if(A){let e=Math.max(0,1-(a-A.at)/.4);if(e>0){let t=wg[A.d],n=t.sx<0?0:t.sx>0?o:o/2,r=t.sy>0?0:t.sy<0?s:s/2,a=t.sx===0?n:o/2,c=t.sy===0?r:s/2,l=i.createLinearGradient(n,r,n+(a-n)*.8,r+(c-r)*.8);l.addColorStop(0,Q($.danger,.55*e)),l.addColorStop(1,Q($.danger,0)),i.fillStyle=l,i.fillRect(0,0,o,s)}}let _=Math.max(0,1-(a-j)/.08);if(_>0&&(i.fillStyle=Q(`#ffffff`,.1*_),i.fillRect(0,0,o,s)),i.font=`bold 15px monospace`,i.textAlign=`center`,i.textBaseline=`middle`,[`left`,`low`,`high`,`right`].forEach((t,n)=>{let r=xg.indexOf(t),c=wg[t],l=o/2+(n-1.5)*78,u=s-34,d=Math.max(0,1-(a-x[r])/.15);i.fillStyle=d>0?Q(c.color,.35*d):`rgba(0,10,4,0.6)`,i.strokeStyle=Q(c.color,.55+.45*d),i.lineWidth=1.5+1.5*d,i.beginPath(),i.roundRect(l-33,u-16,66,32,6),i.fill(),i.stroke(),i.fillStyle=d>0?$.white:c.color,i.fillText(`${Pt(e.keys[r]??``)} ${c.arrow}`,l,u+1)}),N){let e=a-N.at;if(e<1.1){let t=Math.min(1,(1.1-e)/.3),n=1+.4*Math.max(0,1-e/.12);i.save(),i.globalAlpha=t,i.translate(o/2,s*.2),i.scale(n,n),i.shadowColor=N.color,i.shadowBlur=24,i.fillStyle=N.color,i.font=`bold ${N.text===`DEATHBLOW`?54:40}px monospace`,i.textAlign=`center`,i.fillText(N.text,0,0),i.restore()}}},dispose(){L.forEach(e=>e()),n.view=null,n.duelEffects=!0,n.pressMove=null,n.telegraph=null,n.setHeroLean(0,0),f.dispose();for(let e of h)e.glint.dispose();d.dispose(),a.remove(p.mesh),p.mesh.geometry.dispose(),p.mesh.material.dispose(),a.remove(m.mesh),m.mesh.geometry.dispose(),m.mesh.material.dispose(),u.out.disconnect()}}}function t_(e){let t=e<0?0:e>1?1:e;return t*t*(3-2*t)}function n_(e,t,n){switch(t){case`block`:e.noiseBurst(n,`bandpass`,1500,6200,.32,.2,-.2,7,.025),e.noiseBurst(n,`highpass`,5e3,9e3,.06,.16,-.2,1,.03),e.tone(n,`sawtooth`,1175,1245,.022,.2,-.2,.03),e.tone(n,`square`,1865,1975,.014,.18,-.2,.03);break;case`slash`:e.tone(n,`square`,1050,420,.13,.045,.15),e.tone(n,`triangle`,620,300,.2,.06,.15),e.noiseBurst(n,`bandpass`,2600,1600,.35,.03,.15,2.5);break;case`stab`:e.tone(n,`sine`,3520,3515,.12,.38),e.tone(n,`sine`,5274,5270,.045,.2),e.tone(n,`triangle`,7040,7030,.015,.07);break;case`flourish`:[1760,1480,1319,1480].forEach((t,r)=>{let i=e.tone(n+r*.055,`triangle`,t,t*.97,.075,.2),a=e.ctx.createOscillator();a.frequency.value=11;let o=e.ctx.createGain();o.gain.value=60,a.connect(o).connect(i.detune),a.start(n+r*.055),a.stop(n+r*.055+.24)})}}function r_(e){let t=60/e;return{lead:t,glint:t/2,snap:.3,fade:.12}}function i_(e,t,n){return t===null?n:Math.max(0,Math.min(n,e-t))}function a_(e,t){return e.map((n,r)=>{let i=r>0?e[r-1]:null;return n.time-i_(n.time,i?i.endTime??i.time:null,t)})}function o_(e,t,n){let r=-1;for(let n=0;n<e.length&&e[n].time<=t;n++)r=n;let i=r>=0?e[r]:null,a=e[r+1]??null,o=i?t-i.time:0,s=i?Math.max(0,1-o/n.fade):0,c=i?{cue:i,age:o}:null;if(!a)return{cue:null,raw:0,pose:0,glint:0,last:c,afterGlint:s};let l=i_(a.time,i?i.endTime??i.time:null,n.lead),u=a.time-l,d=l<=1e-6?1:c_((t-u)/l),f=c_(d/n.snap),p=t<u?0:1-(1-f)**3,m=Math.min(n.glint,l),h=m<=1e-6?0:c_((t-(a.time-m))/m);return{cue:a,raw:d,pose:p,glint:h*h,last:c,afterGlint:s}}function s_(e,t,n,r,i){if(e===null)return{encounter:null,enterAge:0,next:null,last:null};let a=o_(n,r,i);return{encounter:e,enterAge:r-t,next:a.cue?{noteId:a.cue.id,action:a.cue.action,time:a.cue.time,progress:a.pose}:null,last:a.last?{noteId:a.last.cue.id,action:a.last.cue.action,age:a.last.age}:null}}function c_(e){return e<0?0:e>1?1:e}var l_={position:[4.9,2,5.1],lookAt:[-.8,1.65,-3],fov:30},u_={block:`weapon up · scrape`,slash:`arms open · clack`,stab:`core glows · ting`,flourish:`dizzy · chime`},d_={key:`tells`,label:`TELLS · READ THE ENEMY`,tagline:`No highway, no icons: the enemy’s wind-up is the cue, always one beat before the hit.`,hypothesis:`If every enemy tell has the same musical lead (a pose and a sound exactly one beat before the hit, a glint on the last eighth), players read the enemy as precisely as a highway, and it feels like fighting instead of reading UI.`,inspiration:[`Punch-Out!!`,`Sekiro`,`Rhythm Heaven`],howTo:[`No lanes. Each enemy move has a tell exactly one beat before you strike: watch and listen.`,`Weapon raised + scrape → A BLOCK · arms thrown open + clack → S SLASH`,`Chest core glows + ting → D STAB · dizzy wobble + chime → F FLOURISH`,`Strike on the next beat, as the glint flashes.`],options:{highway:!1,laneLabels:!1,enemyIcon:!1,musicMapping:`instruments`,keyLegend:`A S D F`},create:e=>m_(e)};function f_(e,t,n){switch(t){case`block`:return e.weaponTip.getWorldPosition(n);case`slash`:return e.guardLine.getWorldPosition(n);case`stab`:return e.core.getWorldPosition(n);case`flourish`:return e.dizzy.getWorldPosition(n)}}function p_(e,n,r){let i=t[e.kind].scale,a=0;if(e.head.rotation.z=0,e.dizzy.scale.setScalar(1),e.guardLine.scale.y=1,n.cue){let t=n.pose,i=n.glint,o=Math.sin(r*80)*i;switch(n.cue.action){case`block`:e.weaponArm.rotation.x-=.4*t,e.weaponArm.rotation.z+=.06*o,e.offArm.rotation.x-=.5*t,e.torso.rotation.x-=.12*t,e.root.position.y+=.14*t,a=.12*t;break;case`slash`:e.weaponArm.rotation.z-=.25*t,e.offArm.rotation.z+=.25*t,e.weaponArm.rotation.x+=.6*t,e.offArm.rotation.x+=.6*t,e.torso.rotation.x-=.18*t,e.guardLine.scale.y=1+1.5*t+2*i,e.body.rotation.z+=.03*o,a=.05*t;break;case`stab`:e.torso.rotation.x-=.3*t,e.weaponArm.rotation.x+=1.4*t,e.offArm.rotation.x+=1.4*t,e.core.scale.multiplyScalar(1+1.2*t+1.2*i),e.body.position.y-=.06*t,e.body.rotation.z+=.03*o;break;case`flourish`:{let n=Math.sin(r*9);e.body.rotation.z+=.28*t*n,e.head.rotation.z=.4*t*Math.sin(r*9+1.2),e.body.position.y-=.16*t,e.weaponArm.rotation.z+=.5*t,e.dizzy.scale.setScalar(1+.8*t+.6*i);break}}}e.body.scale.setScalar(i*(1+a))}function m_(e){let{arena:n,session:r,chart:i,engine:a,scene:o,camera:s}=e,c=r_(i.tempo.bpmAtBeat(0)),l=new bg(e.audio,e.sfx.output,.9);n.view={...l_},n.telegraph=(e,t,n,r)=>s_(e,t,n,r,c);let u=vg(),d=new yg(o,u),f=new yg(o,u),p=new Ml(`#ffffff`,0,7,1.5);o.add(p);let m=new Set,h=Array(_.length).fill(-10),g=Array(_.length).fill(-10),v=0,y=0,b=new K,x=new K,S=[r.bus.on(`input`,t=>{t.down&&e.sfx.swing(i.lanes[t.lane])}),r.bus.on(`action`,t=>{if(t.kind===`holdEnd`)return;if(!t.hit){g[t.lane]=y;return}let r=t.judgement===`perfect`;n.hitStop(r?.06:.04,t.time),v=r?.22:.14,h[t.lane]=y,e.sfx.hit(t.action,r)})],C=e=>{let t=r.cuesBetween(e-1,e+c.lead+.3).sort((e,t)=>e.time-t.time),n=a_(t,c.lead);t.forEach((t,r)=>{let i=n[r];m.has(t.id)||i>e+.12||i<e-.05||(m.add(t.id),n_(l,t.action,a.ctxTimeFor(i)))})};return{update(e,i){y=e,a.playing&&C(e);let o=n.enemyRig(),l=r.duel.activeEncounter(e),u=l===null?null:r.duel.enemies[l],m=0,h=0;if(o&&l!==null&&u&&u.state!==`defeated`&&u.state!==`escaped`){let n=o_(r.encounterCues(l),e,c);p_(o,n,e);let i=n.cue??(n.afterGlint>0&&n.last?n.last.cue:null);if(i){let t=I[i.action].color,r=n.cue?n.glint:n.afterGlint;f_(o,i.action,b),d.set(b,t,r*1.6,.35+1.3*r,e*1.5),f.set(b,t,(n.cue?n.pose:0)*.35+r*.5,1.2+1.2*r,.4),m=n.cue?n.pose:0,h=r,p.color.set(t)}else d.set(b,`#ffffff`,0,0),f.set(b,`#ffffff`,0,0);p.position.set(0,1.7*t[o.kind].scale,o.root.position.z+1.3)}else d.set(b,`#ffffff`,0,0),f.set(b,`#ffffff`,0,0);p.intensity=3*m+14*h,v=Math.max(0,v-i*2.2),v>0&&(s.getWorldDirection(x),s.position.addScaledVector(x,v*v*4))},drawHud(t,r,i,a){let o=n.heldLanes,s=Math.min(190,(i-40)/4),c=a-42-18,l=i/2-(s*4+18)/2;t.textBaseline=`middle`,_.forEach((n,i)=>{let a=I[n],u=l+i*(s+6),d=Math.max(0,1-(r-h[i])/.25),f=Math.max(0,1-(r-g[i])/.6),p=f>0?Math.sin(r*70)*4*f:0;t.fillStyle=o[i]?Q(a.color,.3):Q(`#000a04`,.55+.3*d),t.strokeStyle=f>.01?Q($.danger,.5+.5*f):Q(a.color,.35+.65*d),t.lineWidth=o[i]||d>0||f>0?2.5:1,t.beginPath(),t.roundRect(u+p,c,s,42,7),t.fill(),t.stroke(),t.textAlign=`left`,t.fillStyle=o[i]?$.white:a.color,t.font=`bold 17px monospace`,t.fillText(Pt(e.keys[i]??``),u+p+10,c+21),t.font=`bold 12px monospace`,t.fillText(a.label,u+p+32,c+14),t.font=`11px monospace`,t.fillStyle=Q($.white,.7),t.fillText(u_[n],u+p+32,c+29,s-38)}),t.textAlign=`center`},dispose(){S.forEach(e=>e()),n.view=null,n.telegraph=null,d.dispose(),f.dispose(),u.dispose(),o.remove(p),p.dispose(),l.out.disconnect()}}}var h_=[`KeyF`,`KeyJ`,`KeyD`,`KeyK`],g_=new Set([0,2]),__=_.indexOf(`block`),v_=_.indexOf(`slash`),y_=_.indexOf(`stab`);function b_(e){return g_.has(e)?`defend`:`attack`}function x_(e,t,n){let r=null,i=n;for(let n of e){if(n.action===`block`)continue;let e=Math.abs(n.time-t);e<=i&&(r=n,i=e)}return r}var S_=class{reach;downLane=new Map;ghost=0;constructor(e){this.reach=e}map(e,t){if(!e.down){let t=this.downLane.get(e.lane)??e.lane;return this.downLane.delete(e.lane),{...e,lane:t}}let n;if(b_(e.lane)===`defend`)n=__;else{let r=x_(t,e.time,this.reach);n=r?r.lane:this.ghost++%2==0?v_:y_}return this.downLane.set(e.lane,n),{...e,lane:n}}},C_=I.block.color,w_=`#ff5a3c`,T_=I.flourish.color,E_=.72,D_=.14,O_=.55,k_=1.5;function A_(e){let{session:t,chart:n,arena:r,audio:i,sfx:a,scene:o}=e,s=new Vm(o,e.camera,r),c=new Um(i,a.output),l=new Wm(e,{grid:!0,enemyBob:.03,rain:.15}),u=new S_(ce.good+.05),d=r.highway,f={defend:!1,attack:!1},p={defend:-10,attack:-10},m=new Map,h=0,g=k_,_=new Fi,v=new Y(new Ic(E_*2,19),new go({color:201738,transparent:!0,opacity:.72}));v.rotation.x=-Math.PI/2,v.position.set(0,.01,d.hitZ-19/2+.6),_.add(v);let y=new go({color:$.green,transparent:!0,opacity:.55,blending:2,depthWrite:!1});for(let e of[-1,1]){let t=new Y(new Ic(.04,19),y);t.rotation.x=-Math.PI/2,t.position.set(e*E_,.015,v.position.z),_.add(t)}let b=new go({color:$.white,transparent:!0,opacity:.8,blending:2,depthWrite:!1,side:2}),x=new Y(new Lc(O_*1.05,O_*1.18,48),b);x.rotation.x=-Math.PI/2,x.position.set(0,.02,d.hitZ),_.add(x),o.add(_);let S=()=>t.conductor.cues.filter(e=>!e.removed&&t.judge.isPending(e.id)&&e.action!==`block`),C=(e,n)=>{let r=t.cuesBetween(n-ce.good,n+ce.good).filter(e=>t.judge.isPending(e.id));if(r.length===0)return;let i=r.some(e=>e.action===`block`),a=r.some(e=>e.action!==`block`),o=d.receptorPoint(0).setX(0).setY(1.3);e===`defend`&&a&&!i&&s.pop(`ATTACK!`,o,w_,20),e===`attack`&&i&&!a&&s.pop(`DEFEND!`,o,C_,20)},w=e=>{c.drum(e===`defend`?`don`:`ka`),p[e]=h,s.ring(new K(0,.05,d.hitZ),e===`defend`?C_:w_,new K(0,1,0),.18,.9)},T=[t.bus.on(`input`,e=>{if(!e.auto)return;let t=n.lanes[e.lane]===`block`?`defend`:`attack`;f[t]=e.down,e.down&&w(t)}),t.bus.on(`action`,e=>{if(e.kind===`holdEnd`)return;if(!e.hit){e.kind===`tap`&&s.flash($.danger,.08,.16);return}m.set(e.noteId,h);let t=e.action===`block`?C_:e.action===`flourish`?T_:w_,n=e.judgement===`perfect`;c.impact(e.action,n?1:.8);let r=e.action===`block`?s.clashPoint():s.enemyChest();s.sparks(r,t,n?22:14,5),s.sparks(new K(0,.5,d.hitZ),t,10,3.5),s.ring(new K(0,.06,d.hitZ),t,new K(0,1,0),.3,1.8),s.punch(e.action===`flourish`?1:n?.6:.4),s.flash(t,n?.12:.07,.12),e.action!==`block`&&s.flinchEnemy(n?1:.7)}),t.bus.on(`duel`,e=>{e.type===`playerHit`&&s.flash($.danger,.22,.25),e.type===`defeated`&&s.flash($.white,.35,.3)})],E=e=>e===`block`?C_:e===`flourish`?T_:w_,D=(e,t,n)=>{let i=r.toScreen(new K(0,t,e)),a=r.toScreen(new K(n,t,e)),o=r.toScreen(new K(0,t,e-n));return{x:i.x,y:i.y,rx:Math.max(3,Math.abs(a.x-i.x)),ry:Math.max(2,Math.abs(o.y-i.y))}},O=(e,t,n,r,i)=>{let a=O_*(t===`flourish`?1.3:1),o=i?`#5a6b60`:E(t),s=D(n,.02,a),c=D(n,D_,a);e.globalAlpha=r,e.fillStyle=Q(o,.55),e.beginPath(),e.ellipse(s.x,s.y,s.rx,s.ry,0,0,Math.PI*2),e.fill(),e.fillRect(s.x-s.rx,c.y,s.rx*2,s.y-c.y),e.fillStyle=o,e.beginPath(),e.ellipse(c.x,c.y,c.rx,c.ry,0,0,Math.PI*2),e.fill(),e.lineWidth=Math.max(1.5,c.rx*.12),e.strokeStyle=i?`#9fb3a6`:$.white,e.stroke(),e.save(),e.translate(c.x,c.y),e.scale(1,c.ry/c.rx),yp(e,t===`block`?`block`:t===`flourish`?`flourish`:`slash`,0,0,c.rx*.55,i?`#c9d6cd`:`#0a0f0c`),e.restore(),e.globalAlpha=1},k=(e,i,a)=>{let o=n.beatsPerBar;for(let n of t.conductor.plays){if(n.start>i+a)break;if(!(n.start+n.dur<i)){for(let t=0;t<o;t++){let s=n.start+t*n.dur/o;if(s<i||s>i+a)continue;let c=d.cueZ(s,i,a),l=r.toScreen(new K(-.72,.02,c)),u=r.toScreen(new K(E_,.02,c));e.strokeStyle=Q($.green,t===0?.55:.18),e.lineWidth=t===0?2:1,e.beginPath(),e.moveTo(l.x,l.y),e.lineTo(u.x,u.y),e.stroke()}if(n.combo){let t=d.cueZ(Math.max(i,n.start),i,a),o=d.cueZ(Math.min(i+a,n.start+n.dur),i,a);e.strokeStyle=Q(n.attempt>1||n.status===`failed`?wh:Ch,.85),e.lineWidth=3;for(let n of[-1,1]){let i=r.toScreen(new K(n*.78,.02,t)),a=r.toScreen(new K(n*.78,.02,o));e.beginPath(),e.moveTo(i.x,i.y),e.lineTo(a.x,a.y),e.stroke()}}}}let s=D(d.hitZ,.03,O_),c=Pm(t.conductor.beatAt(i),4),l=i-p.defend,u=i-p.attack,f=l<.15||u<.15?l<u?`defend`:`attack`:null,h=f?1-Math.min(l,u)/.15:0,g=f===`defend`?C_:f===`attack`?w_:null;e.lineWidth=3+3*h,e.strokeStyle=g?Q(g,.6+.4*h):Q($.white,.45+.4*c);let _=1.12+.1*h+.05*c;e.beginPath(),e.ellipse(s.x,s.y,s.rx*_,s.ry*_,0,0,Math.PI*2),e.stroke(),g&&(e.fillStyle=Q(g,.25*h),e.fill());let v=t.cuesBetween(i-.25,i+a).sort((e,t)=>t.time-e.time);for(let n of v){let r=t.duel.outcome(n.id);if(r===`hit`||r===`holding`){let t=m.get(n.id);if(t===void 0)continue;let r=(i-t)/.18;if(r<0||r>1)continue;let a=1+r*1.2;e.globalAlpha=1-r,e.strokeStyle=E(n.action),e.lineWidth=6*(1-r),e.beginPath(),e.ellipse(s.x,s.y,s.rx*a,s.ry*a,0,0,Math.PI*2),e.stroke(),e.globalAlpha=1;continue}let o=r===`miss`,c=d.cueZ(n.time,i,a),l=(n.time-i)/a,u=Math.min(1,(1-l)*5),f=n.time<i?Math.max(0,1-(i-n.time)/.25):1;O(e,n.action,c,u*f,o)}},A=(e,t,n)=>{let r=[[`defend`,`D  F`,`DEFEND`,C_,t/2-170],[`attack`,`J  K`,`ATTACK`,w_,t/2+170]],i=n-50;for(let[t,n,a,o,s]of r){let r=f[t]||h-p[t]<.08;e.fillStyle=r?Q(o,.45):`rgba(0,10,4,0.75)`,e.strokeStyle=Q(o,r?1:.8),e.lineWidth=r?3:1.5,e.beginPath(),e.roundRect(s-80,i-28,160,58,10),e.fill(),e.stroke(),e.textAlign=`center`,e.fillStyle=r?$.white:o,e.font=`bold 22px monospace`,e.fillText(n,s-34,i),yp(e,t===`defend`?`block`:`slash`,s+46,i-2,13,o),e.font=`bold 13px monospace`,e.fillStyle=Q(o,.95),e.fillText(a,s,i+20)}};return{mapInput(e){let t=b_(e.lane);return f[t]=e.down,e.down&&(w(t),C(t,e.time)),u.map(e,S())},update(e,n,r){h=e,g=r,l.update(e);let i=Pm(t.conductor.beatAt(e),4);y.opacity=.35+.45*i,b.opacity=.5+.5*i,s.update(e,n)},drawHud(e,t,n,r){h=t,k(e,t,g),A(e,n,r),s.draw(e,t,n,r)},dispose(){T.forEach(e=>e()),o.remove(_),_.traverse(e=>{e instanceof Y&&e.geometry.dispose()}),v.material.dispose(),y.dispose(),b.dispose(),l.dispose(),s.dispose()}}}var j_={key:`two-button`,label:`TWO BUTTONS · DEFEND / ATTACK`,tagline:`One lane, two buttons: defend or attack. The hero picks the move.`,hypothesis:`Four arbitrary actions are a memorization tax; with one meaningful choice (defend vs attack) attention goes to rhythm and the fight, and flow comes sooner.`,inspiration:[`Taiko no Tatsujin`,`Rhythm Heaven`],howTo:[`One lane, two kinds of drum: blue = DEFEND, red = ATTACK.`,`Left hand D or F to DEFEND, right hand J or K to ATTACK, as the drum reaches the ring.`,`The hero picks the move (slash, stab, the big pink finisher) for you.`],options:{highway:!1,laneLabels:!1,enemyIcon:!1,musicMapping:`instruments`,keys:[...h_],keyLegend:`D F defend · J K attack`,approachSeconds:k_},create:A_},M_=`baseline`,N_=[bm,d_,$g,Rh,zh,Nm,ym,gg,pg,rg,xh,j_,fh];function P_(e){return e?N_.find(t=>t.key===e)??null:null}var F_=.1,I_=.012,L_=class{ctx;chart;stems;parts=new Map;musicBus;output;dry;crush;filter;gate;detune;lfo;lfoDepth;voices=new Map;sync=new v;anchor=0;pausedAt=null;lastScheduled=null;resyncAt=null;started=!1;userOffsetSec=0;useOutputTimestamp=!0;constructor(e,t,n){this.ctx=e,this.chart=t,this.stems=n,this.output=e.createGain(),this.output.connect(ae(e).input);let r=e.createDynamicsCompressor();r.threshold.value=ne.glue.threshold,r.knee.value=ne.glue.knee,r.ratio.value=ne.glue.ratio,r.attack.value=ne.glue.attack,r.release.value=ne.glue.release,this.musicBus=e.createGain(),this.musicBus.gain.value=ne.busGain,this.dry=e.createGain(),this.crush=e.createGain(),this.crush.gain.value=0,this.filter=e.createBiquadFilter(),this.filter.type=`lowpass`,this.filter.frequency.value=2e4,this.gate=e.createGain(),this.musicBus.connect(this.dry).connect(this.filter),this.musicBus.connect(z_(e)).connect(this.crush).connect(this.filter),this.filter.connect(this.gate).connect(r).connect(this.output),this.detune=e.createConstantSource(),this.detune.offset.value=0,this.detune.start(),this.lfo=e.createOscillator(),this.lfo.frequency.value=6,this.lfoDepth=e.createGain(),this.lfoDepth.gain.value=0,this.lfo.connect(this.lfoDepth).connect(this.detune.offset),this.lfo.start();for(let t of Object.keys(n)){let n=e.createGain();n.connect(this.musicBus),this.parts.set(t,n)}}get playing(){return this.started&&this.pausedAt===null}connectBend(e){this.detune.connect(e)}ctxTimeFor(e){return this.anchor-this.outputLatency()+e}start(e){let t=this.ctx.currentTime,n=t+F_-e;this.anchor=n+this.outputLatency(),this.started=!0,this.pausedAt=null,this.sync.reset(),this.sampleClock(performance.now()),this.startVoices(Math.max(t+F_,n),Math.max(0,e),!0)}async pause(){this.pausedAt===null&&this.started&&(this.pausedAt=this.rawTimeAt(performance.now()),await this.ctx.suspend())}async resume(){this.pausedAt!==null&&(await this.ctx.resume(),this.sync.reset(),this.pausedAt=null)}stop(){for(let e of this.voices.values())R_(e,this.ctx.currentTime);this.voices.clear(),this.started=!1;try{this.lfo.stop(),this.detune.stop()}catch{}this.output.disconnect(),this.ctx.state===`suspended`&&this.ctx.resume()}schedule(e,t){for(let n of e){if(n.start>t+.15)break;if(this.lastScheduled&&n.index<=this.lastScheduled.index)continue;let e=this.lastScheduled;if(this.lastScheduled=n,!e)continue;let r=this.resyncAt!==null&&Math.abs(this.resyncAt-n.start)<.001;if(n.bar===e.bar+1&&!r)continue;this.resyncAt=null;let i=this.chart.bars[n.bar].startSec;this.startVoices(this.ctxTimeFor(n.start),i,!1)}}wonky(e,t){let n=this.ctxTimeFor(e),r=this.ctxTimeFor(t),i=Math.max(.05,r-n),a=(e,t,n,r,i)=>{e.cancelScheduledValues(r),e.setValueAtTime(t,r),e.linearRampToValueAtTime(n,i)};a(this.crush.gain,0,he.crush,n,n+.03),a(this.dry.gain,1,1-he.crush*.8,n,n+.03),this.filter.frequency.cancelScheduledValues(n),this.filter.frequency.setValueAtTime(2e4,n),this.filter.frequency.exponentialRampToValueAtTime(he.filterHz,r),a(this.lfoDepth.gain,0,he.wobbleCents,n,n+.05),this.lfo.frequency.setValueAtTime(he.wobbleHz,n);let o=Math.max(n,r-Math.min(he.tapeStop,i));this.detune.offset.cancelScheduledValues(n),this.detune.offset.setValueAtTime(0,n),this.detune.offset.setValueAtTime(0,o),this.detune.offset.linearRampToValueAtTime(-he.tapeStopCents,r);let s=this.gate.gain;s.cancelScheduledValues(n);let c=60/this.chart.tempo.bpmAtBeat(0)/8,l=n,u=!0;for(;l<Math.min(r,n+he.stutterSeconds);)s.setValueAtTime(u?1:.15,l),u=!u,l+=c;s.setValueAtTime(1,Math.min(r,l));for(let e of[this.crush.gain,this.dry.gain,this.lfoDepth.gain,this.detune.offset])e.setValueAtTime(+(e===this.dry.gain),r);this.filter.frequency.setValueAtTime(2e4,r),s.setValueAtTime(1,r),this.resyncAt=t}startVoices(e,t,n){let r=this.voices;this.voices=new Map;for(let[r,i]of Object.entries(this.stems)){let a=this.parts.get(r),o=this.ctx.createBufferSource();o.buffer=i;let s=this.ctx.createGain();o.connect(s).connect(a),this.detune.connect(o.detune),n?s.gain.value=1:(s.gain.setValueAtTime(0,e),s.gain.linearRampToValueAtTime(1,e+I_)),t<i.duration&&o.start(e,t),this.voices.set(r,{src:o,gain:s})}for(let t of r.values())R_(t,e)}sampleClock(e){let t=this.useOutputTimestamp?this.ctx.getOutputTimestamp?.():void 0;t&&t.contextTime!==void 0&&t.performanceTime!==void 0&&t.performanceTime>0&&t.contextTime>0?(this.sync.sample(t.contextTime+this.outputLatency(),t.performanceTime),Math.abs(this.sync.ctxTimeAt(e)-this.ctx.currentTime)>.5&&(this.useOutputTimestamp=!1,this.sync.reset())):this.sync.sample(this.ctx.currentTime,e)}timeAt(e){return this.rawTimeAt(e)-this.userOffsetSec}rawTimeAt(e){return this.pausedAt===null?this.sync.ctxTimeAt(e)-this.anchor:this.pausedAt}outputLatency(){let e=this.ctx;return(e.outputLatency||0)+(e.baseLatency||0)}};function R_(e,t){try{e.gain.gain.cancelScheduledValues(t),e.gain.gain.setValueAtTime(e.gain.gain.value,t),e.gain.gain.linearRampToValueAtTime(0,t+I_),e.src.stop(t+I_+.01)}catch{}}function z_(e){let t=1024,n=new Float32Array(t);for(let e=0;e<t;e++){let t=e/1023*2-1;n[e]=Math.round(Math.tanh(t*2)*5)/5}let r=e.createWaveShaper();return r.curve=n,r}function B_(e,t,n,r,i){if(e===null)return{encounter:null,enterAge:0,next:null,last:null};let a=-1;for(let e=0;e<n.length&&n[e].time<=r;e++)a=e;let o=a>=0?n[a]:null,s=n[a+1]??null,c=null;if(s){let e=o?(o.endTime??o.time)+i.resolve:t+i.walkIn,n=Math.max(e,s.time-i.lead),a=s.time-n,l=a<=1e-6?1:Math.min(1,Math.max(0,(r-n)/a));c={noteId:s.id,action:s.action,time:s.time,progress:l}}return{encounter:e,enterAge:r-t,next:c,last:o?{noteId:o.id,action:o.action,age:r-o.time}:null}}var V_=Math.PI,H_={pelvisY:-.03,spineYaw:-.14,spinePitch:.06,headYaw:.08,handX:-.3,handY:.2,handZ:.26,swordYaw:-.42,swordPitch:.38,swordRoll:-1.25,leftX:.24,leftY:.2,leftZ:.2,leftGripZ:-.1},U_={keys:[{t:-.12,pose:{spineYaw:-.6,spinePitch:.02,pelvisY:-.06,handX:-.36,handY:.44,handZ:.14,swordYaw:-1.85,swordPitch:.62,swordRoll:-.35,leftX:.2,leftY:.3,leftZ:.26}},{t:-.05,pose:{spineYaw:-.32,spinePitch:.06,pelvisY:-.07,handX:-.28,handY:.4,handZ:.26,swordYaw:-1,swordPitch:.4,swordRoll:-.4,leftX:.22,leftY:.28,leftZ:.24}},{t:0,pose:{spineYaw:.06,spinePitch:.14,pelvisY:-.09,pelvisZ:.06,footLZ:.05,handX:-.08,handY:.32,handZ:.42,swordYaw:.05,swordPitch:.08,swordRoll:-.45,leftX:.26,leftY:.22,leftZ:.1}},{t:.07,pose:{spineYaw:.48,spinePitch:.16,pelvisY:-.1,pelvisZ:.07,footLZ:.05,handX:.02,handY:.22,handZ:.32,swordYaw:1.3,swordPitch:-.32,swordRoll:-.5,leftX:.3,leftY:.18,leftZ:-.02}},{t:.16,pose:{spineYaw:.52,spinePitch:.12,pelvisY:-.08,pelvisZ:.05,footLZ:.04,handX:.03,handY:.2,handZ:.28,swordYaw:1.55,swordPitch:-.42,swordRoll:-.55,leftX:.3,leftY:.18,leftZ:-.04}},{t:.36,pose:H_}],coil:-.12,anticipation:.14,hold:0,hitStop:.05,end:.36,cut:[-.05,.1]},W_={keys:[{t:-.12,pose:{spineYaw:.5,spinePitch:.1,pelvisY:-.08,handX:.02,handY:.18,handZ:.26,swordYaw:1.7,swordPitch:-.38,swordRoll:-2.75,leftX:.3,leftY:.16,leftZ:-.02}},{t:-.05,pose:{spineYaw:.28,spinePitch:.12,pelvisY:-.08,handX:-.02,handY:.24,handZ:.34,swordYaw:.9,swordPitch:-.16,swordRoll:-2.75,leftX:.28,leftY:.2,leftZ:.06}},{t:0,pose:{spineYaw:-.06,spinePitch:.14,pelvisY:-.09,pelvisZ:.06,footLZ:.05,handX:-.13,handY:.33,handZ:.42,swordYaw:-.1,swordPitch:.16,swordRoll:-2.75,leftX:.26,leftY:.24,leftZ:.14}},{t:.07,pose:{spineYaw:-.46,spinePitch:.1,pelvisY:-.07,pelvisZ:.06,footLZ:.05,handX:-.34,handY:.42,handZ:.26,swordYaw:-1.3,swordPitch:.5,swordRoll:-2.8,leftX:.22,leftY:.3,leftZ:.24}},{t:.16,pose:{spineYaw:-.5,spinePitch:.08,pelvisY:-.06,pelvisZ:.04,footLZ:.04,handX:-.36,handY:.44,handZ:.2,swordYaw:-1.55,swordPitch:.6,swordRoll:-2.8,leftX:.22,leftY:.3,leftZ:.24}},{t:.36,pose:H_}],coil:-.12,anticipation:.14,hold:0,hitStop:.05,end:.36,cut:[-.05,.1]},G_={keys:[{t:-.14,pose:{spineYaw:-.5,spinePitch:-.02,pelvisY:-.09,pelvisZ:-.06,handX:-.34,handY:.25,handZ:0,swordYaw:.06,swordPitch:.06,swordRoll:0,leftX:.16,leftY:.34,leftZ:.32}},{t:0,pose:{spineYaw:.26,spinePitch:.22,pelvisY:-.14,pelvisZ:.3,footLZ:.34,handX:-.1,handY:.33,handZ:.5,swordYaw:.12,swordPitch:0,swordRoll:0,leftX:.44,leftY:.24,leftZ:-.2}},{t:.08,pose:{spineYaw:.28,spinePitch:.24,pelvisY:-.14,pelvisZ:.32,footLZ:.34,handX:-.1,handY:.33,handZ:.52,swordYaw:.12,swordPitch:-.02,swordRoll:0,leftX:.45,leftY:.24,leftZ:-.22}},{t:.2,pose:{spineYaw:-.02,spinePitch:.1,pelvisY:-.06,pelvisZ:.12,footLZ:.16,handX:-.24,handY:.26,handZ:.3,swordYaw:.14,swordPitch:.16,swordRoll:-.6}},{t:.36,pose:H_}],coil:-.14,anticipation:.15,hold:.04,hitStop:.06,end:.36,cut:[-.06,.03]},K_={keys:[{t:-.1,pose:{pelvisY:-.06,spineYaw:-.05,handX:-.3,handY:.34,handZ:.24,swordYaw:.7,swordPitch:.5,swordRoll:-2.4,leftX:.24,leftY:.3,leftZ:.26}},{t:0,pose:{pelvisY:-.08,spineYaw:.12,spinePitch:-.04,handX:-.26,handY:.5,handZ:.34,swordYaw:1.4,swordPitch:.22,swordRoll:-V_,leftGrip:1,leftGripZ:.52,headPitch:-.05}},{t:.05,pose:{pelvisY:-.11,pelvisZ:-.07,spineYaw:.14,spinePitch:-.13,handX:-.26,handY:.48,handZ:.28,swordYaw:1.44,swordPitch:.2,swordRoll:-V_,leftGrip:1,leftGripZ:.52,headPitch:.05,footRZ:-.04}},{t:.16,pose:{pelvisY:-.09,pelvisZ:-.04,spineYaw:.12,spinePitch:-.06,handX:-.26,handY:.49,handZ:.32,swordYaw:1.4,swordPitch:.22,swordRoll:-V_,leftGrip:1,leftGripZ:.52,footRZ:-.04}},{t:.36,pose:H_}],coil:-.1,anticipation:.12,hold:.05,hitStop:.045,end:.36,cut:[-.1,0]},q_={keys:[{t:-.16,pose:{pelvisY:-.16,spineYaw:-.62,spinePitch:.22,handX:-.32,handY:.12,handZ:.16,swordYaw:-.9,swordPitch:-.62,swordRoll:.4,leftX:.22,leftY:.28,leftZ:.3}},{t:0,pose:{pelvisY:-.04,spineYaw:-.08,spinePitch:.04,handX:-.2,handY:.42,handZ:.38,swordYaw:-.25,swordPitch:.85,swordRoll:.4,leftX:.3,leftY:.2,leftZ:0}},{t:.08,pose:{pelvisY:.12,bodyYaw:.9,spineYaw:.2,handX:-.36,handY:.52,handZ:.2,swordYaw:-.95,swordPitch:.95,swordRoll:.4,footLLift:.08,footRLift:.1,leftX:.32,leftY:.34,leftZ:-.04}},{t:.2,pose:{pelvisY:.22,bodyYaw:3.6,spineYaw:.1,handX:-.42,handY:.4,handZ:.12,swordYaw:-1.55,swordPitch:.05,swordRoll:0,footLLift:.16,footRLift:.16,leftX:.36,leftY:.38,leftZ:0}},{t:.32,pose:{pelvisY:-.14,bodyYaw:2*V_,spineYaw:-.2,spinePitch:.2,handX:-.36,handY:.26,handZ:.26,swordYaw:-.6,swordPitch:-.2,swordRoll:-.3,leftX:.26,leftY:.3,leftZ:.26},ease:`out`},{t:.44,pose:{pelvisY:-.1,bodyYaw:2*V_,spineYaw:-.3,spinePitch:.12,handX:-.4,handY:.2,handZ:.14,swordYaw:-.95,swordPitch:-.7,swordRoll:-V_/2,leftX:.28,leftY:.26,leftZ:.2}},{t:.62,pose:{...H_,bodyYaw:2*V_}}],coil:-.16,anticipation:.18,hold:0,hitStop:.07,end:.62,cut:[-.08,.3]},J_={block:[K_],slash:[U_,W_],stab:[G_],flourish:[q_]},Y_=[{t:0,pose:{}},{t:.05,pose:{spinePitch:-.38,spineRoll:.14,pelvisZ:-.14,pelvisY:-.06,headPitch:.3,headYaw:-.2,handY:.06,handZ:-.1,swordPitch:.3,leftY:.1,leftZ:-.08,footLLift:.06}},{t:.16,pose:{spinePitch:-.16,spineRoll:.06,pelvisZ:-.1,pelvisY:-.05,footLZ:-.12,footRZ:-.04}},{t:.3,pose:{spinePitch:-.05,pelvisZ:-.04,footLZ:-.06,footLLift:.05}},{t:.42,pose:{}}],X_={blendIn:{blade:0,body:.07,feet:.1},anticipationGapFraction:.55,anticipationRelease:.12,breathHz:.45,breathDepth:.025,beatBob:.035,swordSway:.04,headCounterTwist:.6,lockTremble:.02,lockTrembleHz:38,hitStopShake:.012,fastInterval:.09,slowInterval:.28,fastStopScale:.3,fastFollowBoost:.7,fastDamp:.45},Z_={hipY:.72,hipX:.14,thigh:.34,shin:.32,ankleY:.08,footL:[.19,.08],footR:[-.2,-.1],shoulderL:[.29,.5,0],shoulderR:[-.29,.5,0],neckY:.66,upperArm:.23,foreArm:.22,hand:.07,bladeStart:.16,bladeLength:.66},Q_=[];function $_(e,t={}){let n=new Yc({color:e,flatShading:!0,roughness:.78,metalness:0,...t});return Q_.push(n),n}function ev(e,t,n,r,i=0,a=0,o=0){let s=new Y(new cs(e,t,n),r);return s.position.set(i,a,o),s}function tv(e,t,n,r,i=6){let a=new us(e,t,n,i);return a.translate(0,n/2,0),new Y(a,r)}function nv(e,t,n,r,i=1){let a=new us(.5*i,.5,1,8);return a.rotateY(Math.PI/8),a.scale(e/Math.cos(Math.PI/8),t,n/Math.cos(Math.PI/8)),new Y(a,r)}function rv(){Q_.length=0;let e=$_(Wp.skin),t=$_(Wp.hair,{roughness:.6}),n=$_(Wp.hairShade,{roughness:.6}),r=$_(Wp.outfit),i=$_(Wp.outfitDark),a=$_(Wp.leather),o=$_(Wp.metal,{metalness:.55,roughness:.38}),s=$_(Wp.metalDark,{metalness:.45,roughness:.5}),c=$_(Wp.eyes,{emissive:Wp.eyes,emissiveIntensity:.35}),l=$_(`#1d1d26`),u=new Fi,d=new Fi;u.add(d);let f=new Fi;f.rotation.y=Math.PI/2,d.add(f);let p=e=>{let t=new Fi;t.add(tv(.13,.16,Z_.thigh,r,6));let n=new Fi;n.add(tv(.09,.145,Z_.shin,i,6));let o=nv(.22,.08,.22,i);n.add(o);let c=new Fi,u=nv(.22,.1,.24,a);u.position.set(0,.06,0);let d=ev(.2,.12,.32,s,0,-.025,.04),p=nv(.19,.08,.13,s,.8);p.position.set(0,-.04,.2);let m=ev(.21,.03,.34,l,0,-.07,.05);return c.add(u,d,p,m),c.position.x=e*.005,f.add(t,n,c),[t,n,c]},m=p(1),h=p(-1),g=new Fi;g.position.y=Z_.hipY,f.add(g);let _=nv(.46,.16,.3,i,.92);_.position.y=-.02,g.add(_);let v=new Fi;v.rotation.order=`YXZ`,v.position.y=.04,g.add(v);let y=nv(.47,.08,.31,a);y.position.y=.08;let b=ev(.1,.07,.03,o,0,.08,.16),x=nv(.46,.38,.29,r,1.14);x.position.y=.32;let S=ev(.07,.4,.03,a,.11,.33,.165);S.rotation.z=-.08;let C=ev(.07,.4,.03,a,-.11,.33,.165);C.rotation.z=.08;let w=ev(.2,.09,.035,a,0,.22,.17),T=nv(.42,.06,.27,i);T.position.y=.55,v.add(y,b,x,S,C,w,T);let E=nv(.24,.13,.27,i,.85);E.position.set(.31,.56,0),E.rotation.z=-.25,v.add(E);for(let e of[-.06,.06]){let t=new Y(new ds(.03,.12,4),o);t.position.set(.36,.67,e),t.rotation.z=-.35,v.add(t)}let D=nv(.15,.12,.17,e);D.position.set(Z_.shoulderR[0],Z_.shoulderR[1]+.02,0),v.add(D);let O=new Fi;O.rotation.order=`YXZ`,O.position.y=Z_.neckY,v.add(O);let k=tv(.07,.08,.1,e,6);k.position.y=-.04,O.add(k);let A=nv(.6,.5,.52,e,.94);A.position.y=.3,O.add(A);let j=nv(.38,.12,.34,e,1.25);j.position.set(0,.06,.04),O.add(j);for(let t of[-1,1]){let r=ev(.1,.11,.02,c,t*.125,.27,.265),i=ev(.14,.03,.03,n,t*.125,.36,.27);i.rotation.z=t*-.18;let a=ev(.04,.1,.08,e,t*.31,.26,.02);O.add(r,i,a)}O.add(ev(.07,.015,.02,l,0,.13,.265)),O.add(nv(.64,.18,.56,t,.85).translateY(.55).translateZ(-.02)),[[0,.62,-.02,-.85,0,.15,.48],[.17,.6,.02,-.62,-.7,.13,.44],[-.17,.6,.02,-.62,.7,.13,.44],[.27,.48,.04,-.15,-1.2,.11,.42],[-.27,.48,.04,-.15,1.2,.11,.42],[.1,.56,-.18,-1.05,-.35,.13,.46],[-.1,.56,-.18,-1.05,.35,.13,.46],[0,.42,-.26,-1.45,0,.15,.42],[.22,.38,-.2,-1.25,-.75,.11,.36],[-.22,.38,-.2,-1.25,.75,.11,.36],[.12,.5,.26,2.35,-.3,.085,.3],[-.13,.5,.26,2.4,.35,.085,.3],[0,.52,.27,2.6,0,.08,.28],[.26,.38,.2,2.6,-.45,.07,.28],[-.26,.38,.2,2.6,.45,.07,.28]].forEach(([e,r,i,a,o,s,c],l)=>{let u=new Y(new ds(s,c,4),l%3==2?n:t);u.position.set(e,r,i),u.rotation.set(a,0,o),u.translateY(c*.38),O.add(u)});let ee=e=>{let t=new Fi;return t.add(tv(.065,.075,Z_.upperArm,e,6)),t},M=e=>{let t=new Fi;return t.add(tv(.06,.065,Z_.foreArm,e,6)),t},N=[ee(e),M(e)],P=[ee(e),M(e)];v.add(...N,...P);let F=new Fi;v.add(F);let te=av(l,a,s);F.add(te);let I=new Fi;F.add(I);let ne=iv(a,l,o,s);I.add(ne.group);let re=new Pi;re.position.z=Z_.bladeStart+.04;let L=new Pi;L.position.z=Z_.bladeStart+Z_.bladeLength*.45;let ie=new Pi;ie.position.z=Z_.bladeStart+Z_.bladeLength,I.add(re,L,ie);let ae=new Fi;return ae.add(av(l,a,s)),v.add(ae),u.traverse(e=>{e.isMesh&&(e.castShadow=!0)}),{root:u,body:d,pelvis:g,spine:v,head:O,swordHand:F,sword:I,gloveR:te,leftHand:ae,armR:N,armL:P,legL:m,legR:h,bladeBase:re,bladeMid:L,bladeTip:ie,bladeGeometry:ne.bladeGeometry,bladeMaterial:ne.bladeMaterial,materiaMaterial:ne.materiaMaterial,materials:[...Q_]}}function iv(e,t,n,r){let i=new Fi,a=Z_.bladeLength,o=new Js;o.moveTo(-.19/2,0),o.lineTo(.19/2,0),o.lineTo(.17/2,a-.17),o.lineTo(-.065,a),o.lineTo(-.17/2,a-.03),o.lineTo(-.19/2,0);let s=new Mc(o,{depth:.012,bevelEnabled:!0,bevelThickness:.016,bevelSize:.02,bevelSegments:1,curveSegments:1});s.translate(0,0,-.006),s.rotateX(Math.PI/2),s.translate(0,0,Z_.bladeStart),s.computeVertexNormals();let c=$_(Wp.blade,{metalness:.65,roughness:.32,emissive:`#000000`}),l=new Y(s,c);i.add(l);for(let e of[-1,1]){let t=ev(.035,.006,a*.6,r,-.035,e*.03,Z_.bladeStart+a*.36);i.add(t)}let u=$_(Wp.materia,{emissive:Wp.materia,emissiveIntensity:.25,roughness:.4});for(let e of[.08,.17]){let t=new Y(new us(.026,.026,.07,6),u);t.position.set(-.03,0,Z_.bladeStart+e),i.add(t)}let d=nv(.27,.075,.07,r);d.position.z=Z_.bladeStart-.03;let f=ev(.2,.05,.04,n,0,0,Z_.bladeStart-.075),p=new Y(new us(.03,.033,.2,6),e);p.rotation.x=Math.PI/2,p.position.z=0,i.add(d,f,p);for(let e of[-.07,.06]){let n=new Y(new us(.037,.037,.02,6),t);n.rotation.x=Math.PI/2,n.position.z=e,i.add(n)}let m=new Y(new Fc(.05,0),n);return m.scale.set(1,1,.8),m.position.z=-.135,i.add(m),{group:i,bladeGeometry:s,bladeMaterial:c,materiaMaterial:u}}function av(e,t,n){let r=new Fi;return r.add(nv(.15,.14,.15,e)),[e,t,n].forEach((e,t)=>{let n=nv(.18-t*.006,.05,.18-t*.006,e);n.rotation.x=Math.PI/2,n.position.set(0,0,-.06-t*.042),r.add(n)}),r}var ov=new J(`#ffffff`),sv=new Map;function cv(e){let t=sv.get(e);if(!t){let n=document.createElement(`canvas`);n.width=n.height=128;let r=n.getContext(`2d`),i=I[e].color;r.fillStyle=`rgba(0,0,0,0.65)`,r.beginPath(),r.arc(64,64,58,0,Math.PI*2),r.fill(),r.strokeStyle=i,r.lineWidth=7,r.stroke(),yp(r,e,64,64,34,i),t=new is(n),t.colorSpace=dr,sv.set(e,t)}return t}function lv(e,t,n,r,i){let a=new cs(e,t,n),o=new Y(a,r);return i&&o.add(new ns(new _s(a),i)),o}function uv(e){let n=t[e],r=new Yc({color:n.body,emissive:n.accent,emissiveIntensity:.08,flatShading:!0,roughness:.6}),i=new Wo({color:n.accent}),a=new Yc({color:`#07090b`,flatShading:!0}),o=new go({color:$.white}),s=new Yc({color:`#aab4bf`,metalness:.6,roughness:.35,emissive:`#000000`,flatShading:!0}),c=new Fi,l=new Fi;l.scale.setScalar(n.scale),c.add(l);for(let e of[-1,1]){let t=lv(.24,.72,.28,a,i);t.position.set(e*.17,.36,0),l.add(t)}let u=new Fi;u.position.y=.72,l.add(u);let d=e===`brute`?.95:.72,f=lv(d,.78,.46,r,i);f.position.y=.42,u.add(f);let p=lv(d+.04,.1,.5,a);p.position.y=.06,u.add(p);let m=new go({color:I.stab.color}),h=new Y(new Fc(.13,0),m);h.position.set(0,.5,.22),u.add(h);let g=new Yc({color:n.body,emissive:n.accent,emissiveIntensity:.2,flatShading:!0}),_=[];for(let e of[-1,1]){let t=lv(.2,.34,.06,g,i);t.position.set(e*.1,.5,.26),u.add(t),_.push(t)}let v=new Y(new Ic(d*1.5,.07),new go({color:I.slash.color,transparent:!0,opacity:0,blending:2,depthWrite:!1,side:2}));v.position.set(0,.45,.3),v.rotation.z=.6,u.add(v);let y=new Fi;y.position.y=.95,u.add(y);let b=lv(.48,.44,.44,r,i);b.position.y=.2,y.add(b);for(let e of[-1,1]){let t=new Y(new cs(.1,.05,.02),o);t.position.set(e*.1,.24,.23),y.add(t)}if(e===`brute`)for(let e of[-1,1]){let t=new Y(new ds(.08,.32,4),r);t.position.set(e*.2,.52,0),t.rotation.z=-e*.35,y.add(t)}else if(e===`knight`){let e=lv(.06,.24,.4,r,i);e.position.y=.52,y.add(e)}else if(e===`duelist`){let e=lv(.7,.04,.6,a,i);e.position.y=.43,y.add(e)}let x=new Y(new Rc(.34,.035,4,18),new go({color:I.flourish.color,transparent:!0,opacity:0,blending:2,depthWrite:!1}));x.rotation.x=Math.PI/2,x.position.y=.62,y.add(x);let S=d/2+.1,C=new Fi;C.position.set(-S,.72,0),u.add(C);let w=lv(.17,.62,.17,r,i);w.position.y=-.3,C.add(w);let T=new Fi;T.position.y=-.62,C.add(T);let E=new Pi;if(n.weapon===`blade`){let e=lv(.07,1,.2,s);e.position.y=-.55,T.add(e,lv(.26,.05,.08,a)),E.position.y=-1.05}else if(n.weapon===`rapier`){let e=lv(.035,1.25,.035,s);e.position.y=-.66;let t=new Y(new Rc(.09,.02,4,10),s);t.rotation.x=Math.PI/2,T.add(e,t),E.position.y=-1.3}else if(n.weapon===`club`){let e=new Y(new us(.2,.08,1,6),s);e.position.y=-.5,T.add(e),E.position.y=-1}else{let e=lv(.06,1.7,.06,a);e.position.y=-.6;let t=lv(.06,.38,.34,s);t.position.set(0,-1.3,.16),T.add(e,t),E.position.y=-1.45}T.add(E);let D=new Fi;D.position.set(S,.72,0),u.add(D);let O=lv(.17,.62,.17,r,i);if(O.position.y=-.3,D.add(O),n.shield){let e=lv(.08,.7,.55,r,i);e.position.set(.08,-.55,.1),D.add(e)}let k={};for(let e of Object.keys(I))k[e]=new Ja({map:cv(e),transparent:!0,depthTest:!1,depthWrite:!1});let A=new co(k.block);return A.scale.setScalar(.62),A.position.y=2.75*n.scale,A.renderOrder=13,c.add(A),{kind:e,root:c,body:l,torso:u,head:y,weaponArm:C,offArm:D,weaponTip:E,core:h,shutters:[_[0],_[1]],guardLine:v,dizzy:x,icon:A,iconMats:k,weaponMat:s,bodyMat:r,eyeMat:o,coreMat:m}}var dv={armX:-1.15,armZ:.2,offX:-.5,offZ:.25,lean:0,twist:0,crouch:0,fwd:0,shutter:0,core:.15,line:0,dizzy:0,glow:0,eyes:0},fv={block:{armX:-3.05,armZ:.15,offX:-.2,lean:-.22,glow:1,eyes:1,fwd:-.1},slash:{armX:-.15,armZ:-1.45,offX:0,offZ:1.45,lean:-.12,line:1},stab:{armX:-.5,armZ:-.9,offX:-.2,offZ:.9,lean:-.32,shutter:1,core:1},flourish:{armX:.15,armZ:.35,offX:.2,offZ:.1,lean:.38,crouch:-.22,dizzy:1}};function pv(e,t,n){let r={...e};for(let i of Object.keys(t))r[i]=e[i]+(t[i]-e[i])*n;return r}var mv=e=>e*e*(3-2*e),hv=e=>{let t=Kp.overshoot;return 1+(t+1)*(e-1)**3+t*(e-1)**2};function gv(e,t,n,r,i){let a=Math.min(1,r/.08),o=Math.min(1,Math.max(0,(r-.12)/.25)),s;if(t===`block`){if(n===`holding`)return s=pv(e,{armX:-1.75+Math.sin(i*60)*.04,glow:.6,fwd:.25,lean:.15},a),s;s=n===`miss`?pv(e,{armX:-.55,fwd:.75,lean:.25,glow:0,eyes:1},a):pv(e,{armX:-1.75,fwd:.1,lean:.05,glow:0,eyes:0},a),n!==`miss`&&r>.08&&(s=pv(s,{armX:-2.2,fwd:-.3,lean:-.15},Math.min(1,(r-.08)/.08)))}else if(n===`miss`||n===`pending`)s=pv(e,{...dv,armX:-1.3,offX:-.9,offZ:.05,fwd:.18},Math.min(1,r/.06));else{let n=Math.max(0,r-Kp.hitStop),a=hv(Math.min(1,n/Kp.knockback));s=t===`slash`?pv(e,{twist:.6,fwd:-.45,lean:.28,line:0,armZ:-.6,offZ:.6},a):t===`stab`?pv(e,{lean:.5,fwd:-.55,core:0,crouch:-.12},a):pv(e,{lean:.55,crouch:-.38,fwd:-.35,twist:-.3,dizzy:0},a),r<Kp.hitStop&&(s.twist+=Math.sin(i*95)*Kp.shudder);let o=Math.min(1,Math.max(0,(n-.1)/.28));return pv(s,dv,mv(o))}return pv(s,dv,mv(o))}function _v(e,n){let r={...dv},i=(1-n.beatPhase)**3;r.crouch=-.03*i,n.last&&n.last.age<.4?r=gv(pv(dv,fv[n.last.action],1),n.last.action,n.last.outcome,n.last.age,n.t):n.last&&n.last.outcome===`holding`&&(r=gv(pv(dv,fv.block,1),n.last.action,`holding`,1,n.t)),n.next&&n.next.progress>0&&(r=pv(r,fv[n.next.action],mv(n.next.progress)),n.next.action===`flourish`&&(r.twist+=Math.sin(n.t*7)*.18*n.next.progress),n.next.action===`stab`&&(r.core*=.75+.25*Math.sin(n.t*30)));let a=Math.min(1,n.enterAge/Math.max(.01,n.walkIn)),o=a<1,s=0,c=1,l=0;if(o&&(l=-(1-mv(a))*n.walkDistance,s=Math.abs(Math.sin(a*Math.PI*3))*.12,c=Math.min(1,.4+a*1.2)),e.root.visible=!0,n.exit){if(n.exit.kind===`defeated`)e.root.visible=!1;else{let e=n.exit.age;l-=e*7,s+=Math.max(0,e*4-e*e*9),c*=Math.max(0,1-e/.6),r=pv(r,{lean:-.4,armX:-1.6},Math.min(1,e/.1))}}e.root.userData.fwd=r.fwd+l,e.root.position.y=s,e.root.scale.setScalar(c),e.body.rotation.set(0,r.twist,0),e.body.position.y=r.crouch,e.torso.rotation.x=r.lean,e.head.rotation.x=-r.lean*.4+(r.dizzy>.3?.3:0),e.weaponArm.rotation.set(r.armX,0,r.armZ),e.offArm.rotation.set(r.offX,0,r.offZ),e.shutters[0].position.x=-.1-r.shutter*.2,e.shutters[1].position.x=.1+r.shutter*.2,e.coreMat.color.set(I.stab.color).multiplyScalar(.25+.75*r.core),e.core.scale.setScalar(.8+r.core*.6),e.core.rotation.y=n.t*3,e.guardLine.material.opacity=r.line*(.7+.3*Math.sin(n.t*25)),e.guardLine.scale.x=.4+.6*r.line,e.dizzy.material.opacity=r.dizzy,e.dizzy.rotation.z=n.t*6,e.weaponMat.emissive.set(I.block.color).multiplyScalar(r.glow*1.4);let u=n.last&&n.last.outcome===`hit`&&n.last.action!==`block`&&n.last.age>=0?Math.max(0,1-n.last.age/Kp.flashDecay):0;if(e.bodyMat.emissive.set(t[e.kind].accent).lerp(ov,u),e.bodyMat.emissiveIntensity=.08+u*Kp.flash,e.eyeMat.color.set(r.eyes>.5?$.danger:$.white),n.next&&!n.exit&&a>=1){e.icon.visible=!0,e.icon.material=e.iconMats[n.next.action];let t=mv(n.next.progress);e.icon.material.opacity=.35+.65*t,e.icon.scale.setScalar(.5+.22*t)}else e.icon.visible=!1}var vv=class{layer;camera;canvas;labels=[];v=new K;constructor(e,t,n){this.layer=e,this.camera=t,this.canvas=n}spawn(e,t,n){let r=document.createElement(`div`);r.className=`float-label`,r.textContent=t,r.style.color=n,r.style.textShadow=`0 0 8px ${n}`,this.layer.appendChild(r),this.labels.push({el:r,world:e.clone(),age:0}),this.labels.length>24&&this.labels.shift().el.remove()}update(e){let t=this.canvas.clientWidth,n=this.canvas.clientHeight;this.labels=this.labels.filter(r=>(r.age+=e,r.age>.8?(r.el.remove(),!1):(this.v.copy(r.world).setY(r.world.y+r.age*1.2).project(this.camera),r.el.style.transform=`translate(${(this.v.x+1)/2*t}px, ${(1-this.v.y)/2*n}px) translate(-50%, -50%)`,r.el.style.opacity=String(Math.min(1,(.8-r.age)*3)),!0)))}clear(){for(let e of this.labels)e.el.remove();this.labels=[]}},yv=`pelvisX.pelvisY.pelvisZ.bodyYaw.spineYaw.spinePitch.spineRoll.headYaw.headPitch.handX.handY.handZ.swordYaw.swordPitch.swordRoll.leftX.leftY.leftZ.leftGrip.leftGripZ.footLX.footLZ.footLLift.footRX.footRZ.footRLift`.split(`.`);function bv(e){return e.startsWith(`foot`)?`feet`:e.startsWith(`hand`)||e.startsWith(`sword`)?`blade`:`body`}function xv(e={}){let t={};for(let n of yv)t[n]=e[n]??0;return t}function Sv(e,t){for(let n of yv)t[n]=e[n];return t}function Cv(e,t,n,r){for(let i of yv)r[i]=e[i]+(t[i]-e[i])*n;return r}var wv=e=>Math.min(1,Math.max(0,e)),Tv=e=>{let t=wv(e);return t*t*(3-2*t)};function Ev(e,t){switch(e){case`linear`:return t;case`in`:return t*t*t;case`out`:return 1-(1-t)**3;case`inOut`:return Tv(t);case`step`:return t<1?0:1;case`spline`:return t}}var Dv=(e,t,n,r)=>e[t].pose[n]??r[n];function Ov(e,t,n,r){let i=e.keys,a=i.length;if(a===0)return Sv(n,r);if(t<=i[0].t){for(let e of yv)r[e]=Dv(i,0,e,n);return r}if(t>=i[a-1].t){for(let e of yv)r[e]=Dv(i,a-1,e,n);return r}let o=0;for(;o<a-2&&t>=i[o+1].t;)o++;let s=i[o],c=i[o+1],l=c.t-s.t,u=l>0?(t-s.t)/l:1,d=s.ease??`spline`;if(d!==`spline`){let e=Ev(d,u);for(let t of yv){let a=Dv(i,o,t,n);r[t]=a+(Dv(i,o+1,t,n)-a)*e}return r}let f=u*u,p=f*u,m=2*p-3*f+1,h=p-2*f+u,g=-2*p+3*f,_=p-f,v=o>0?i[o-1].t:s.t,y=o+2<a?i[o+2].t:c.t;for(let e of yv){let t=Dv(i,o,e,n),u=Dv(i,o+1,e,n),d=o>0?Dv(i,o-1,e,n):t,f=o+2<a?Dv(i,o+2,e,n):u,p=o>0?(u-d)/(c.t-v):0,b=o+2<a?(f-t)/(y-s.t):0;r[e]=m*t+h*p*l+g*u+_*b*l}return r}function kv(e,t,n){let r=n.hit?e.hitStop*(n.stopScale??1):0;return n.holding?Math.min(e.hold,Math.max(0,t-r)):n.releasedAge===null?Math.max(0,t-r)*n.followScale:e.hold+Math.max(0,n.releasedAge)*n.followScale}var Av=xv(H_),jv=xv(),Mv={keys:Y_,coil:0,anticipation:0,hold:0,hitStop:0,end:Y_[Y_.length-1].t,cut:[0,0]},Nv={sine:.9,triangle:1,saw:1.15,square:1},Pv=new K(1,0,0),Fv=new K(0,1,0),Iv=new K(0,0,1),Lv=new K(0,0,-1),Rv=Math.PI*2,zv=new J(.9,0,.15),Bv=e=>e-Rv*Math.round(e/Rv),Vv=class{hero;play=null;slashCount=0;lastPress=-1/0;hurtAt=-1/0;hitGlowAt=-1/0;hitGlowColor=new J;lastSample=-1/0;trail;echoes=[];history=[];pose=xv();tmpPose=xv();tmpPose2=xv();v1=new K;v2=new K;v4=new K;q1=new Rr;q2=new Rr;m1=new si;m2=new si;swordQ=new Rr;materia;baseEmissive=new Map;debugPose=null;constructor(e,t){this.hero=t,this.trail=new Lm(e),this.materia=t.materiaMaterial;for(let e of t.materials)e!==t.bladeMaterial&&e!==t.materiaMaterial&&this.baseEmissive.set(e,e.emissive.clone());for(let n=0;n<Gp.echoMax;n++){let n=new go({color:$.green,transparent:!0,opacity:0,blending:2,depthWrite:!1}),r=new Y(t.bladeGeometry,n);r.matrixAutoUpdate=!1,r.visible=!1,e.add(r),this.echoes.push({mesh:r,mat:n})}this.applyPose(Av)}get current(){return this.play?.action??null}get holding(){return this.play?.holding??!1}clipFor(e,t){let n=J_[e];if(e!==`slash`)return n[0];let r=this.slashCount%n.length;return t&&this.slashCount++,n[r]}start(e,t,n){let r=this.clipFor(e,!0),i=Sv(this.pose,xv());i.bodyYaw=Bv(i.bodyYaw);let a=Ov(r,0,Av,xv());this.shape(e,a,n);let o=X_,s=wv((t-this.lastPress-o.fastInterval)/(o.slowInterval-o.fastInterval));this.play={action:e,clip:r,start:t,hit:!1,holding:!1,releasedAt:null,from:i,contact:a,pace:s},this.lastPress=t,this.lastSample=t,this.trail.setColor(I[e].color,0,.6),this.trail.stepped=n.shapeWeights[3]*Jp.jitter,r.cut[1]>r.cut[0]&&r.cut[0]<=0&&this.smear(r,i,t,n)}connect(e,t){let n=this.play;n&&n.action===e&&(n.hit=!0,t&&(n.holding=!0),this.hitGlowAt=n.start,this.hitGlowColor.set(I[e].color))}release(e){this.play?.holding&&(this.play.holding=!1,this.play.releasedAt=e)}hurt(e){this.hurtAt=e}bladeTip(e=new K){return this.hero.bladeTip.getWorldPosition(e)}followRate(e){let t=0;return F.forEach((n,r)=>t+=(e.shapeWeights[r]??0)*Nv[n]),1+(t-1)*Gp.followAmount}playClipTime(e,t,n){let r=1-e.pace;return kv(e.clip,t-e.start,{hit:e.hit,holding:e.holding,releasedAge:e.releasedAt===null?null:t-e.releasedAt,followScale:this.followRate(n)*(1+r*X_.fastFollowBoost),stopScale:1-r*(1-X_.fastStopScale)})}stopTime(e){return e.clip.hitStop*(1-(1-e.pace)*(1-X_.fastStopScale))}shape(e,t,n){if(e===`slash`||e===`flourish`)t.swordYaw*=1+(n.arcScale-1)*Gp.arcAmount;else if(e===`stab`){let e=1+(n.stabLunge-1)*Gp.lungeAmount;t.pelvisZ*=e,t.footLZ*=e,t.handZ=Av.handZ+(t.handZ-Av.handZ)*(.6+.4*e)}}movePose(e,t,n,r){let i=this.playClipTime(e,t,n);Ov(e.clip,i,Av,r),this.shape(e.action,r,n);let a=(1-e.pace)*X_.fastDamp*(1-Tv(i/e.clip.end));a>0&&Cv(r,e.contact,a,r);let o=t-e.start,s=X_.blendIn;for(let t of yv){let n=s[bv(t)];if(n<=0||o>=n)continue;let i=Tv(o/n);r[t]=e.from[t]+(r[t]-e.from[t])*i}return r}compose(e,t,n,r){let i=this.pose,a=this.play;if(this.debugPose){let e=J_[this.debugPose.action],n=e[(this.debugPose.variant??0)%e.length];Ov(n,this.debugPose.u,Av,i),this.shape(this.debugPose.action,i,t);return}if(a?this.movePose(a,e,t,i):Sv(Av,i),r&&!(a&&(a.holding||e-a.start<this.stopTime(a)))){let e=this.clipFor(r.action,!1),n=Math.min(e.anticipation,r.gap*X_.anticipationGapFraction),a=0;n>.02&&r.timeTo>0?a=Tv(1-r.timeTo/n):r.timeTo<=0&&(a=1-Tv(-r.timeTo/X_.anticipationRelease)),a>0&&(Ov(e,e.coil,Av,this.tmpPose),this.shape(r.action,this.tmpPose,t),this.tmpPose.bodyYaw=i.bodyYaw,Cv(i,this.tmpPose,a,i))}let o=+!a,s=Math.sin(e*Rv*X_.breathHz);i.spinePitch+=s*X_.breathDepth,i.handY+=s*X_.breathDepth*.5,i.leftY+=s*X_.breathDepth*.6*o,i.handZ+=Math.sin(e*Rv*X_.breathHz*.5+1)*X_.breathDepth*o,i.pelvisY-=X_.beatBob*n*o,i.swordYaw+=Math.sin(e*Rv*X_.breathHz*.5)*X_.swordSway*o;let c=e-this.hurtAt;if(c>=0&&c<Mv.end){Ov(Mv,c,jv,this.tmpPose2);for(let e of yv)i[e]+=this.tmpPose2[e]}if(a?.holding&&(i.swordYaw+=Math.sin(e*Rv*X_.lockTrembleHz)*X_.lockTremble,i.handZ+=Math.sin(e*Rv*X_.lockTrembleHz*.7)*X_.lockTremble*.3),a?.hit&&e-a.start<this.stopTime(a)){let t=X_.hitStopShake;i.handX+=Math.sin(e*610)*t,i.handY+=Math.cos(e*470)*t}i.headYaw-=i.spineYaw*X_.headCounterTwist}basis=new si;bx=new K;by=new K;bz=new K;ikD=new K;ikPerp=new K;toArm=new K;wristTarget=new K;leftTarget=new K;onSword=new K;flatN=new K;placeBone(e,t,n,r){let i=this.by.subVectors(n,t).normalize(),a=this.bz.copy(r).addScaledVector(i,-r.dot(i)).normalize(),o=this.bx.crossVectors(i,a);this.basis.makeBasis(o,i,a),e.position.copy(t),e.quaternion.setFromRotationMatrix(this.basis)}solveIK(e,t,n,r,i,a,o){let s=this.ikD.subVectors(t,e),c=s.length(),l=n+r-1e-4,u=c<=l;c=Math.min(l,Math.max(Math.abs(n-r)+1e-4,c));let d=s.normalize(),f=(n*n+c*c-r*r)/(2*n*c),p=Math.sqrt(Math.max(0,1-f*f)),m=this.ikPerp.copy(i).addScaledVector(d,-i.dot(d)).normalize();return a.copy(e).addScaledVector(d,n*f).addScaledVector(m,n*p),o.copy(e).addScaledVector(d,c),u}ikJoint=new K;ikEnd=new K;shoulder=new K;grip=new K;hip=new K;ankle=new K;poleArmR=new K(-.5,-1,-.35);poleArmL=new K(.5,-1,-.35);poleLeg=new K(0,0,1);placeArm(e,t,n,r,i){this.shoulder.set(n[0],n[1],n[2]);let a=this.toArm.set(n[0]+e*.08,n[1]-.22,n[2]-.05).sub(r).normalize(),o=this.wristTarget.copy(r).addScaledVector(a,Z_.hand);return this.solveIK(this.shoulder,o,Z_.upperArm,Z_.foreArm,i,this.ikJoint,this.ikEnd),r.add(this.ikEnd).sub(o),this.placeBone(t[0],this.shoulder,this.ikJoint,i),this.placeBone(t[1],this.ikJoint,this.ikEnd,i),a}placeLeg(e,t,n){let r=e===1?Z_.footL:Z_.footR,i=e===1?n.footLX:n.footRX,a=e===1?n.footLZ:n.footRZ,o=e===1?n.footLLift:n.footRLift;this.hip.set(n.pelvisX+e*Z_.hipX,Z_.hipY+n.pelvisY,n.pelvisZ),this.ankle.set(r[0]+i,Z_.ankleY+o,r[1]+a),this.poleLeg.set(e*.15,0,1),this.solveIK(this.hip,this.ankle,Z_.thigh,Z_.shin,this.poleLeg,this.ikJoint,this.ikEnd),this.placeBone(t[0],this.hip,this.ikJoint,this.poleLeg),this.placeBone(t[1],this.ikJoint,this.ikEnd,this.poleLeg),t[2].position.copy(this.ikEnd)}applyPose(e){let t=this.hero;t.body.rotation.set(0,e.bodyYaw,0),t.pelvis.position.set(e.pelvisX,Z_.hipY+e.pelvisY,e.pelvisZ),t.spine.rotation.set(e.spinePitch,e.spineYaw,e.spineRoll),t.head.rotation.set(-e.headPitch,e.headYaw,0),this.placeLeg(1,t.legL,e),this.placeLeg(-1,t.legR,e),this.swordQ.setFromAxisAngle(Fv,e.swordYaw).multiply(this.q1.setFromAxisAngle(Pv,-e.swordPitch)).multiply(this.q1.setFromAxisAngle(Iv,e.swordRoll)),this.grip.set(e.handX,e.handY,e.handZ);let n=this.placeArm(-1,t.armR,Z_.shoulderR,this.grip,this.poleArmR);t.swordHand.position.copy(this.grip),t.swordHand.quaternion.copy(this.swordQ),t.gloveR.quaternion.copy(this.swordQ).invert().multiply(this.q2.setFromUnitVectors(Lv,n));let r=this.leftTarget.set(e.leftX,e.leftY,e.leftZ);if(e.leftGrip>0){let t=this.onSword.set(0,0,e.leftGripZ).applyQuaternion(this.swordQ).add(this.grip),n=this.flatN.set(0,1,0).applyQuaternion(this.swordQ);n.z>0&&n.negate(),t.addScaledVector(n,.07),r.lerp(t,Math.min(1,e.leftGrip))}let i=this.placeArm(1,t.armL,Z_.shoulderL,r,this.poleArmL);t.leftHand.position.copy(r),t.leftHand.quaternion.setFromUnitVectors(Lv,i)}smear(e,t,n,r){let i=Jp.smearSamples,a=this.tmpPose;for(let o=0;o<=i;o++){let s=o/i;Ov(e,e.coil+(0-e.coil)*s,Av,a),this.shape(this.play.action,a,r),Cv(t,a,Math.min(1,s*1.6),this.tmpPose2),this.applyPose(this.tmpPose2),this.hero.root.updateMatrixWorld(!0),this.sampleTrail(n-(1-s)*.04)}}sampleTrail(e){this.hero.bladeBase.getWorldPosition(this.v1),this.hero.bladeTip.getWorldPosition(this.v2),this.v1.lerp(this.v2,Jp.innerEdge),this.trail.push(this.v1,this.v2,e)}recordHistory(e){let t=this.history[this.history.length-1];if(t&&e-t.t<.004)return;let n=this.history.length>64?this.history.shift().m:new si;this.hero.sword.updateWorldMatrix(!0,!1),n.copy(this.hero.sword.matrixWorld),this.history.push({t:e,m:n})}matrixAt(e){for(let t=this.history.length-1;t>=0;t--)if(this.history[t].t<=e)return this.history[t].m;return null}updateEchoes(e,t){let n=this.play,r=Math.min(this.echoes.length,t.echoCount),i=n?this.playClipTime(n,e,t):0,a=n!==null&&n.clip.cut[1]>n.clip.cut[0]&&i<=n.clip.cut[1]+.06&&i>=0;this.echoes.forEach((o,s)=>{if(!a||s>=r){o.mesh.visible=!1;return}let c=s+1,l=this.matrixAt(e-c*t.echoDelay*Gp.echoDelayAmount);if(!l){o.mesh.visible=!1;return}let u=(c%2==1?1:-1)*Math.ceil(c/2)*t.echoSpread*Gp.echoSpreadAmount,d=this.v4.setFromMatrixPosition(l);this.m1.makeTranslation(d.x,d.y,d.z),this.m1.multiply(this.m2.makeRotationY(u)),this.m1.multiply(this.m2.makeTranslation(-d.x,-d.y,-d.z)),o.mesh.matrix.multiplyMatrices(this.m1,l),o.mesh.matrixWorldNeedsUpdate=!0,o.mesh.visible=!0;let f=1-Math.max(0,i-n.clip.cut[1])/.06;o.mat.opacity=Gp.echoOpacity*f/c,o.mat.color.set(I[n.action].color)})}update(e,t,n,r=null){let i=this.play;i&&!i.holding&&this.playClipTime(i,e,t)>=i.clip.end&&(this.play=null);let a=this.play;if(a&&e>this.lastSample){let i=Math.max(a.start,this.lastSample);for(let o=1;o<=4;o++){let s=i+(e-i)*o/4,c=this.playClipTime(a,s,t);this.compose(s,t,n,r),this.applyPose(this.pose),this.hero.root.updateMatrixWorld(!0),c>=a.clip.cut[0]&&c<=a.clip.cut[1]&&this.sampleTrail(s),this.recordHistory(s)}this.lastSample=e}this.compose(e,t,n,r),this.applyPose(this.pose),this.hero.sword.scale.set(1,1,1+(t.reach-1.1)*Gp.reachAmount),this.hero.root.updateMatrixWorld(!0),a||this.recordHistory(e),this.trail.update(e),this.updateEchoes(e,t);let o=Math.max(0,1-(e-this.hitGlowAt)/Gp.hitGlowDecay),s=this.hero.bladeMaterial;s.emissive.copy(this.hitGlowColor),s.emissiveIntensity=o*Gp.hitGlow,this.materia.emissiveIntensity=Gp.materiaGlow+(t.reach-.8)*Gp.materiaCutoffGlow+o*.6;let c=Math.max(0,1-(e-this.hurtAt)/.3);for(let[e,t]of this.baseEmissive)e.emissive.copy(t).lerp(zv,c)}sincePress(e){return e-this.lastPress}},Hv=new K(0,1,0),Uv=new K(0,0,-1),Wv=class{canvas;chart;session;renderer;scene=new Wi;camera;hero;anim;highway;enemyRigs=new Map;voxels;rings;labels;held;pressAt;hitAt;dropped=new Map;now=0;shake=0;hurtAt=-10;fovPulse=0;lastGrindSpark=0;walkIn;beforeRender=[];showHighway;showEnemyIcon;visualOffset=0;cueScan=0;stopFrom=-10;stopUntil=-10;heroYaw=0;heroPitch=0;telegraph=null;duelEffects=!0;pressMove=null;view=null;enemyPoseFilter=null;constructor(e,t,n,r,i={}){this.canvas=e,this.chart=n,this.session=r,this.showHighway=i.highway??!0,this.showEnemyIcon=i.enemyIcon??!0,this.renderer=new vp({canvas:e,antialias:!1,alpha:!0,powerPreference:`high-performance`}),this.renderer.setClearColor(0,0),this.camera=new Al(Hp.fov,1,.1,120),this.scene.fog=new Ui(0,12,30),this.labels=new vv(t,this.camera,e),this.walkIn=pe.walkInBeats*(60/n.tempo.bpmAtBeat(0)),this.scene.add(new vl(13631456,401424,.95));let a=new Fl(16774368,2.2);a.position.set(5,9,6),this.scene.add(a);let o=new Fl(3800938,2.2);o.position.set(-5,4,-8),this.scene.add(o);let s=new Y(new Ic(90,90),new Yc({color:133123,roughness:1}));s.rotation.x=-Math.PI/2,this.scene.add(s);let c=new Ql(80,80,1740604,736536);c.material.transparent=!0,c.material.opacity=.35,c.position.y=.004,this.scene.add(c),this.highway=new Ah(this.scene,n),this.highway.group.visible=this.showHighway;let l=n.lanes.length;this.held=Array(l).fill(!1),this.pressAt=Array(l).fill(-10),this.hitAt=Array(l).fill(-10),this.hero=rv(),this.hero.root.rotation.y=Math.PI/2,this.hero.root.scale.setScalar(Wp.scale),this.scene.add(this.hero.root);let u=new Y(new ls(.6,12),new go({color:0,transparent:!0,opacity:.6,depthWrite:!1}));u.rotation.x=-Math.PI/2,u.position.set(0,.02,Vp.heroZ),this.scene.add(u),this.anim=new Vv(this.scene,this.hero),this.voxels=new Rm(this.scene),this.rings=new zm(this.scene),r.bus.on(`input`,e=>this.onInput(e)),r.bus.on(`action`,e=>this.onAction(e)),r.bus.on(`duel`,e=>this.onDuel(e)),r.bus.on(`cuesDropped`,e=>{for(let t of e)this.dropped.set(t,this.now)}),this.resize()}toScreen(e){let t=e.clone().project(this.camera);return{x:(t.x+1)/2*this.canvas.clientWidth,y:(1-t.y)/2*this.canvas.clientHeight}}laneScreen(){let e=this.chart.lanes.map((e,t)=>this.toScreen(this.highway.receptorPoint(t)).x);return{xs:e,y:this.toScreen(this.highway.receptorPoint(0)).y,width:e.length>1?Math.abs(e[1]-e[0]):100}}onBeforeRender(e){this.beforeRender.push(e)}setEnemyPoseFilter(e){this.enemyPoseFilter=e}get heroRig(){return this.hero}enemyRig(e=!1){let t=this.session.duel.activeEncounter(this.now),n=t===null?void 0:this.enemyRigs.get(t);return n&&(e||n.root.visible)?n:null}playHeroMove(e,t=this.now){this.anim.start(e,t,this.session.mods),this.anim.connect(e,!1)}playMove(e,t,n=!1){this.anim.start(e,t+this.visualOffset,this.session.mods),n&&this.anim.connect(e,!1)}hitStop(e,t=this.now){this.stopFrom=t,this.stopUntil=t+e}setHeroLean(e,t){this.heroYaw=e,this.heroPitch=t}hurtHero(e=this.now){this.hurtAt=e,this.anim.hurt(e)}moveFor(e){return this.pressMove?this.pressMove(e):this.chart.lanes[e]??null}enemyScreen(){let e=this.session.duel.activeEncounter(this.now),n=e===null?void 0:this.enemyRigs.get(e);return!n||!n.root.visible?null:this.toScreen(n.root.position.clone().setY(3.2*t[n.kind].scale))}renderScale=Yp.initialScale;frameAvg=1/60;adaptScale(e){if(e<=0)return;this.frameAvg+=(e-this.frameAvg)*.05;let t=1/this.frameAvg,n=this.renderScale;t<Yp.lowFps&&this.renderScale>Yp.minScale?n=Math.max(Yp.minScale,this.renderScale-.1):t>Yp.highFps&&this.renderScale<Yp.maxScale&&(n=Math.min(Yp.maxScale,this.renderScale+.1)),n!==this.renderScale&&(this.renderScale=n,this.frameAvg=1/((Yp.lowFps+Yp.highFps)/2),this.resize())}resize(){let e=this.canvas.clientWidth,t=this.canvas.clientHeight;this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)*this.renderScale),this.renderer.setSize(e,t,!1),this.camera.aspect=e/Math.max(1,t),this.camera.fov=this.camera.aspect<1.2?Hp.fov*(1.2/this.camera.aspect)**.6:Hp.fov,this.camera.updateProjectionMatrix()}dispose(){this.renderer.dispose(),this.labels.clear()}get heldLanes(){return this.held}enemyChest(e){let n=this.enemyRigs.get(e),r=n?t[n.kind].scale:1,i=n?n.root.position.z:-Vp.duelDistance;return new K(0,1.25*r,i+.3)}onInput(e){if(!this.chart.lanes[e.lane])return;this.held[e.lane]=e.down;let t=this.moveFor(e.lane),n=e.time+this.visualOffset;e.down?(this.pressAt[e.lane]=this.now,t&&this.anim.start(t,(e.moveAt??e.time)+this.visualOffset,this.session.mods)):this.anim.release(n)}onAction(e){if(e.hit&&e.kind!==`holdEnd`){this.hitAt[e.lane]=this.now;let t=this.moveFor(e.lane);if(t&&this.anim.connect(t,e.hold),this.showHighway&&this.duelEffects){let t=this.highway.receptorPoint(e.lane);this.rings.spawn(t.setY(.06),I[e.action].color,Hv,.22,.7)}}}onDuel(e){if(this.duelEffects)switch(e.type){case`enemyEnter`:break;case`blocked`:{let t=new K(.1,1.7,(Vp.heroZ-Vp.duelDistance)/2);this.voxels.burst(t,I.block.color,e.judgement===`perfect`?16:9,4,Hv,.7),this.rings.spawn(t,I.block.color,new K(0,.3,1),.2,.9),this.labels.spawn(t.clone().setY(2.3),e.lock?`BLADE LOCK`:`BLOCKED`,I.block.color),this.shake=Math.max(this.shake,.06);break}case`struck`:{let t=I[e.action],n=this.enemyChest(e.encounter);this.voxels.burst(n,t.color,e.judgement===`perfect`?22:12,5,Uv),this.labels.spawn(n.clone().add(new K(.6,.5,0)),t.hitText,t.color),e.crit&&this.labels.spawn(n.clone().add(new K(-.6,.9,0)),`CRIT`,$.white),e.action===`flourish`&&(this.fovPulse=Hp.kickPulseFov);break}case`released`:{let t=this.enemyChest(e.encounter);this.voxels.burst(t,I[e.action].color,14,5,Uv),this.labels.spawn(t.clone().setY(2.2),e.action===`block`?`SHOVE`:`RELEASE`,I[e.action].color);break}case`playerHit`:this.hurtAt=this.now,this.anim.hurt(this.now),this.shake=Hp.shakeOnHit,this.labels.spawn(new K(0,2.6,0),`HIT -${Math.round(e.damage)}`,$.danger),this.voxels.burst(new K(0,1.4,-.2),$.danger,10,3,Hv);break;case`parry`:{let e=new K(0,1.8,(Vp.heroZ-Vp.duelDistance)/2);this.labels.spawn(e.clone().setY(2.5),`ECHO PARRY`,$.parry),this.rings.spawn(e,$.parry,new K(0,.3,1),.3,1.4),this.voxels.burst(e,$.parry,12,4,Hv);break}case`recovered`:{let t=I[e.action],n=e.action===`flourish`?`RECOVERED`:t.missText;this.labels.spawn(this.enemyChest(e.encounter).add(new K(0,1,0)),n,`#9fb3a6`);break}case`defeated`:{let n=this.enemyChest(e.encounter),r=this.enemyRigs.get(e.encounter),i=r?t[r.kind].accent:$.green;this.voxels.burst(n,i,40,7,Uv,1.5),this.voxels.burst(n.clone().setY(n.y+.6),I.flourish.color,30,6,Hv,1.2),this.rings.spawn(n.clone().setY(.1),I.flourish.color,Hv,.45,3),this.labels.spawn(n.clone().setY(n.y+1.4),`DEFEATED`,$.white),this.fovPulse=Hp.kickPulseFov*1.5,this.shake=Math.max(this.shake,.1);break}case`escaped`:this.labels.spawn(this.enemyChest(e.encounter).add(new K(0,1.4,0)),`ESCAPED`,`#9fb3a6`);break;case`playerDown`:this.labels.spawn(new K(0,3,0),`SYSTEM FAILURE`,$.danger)}}update(e,t,n,r){this.now=e,this.adaptScale(n);let i=this.session.mods,a=this.session.conductor.beatAt(e),o=a-Math.floor(a),s=(1-o)**3,c=e>=this.stopFrom&&e<this.stopUntil?this.stopFrom:e;this.hero.root.rotation.set(this.heroPitch,Math.PI/2+this.heroYaw,0),this.anim.update(c,i,s,this.anticipation(c)),this.anim.holding&&e-this.lastGrindSpark>1/Gp.grindSparks&&(this.lastGrindSpark=e,this.voxels.burst(this.anim.bladeTip(),$.white,1,2.5,Hv,.4));let l=Math.max(0,1-(e-this.hurtAt)/.3);this.hero.root.position.z=Vp.heroZ+l*l*.2,this.highway.update(e,r,this.session,this.held,this.pressAt,this.hitAt,this.dropped),this.updateEnemies(c,o),this.voxels.update(t),this.rings.update(t),this.shake=Math.max(0,this.shake-t),this.fovPulse=Math.max(0,this.fovPulse-t*10);let u=this.view??Hp,[d,f,p]=u.position,m=this.shake*.6;this.camera.position.set(d+(Math.random()-.5)*m,f+(Math.random()-.5)*m,p),this.camera.lookAt(...u.lookAt);let h=u.fov??Hp.fov,g=this.camera.aspect<1.2?h*(1.2/this.camera.aspect)**.6:h;this.camera.fov=g-this.fovPulse,this.camera.updateProjectionMatrix();for(let n of this.beforeRender)n(e,t);this.renderer.render(this.scene,this.camera),this.labels.update(t)}anticipation(e){let t=this.session.conductor.cues,n=this.session.judge;for(;this.cueScan<t.length;){let n=t[this.cueScan];if((n.endTime??n.time)>e-2)break;this.cueScan++}let r=e-this.anim.sincePress(e);for(let i=this.cueScan;i<t.length;i++){let a=t[i];if(a.removed)continue;if(a.time>e+1)break;if(a.time<e-X_.anticipationRelease||!n.isPending(a.id)){r=Math.max(r,a.endTime??a.time);continue}let o=this.chart.lanes[a.lane];return o?{action:o,timeTo:a.time-e,gap:a.time-r}:null}return null}rigFor(e){let t=this.enemyRigs.get(e);return t||(t=uv(this.chart.encounters[e].enemy),this.scene.add(t.root),this.enemyRigs.set(e,t)),t}updateEnemies(e,t){let n=this.session,r=n.duel,i=r.activeEncounter(e),a=i===null?0:n.encounterStart(i)??0,o=i===null?[]:n.encounterCues(i),s=this.telegraph?this.telegraph(i,a,o,e):B_(i,a,o,e,{lead:pe.telegraphLead,resolve:pe.resolveTime,walkIn:this.walkIn}),c=new Set,l=Vp.enterDistance-Vp.duelDistance,u=t=>{let n=r.enemies[t];return n.state===`defeated`||n.state===`escaped`?{kind:n.state,age:e-n.stateTime}:null};if(s.encounter!==null){let n=s.encounter,i=this.rigFor(n);c.add(n);let a={t:e,beatPhase:t,enterAge:s.enterAge,walkIn:this.walkIn,walkDistance:l,next:s.next&&{action:s.next.action,progress:s.next.progress},last:s.last&&{action:s.last.action,age:s.last.age,outcome:r.outcome(s.last.noteId)},exit:u(n)};_v(i,this.enemyPoseFilter?this.enemyPoseFilter(a,n):a),this.showEnemyIcon||(i.icon.visible=!1),i.root.position.z=-Vp.duelDistance+i.root.userData.fwd;let o=n-1,d=o>=0?u(o):null;if(d&&d.kind===`escaped`&&d.age<.7){let n=this.rigFor(o);c.add(o);let r=this.chart.encounters[o].noteIds;_v(n,{t:e,beatPhase:t,enterAge:99,walkIn:this.walkIn,walkDistance:l,next:null,last:{action:this.chart.notes[r[r.length-1]].action,age:1,outcome:`miss`},exit:d}),n.root.position.z=-Vp.duelDistance+n.root.userData.fwd}}for(let[e,t]of this.enemyRigs)c.has(e)||(this.scene.remove(t.root),this.enemyRigs.delete(e))}},Gv={pump:`PUMP`,sweep:`FILTER`,stutter:`REPEAT`,lift:`LIFT`},Kv={perfect:`PERFECT`,great:`GREAT`,good:`GOOD`,miss:`FUMBLE`},qv=class{arena;iris;freeze;flash;rack;modules=new Map;frozenId=0;flashLevel=0;wasGap=!1;constructor(e,t,n){this.arena=t;let r=e=>{let t=document.createElement(`div`);return t.className=e,t};this.freeze=document.createElement(`canvas`),this.freeze.className=`fx-freeze`,this.iris=r(`fx-iris`),this.flash=r(`fx-flash`),t.after(this.freeze,this.iris,this.flash),this.rack=r(`fx-rack`),this.rack.innerHTML=`<div class="fx-head">FX RACK</div>`,_.forEach((e,t)=>{let i=ve[e],a=r(`fx-mod`);a.style.setProperty(`--c`,I[e].color),a.innerHTML=`<div class="fx-name"><kbd>${Pt(n[t]??``)}</kbd>${Gv[i]}</div>
        <div class="fx-meter"><div class="fx-fill"></div></div>
        <div class="fx-leds"></div><div class="fx-val">-</div><div class="fx-grade"></div>`;let o=e=>a.querySelector(e);this.modules.set(i,{el:a,fill:o(`.fx-fill`),val:o(`.fx-val`),grade:o(`.fx-grade`),leds:o(`.fx-leds`),text:``,gradeText:``}),this.rack.appendChild(a)}),e.appendChild(this.rack)}update(e,t){let n=Ce.intensity,r=Ce;this.updateRack(e),this.wasGap&&!e.gap&&(this.flashLevel=r.lift.flash),this.wasGap=e.gap,this.flashLevel=Math.max(0,this.flashLevel-t*3.5);let i=1-r.pump.scale*e.duck*n+r.lift.zoom*e.lift*n,a=r.lift.risePx*e.lift*n,o=e.repeat.slice>=0,s=o&&e.repeat.open?r.stutter.jitterPx*n*(e.repeat.slice%2==0?1:-1):0,c=i===1&&a===0&&s===0?``:`translate(${s.toFixed(1)}px, ${(-a).toFixed(1)}px) scale(${i.toFixed(4)})`;this.arena.style.transform=c,this.freeze.style.transform=c;let l=r.sweep.blurPx*e.closed*n,u=Math.max(0,1-r.sweep.desaturate*e.closed*n+.6*e.lift*n),d=e.gap?.35:1,f=o&&!e.repeat.open?.6:1,p=Math.max(.1,1-r.pump.dim*e.duck*n+r.lift.bright*e.lift*n)*d*f,m=l<.05&&Math.abs(u-1)<.01&&Math.abs(p-1)<.01;this.arena.style.filter=m?``:`blur(${l.toFixed(2)}px) saturate(${u.toFixed(3)}) brightness(${p.toFixed(3)})`;let h=e.closed*r.sweep.iris*n;this.iris.style.opacity=h.toFixed(3),this.iris.style.setProperty(`--r`,`${(72-52*e.closed).toFixed(1)}%`);let g=Math.max(this.flashLevel,r.lift.tint*e.lift);this.flash.style.opacity=(g*n).toFixed(3),o&&e.repeat.id!==this.frozenId&&(this.frozenId=e.repeat.id,this.grab());let _=o&&e.repeat.open&&n>0;if(this.freeze.style.opacity=_?String(r.stutter.freezeOpacity):`0`,_){let t=e.repeat.slice%2==0?1:-1;this.freeze.style.translate=`${(-2*t*r.stutter.jitterPx*n).toFixed(1)}px 0`}}grab(){let e=this.freeze,t=Math.max(1,Math.round(this.arena.width/2)),n=Math.max(1,Math.round(this.arena.height/2));(e.width!==t||e.height!==n)&&(e.width=t,e.height=n),e.getContext(`2d`)?.drawImage(this.arena,0,0,t,n)}updateRack(e){let t=(t,n,r,i)=>{let a=this.modules.get(t);a.el.classList.toggle(`on`,n),a.fill.style.width=`${Math.round(Math.max(0,Math.min(1,r))*100)}%`,a.text!==i&&(a.text=i,a.val.textContent=i);let o=e.last[t],s=!!o&&o.age<Ce.rackFlash,c=s?Kv[o.judgement]:``;a.el.classList.toggle(`hit`,s),a.el.classList.toggle(`fumble`,s&&o.judgement===`miss`),a.gradeText!==c&&(a.gradeText=c,a.grade.textContent=c)},n=20*Math.log10(Math.max(.001,1-e.duck));t(`pump`,e.duck>.06,e.duck,e.duck>.06?`${n.toFixed(0)} dB`:`0 dB`);let r=e.cutoffHz>=1e3?`${(e.cutoffHz/1e3).toFixed(1)} kHz`:`${e.cutoffHz.toFixed(0)} Hz`;t(`sweep`,e.closed>.05,e.closed,e.closed>.05?r:`OPEN`);let i=e.repeat;t(`stutter`,i.slice>=0,i.of?(i.slice+1)/i.of:0,i.slice>=0?`1/${Math.round(4/i.beats)}`:`OFF`);let a=this.modules.get(`stutter`).leds,o=i.slice>=0?Array.from({length:i.of},(e,t)=>`<i class="${t<=i.slice?`lit`:``}"></i>`).join(``):``;a.innerHTML!==o&&(a.innerHTML=o),t(`lift`,e.lift>.02||e.gap,e.gap?1:e.lift,e.gap?`DROP`:e.lift>.02?`+${e.semis.toFixed(1)} st`:`0 st`)}dispose(){this.arena.style.transform=``,this.arena.style.filter=``,this.freeze.remove(),this.iris.remove(),this.flash.remove(),this.rack.remove()}},Jv={perfect:`PERFECT`,great:`GREAT`,good:`GOOD`,miss:`MISS`},Yv=class{canvas;chart;session;arena;keys;opts;extraDraw=null;ctx;judgementText=null;comboBanner=null;dpr=1;constructor(e,t,n,r,i,a={}){this.canvas=e,this.chart=t,this.session=n,this.arena=r,this.keys=i,this.opts=a,this.ctx=e.getContext(`2d`),n.bus.on(`judgement`,e=>this.onJudgement(e)),n.bus.on(`combo`,e=>this.comboBanner={e,at:this.now}),this.resize()}resize(){this.dpr=Math.min(window.devicePixelRatio||1,2),this.canvas.width=Math.floor(this.canvas.clientWidth*this.dpr),this.canvas.height=Math.floor(this.canvas.clientHeight*this.dpr)}now=0;onJudgement(e){(e.kind!==`holdEnd`||e.judgement===`miss`)&&(this.judgementText={j:e.judgement,offset:e.offset,at:this.now})}draw(e,t){this.now=e;let{ctx:n}=this,r=this.canvas.width/this.dpr,i=this.canvas.height/this.dpr;n.setTransform(this.dpr,0,0,this.dpr,0,0),n.clearRect(0,0,r,i),n.textAlign=`center`,n.textBaseline=`middle`;let a=this.arena.laneScreen();(this.opts.laneLabels??!0)&&this.drawLaneLabels(a,r,i),(this.opts.judgement??!0)&&(this.drawJudgement(e,a,r),this.drawCombo(a,r)),(this.opts.comboTags??!0)&&this.drawComboTags(e,t),(this.opts.prompts??!0)&&this.drawPrompt(e,r,i),this.drawEnemyBanner(e,r),this.drawComboBanner(e,r,i),this.drawTimingBar(r,i);let o=this.chart.bars,s=this.session.conductor.beatAt(e),c=Math.max(0,Math.min(1,s/Math.max(1,o.length*this.chart.beatsPerBar)));n.fillStyle=`rgba(57,255,106,0.18)`,n.fillRect(0,0,r,3),n.fillStyle=$.green,n.fillRect(0,0,r*c,3),this.extraDraw?.(n,e,r,i)}drawLaneLabels(e,t,n){let{ctx:r}=this,i=this.arena.heldLanes,a=Math.max(70,Math.min(130,e.width*1.15)),o=n-46;_.forEach((t,n)=>{let s=I[t],c=e.xs[n]+(e.xs[n]-(e.xs[0]+e.xs[3])/2)*.35,l=i[n];r.fillStyle=l?Q(s.color,.35):`rgba(0,10,4,0.72)`,r.strokeStyle=Q(s.color,l?1:.75),r.lineWidth=l?3:1.5,r.beginPath(),r.roundRect(c-a/2,o-26,a,56,8),r.fill(),r.stroke(),r.fillStyle=l?$.white:s.color,r.font=`bold 20px monospace`,r.fillText(Pt(this.keys[n]??``),c-a/2+20,o-6),yp(r,t,c+a/2-20,o-6,11,s.color),r.font=`bold 12px monospace`,r.fillStyle=Q(s.color,.95),r.fillText(s.label,c,o+17)})}drawJudgement(e,t,n){let r=this.judgementText;if(!r)return;let i=e-r.at;if(i<0||i>=Up.judgementTextLife)return;let{ctx:a}=this,o=1-i/Up.judgementTextLife,s=t.xs[3]+(t.xs[3]-t.xs[2])*1.6,c=t.y-30-(1-o)*12;a.globalAlpha=Math.min(1,o*2),a.fillStyle=$.judgement[r.j],a.font=`bold ${Math.round(26+6*o)}px monospace`,a.shadowColor=$.judgement[r.j],a.shadowBlur=14,a.textAlign=`left`,a.fillText(Jv[r.j],s,c),a.shadowBlur=0,r.j!==`miss`&&r.j!==`perfect`&&r.offset!==0&&(a.font=`13px monospace`,a.fillText(r.offset<0?`EARLY`:`LATE`,s,c+24)),a.textAlign=`center`,a.globalAlpha=1}drawCombo(e,t){let n=this.session.score.combo;if(n<4)return;let{ctx:r}=this,i=e.xs[0]-(e.xs[1]-e.xs[0])*1.6;r.textAlign=`right`,r.fillStyle=`rgba(230,255,233,0.85)`,r.font=`bold 40px monospace`,r.fillText(String(n),i,e.y-34),r.font=`12px monospace`,r.fillStyle=`rgba(57,255,106,0.8)`,r.fillText(`COMBO`,i,e.y-6),r.textAlign=`center`}drawComboTags(e,t){let{ctx:n}=this,r=this.arena.highway;for(let i of this.session.conductor.plays){if(i.start>e+t)break;if(!i.combo||i.start+i.dur<e)continue;let a=i.start>e?r.cueZ(i.start,e,t):r.hitZ,o=this.arena.toScreen(new K(r.laneX(3)+.75,0,a)),s=i.attempt>1,c=s||i.status===`failed`?wh:Ch,l=i.status===`failed`?`FAILED`:s?`RETRY ${i.attempt-1}/${i.maxAttempts-1}`:`COMBO`;n.font=`bold 13px monospace`,n.textAlign=`left`,n.fillStyle=`rgba(0,0,0,0.6)`;let u=n.measureText(l).width+12;n.fillRect(o.x,o.y-10,u,20),n.fillStyle=c,n.fillText(l,o.x+6,o.y+1),n.textAlign=`center`}}drawComboBanner(e,t,n){let r=this.comboBanner,{ctx:i}=this,a=this.session.conductor.playAt(e);if(a?.combo){let e=a.attempt>1;i.font=`bold 14px monospace`,i.fillStyle=e||a.status===`failed`?wh:Ch,i.fillText(a.status===`failed`?`COMBO BROKEN`:e?`BOSS COMBO · RETRY ${a.attempt-1}/${a.maxAttempts-1}`:`BOSS COMBO · clear the measure`,t/2,64)}if(!r)return;let o=e-r.at,s=r.e.type===`failed`?1.1:.7;if(o<0||o>s)return;let c=1-o/s;i.globalAlpha=Math.min(1,c*2.5);let l=r.e.type===`failed`,u=l?wh:Ch;i.shadowColor=u,i.shadowBlur=20,i.fillStyle=u,i.font=`bold ${Math.round(34+8*c)}px monospace`;let d=n*.27;i.fillText(l?`COMBO FAILED`:`COMBO CLEAR`,t/2,d),i.shadowBlur=0,r.e.type===`failed`&&(i.font=`bold 16px monospace`,i.fillStyle=$.white,i.fillText(r.e.retry?`again next measure`:`no retries left: moving on`,t/2,d+32)),i.globalAlpha=1}drawPrompt(e,t,n){let r=this.chart.tempo.beatToSec(this.session.conductor.beatAt(e)),i=this.chart.prompts.filter(e=>r>=e.time&&r<e.endTime),a=i[i.length-1];if(!a)return;let{ctx:o}=this,s=Math.min(1,(r-a.time)/.25,(a.endTime-r)/.35),c=a.action?I[a.action].color:$.white;o.font=`bold 20px monospace`;let l=o.measureText(a.text).width,u=a.action?92:0,d=Math.min(t-40,l+u+48),f=(t-d)/2,p=n*.13;if(o.globalAlpha=s,o.fillStyle=`rgba(0,8,3,0.82)`,o.strokeStyle=c,o.lineWidth=2,o.shadowColor=c,o.shadowBlur=18,o.beginPath(),o.roundRect(f,p,d,56,10),o.fill(),o.stroke(),o.shadowBlur=0,a.action){let e=_.indexOf(a.action);yp(o,a.action,f+34,p+28,15,c),o.strokeStyle=c,o.lineWidth=2,o.beginPath(),o.roundRect(f+56,p+12,32,32,5),o.stroke(),o.fillStyle=c,o.font=`bold 18px monospace`,o.fillText(Pt(this.keys[e]??``),f+72,p+29)}o.fillStyle=$.white,o.font=`bold 20px monospace`,o.textAlign=`left`,o.fillText(a.text,f+24+u,p+29,d-u-40),o.textAlign=`center`,o.globalAlpha=1}drawEnemyBanner(e,t){let n=this.session.duel,r=n.activeEncounter(e);if(r===null)return;let i=this.chart.encounters[r],a=n.enemies[r],{ctx:o}=this;o.font=`bold 15px monospace`,o.fillStyle=$.white;let s=a.state===`defeated`?` · DEFEATED`:a.state===`escaped`?` · ESCAPED`:``;o.fillText(`ENEMY ${r+1}/${this.chart.encounters.length} · ${i.name}${s}`,t/2,30);let c=a.guardMax;if(c>0){let e=Math.min(14,260/c),n=e*c;for(let r=0;r<c;r++)o.fillStyle=r<a.guard&&a.state!==`defeated`?$.danger:`rgba(255,59,92,0.18)`,o.fillRect(t/2-n/2+r*e+1,43,e-2,6)}}drawTimingBar(e,t){let{ctx:n}=this,r=t-8,i=e/2;n.fillStyle=`rgba(57,255,106,0.15)`,n.fillRect(i-110,r-1,220,2),n.fillStyle=$.white,n.fillRect(i-1,r-5,2,10);let a=this.session.score.recentOffsets;a.forEach((e,t)=>{let o=(t+1)/a.length,s=i+Math.max(-1,Math.min(1,e/.12))*110;n.fillStyle=Q(Math.abs(e)<.04?$.white:$.green,o*.8),n.fillRect(s-1,r-4,2,8)})}},Xv=class{toSongTime;queue=[];held=new Set;keys=[];altKeys=[];onDown=e=>this.handle(e,!0);onUp=e=>this.handle(e,!1);constructor(e){this.toSongTime=e,window.addEventListener(`keydown`,this.onDown),window.addEventListener(`keyup`,this.onUp)}setKeys(e,t=[]){this.keys=e,this.altKeys=e.length?t:[],this.held.clear()}isHeld(e){return this.held.has(e)}push(e,t,n){t!==this.held.has(e)&&(t?this.held.add(e):this.held.delete(e),this.queue.push({lane:e,down:t,time:this.toSongTime(n)}))}drain(){return this.queue.splice(0,this.queue.length)}dispose(){window.removeEventListener(`keydown`,this.onDown),window.removeEventListener(`keyup`,this.onUp)}handle(e,t){let n=this.keys.indexOf(e.code);n<0&&(n=this.altKeys.indexOf(e.code)),!(n<0)&&(e.preventDefault(),!e.repeat&&this.push(n,t,e.timeStamp))}};function Zv(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}var Qv=class{jitter;missRate;failFirstTry;queue=[];r;failed=new Set;constructor(e,t,n,r=[]){this.jitter=e,this.missRate=t,this.failFirstTry=r,this.r=Zv(n)}gauss(){let e=Math.max(1e-9,this.r());return Math.sqrt(-2*Math.log(e))*Math.cos(2*Math.PI*this.r())}onCues(e){for(let t of e){if(t.attempt===1&&this.failFirstTry.includes(t.bar)&&!this.failed.has(t.bar)){let n=+(e.filter(e=>e.bar===t.bar&&e.attempt===1).length>1);if(e.filter(e=>e.bar===t.bar&&e.attempt===1).indexOf(t)===n){this.failed.add(t.bar);continue}}if(this.r()<this.missRate)continue;let n=t.time+this.gauss()*this.jitter;this.queue.push({lane:t.lane,down:!0,time:n,auto:!0,cue:t.id});let r=t.endTime===null?n+.05:t.endTime+.01;this.queue.push({lane:t.lane,down:!1,time:r,auto:!0,cue:t.id})}this.queue.sort((e,t)=>e.time-t.time||(e.down===t.down?0:e.down?1:-1))}onDropped(e){let t=new Set(e);for(let e=this.queue.length-1;e>=0;e--){let n=this.queue[e];t.has(n.cue)&&n.down&&this.queue.splice(e,1)}}due(e){let t=[];for(;this.queue.length&&this.queue[0].time<=e;){let e=this.queue.shift();t.push({lane:e.lane,down:e.down,time:e.time,auto:!0})}return t}};function $v(e,t,n,r){let i=e.judgement!==`miss`,a=t.action!==`block`;return{noteId:e.noteId,chartNoteId:t.noteId,lane:e.lane,action:t.action,encounter:t.encounter,kind:e.kind,judgement:e.judgement,hit:i,hold:i&&e.kind===`holdStart`,final:n&&(e.kind!==`holdStart`||!i),combo:t.combo,crit:i&&a&&e.judgement===`perfect`&&r.critMultiplier>1.15,time:e.time,mods:r}}var ey=class{chart;noFail;startTimeOf;enemies;outcomes=new Map;hp=fe.maxHp;parryCharge=0;defeated=0;escaped=0;hitsTaken=0;down=!1;nextEnter=0;landed=new Set;pending=[];constructor(e,t,n=t=>e.encounters[t]?.startTime??null){this.chart=e,this.noFail=t,this.startTimeOf=n,this.enemies=e.encounters.map(t=>{let n=t.noteIds.filter(t=>e.notes[t].action!==`block`).length;return{index:t.index,state:`waiting`,stateTime:0,guard:n,guardMax:n}})}outcome(e){return this.outcomes.get(e)??`pending`}activeEncounter(e){let t=null;for(let n=0;n<this.enemies.length;n++){let r=this.startTimeOf(n);if(r===null||r>e)break;t=n}return t}isLastNote(e){let t=this.chart.notes[e];if(!t)return!1;let n=this.chart.encounters[t.encounter].noteIds;return n[n.length-1]===e}apply(e){this.enterUpTo(e.time);let t=this.enemies[e.encounter],n=this.outcome(e.noteId);if(!t||n===`hit`||n===`miss`)return;let r={noteId:e.noteId,encounter:e.encounter,time:e.time};e.kind===`holdEnd`?e.hit?(this.outcomes.set(e.noteId,`hit`),this.pending.push({type:`released`,...r,action:e.action})):(this.outcomes.set(e.noteId,`miss`),this.missConsequence(e,t)):e.hit?(this.outcomes.set(e.noteId,e.hold?`holding`:`hit`),e.action===`block`?this.pending.push({type:`blocked`,...r,judgement:e.judgement,lock:e.hold}):(this.landed.has(e.chartNoteId)||(this.landed.add(e.chartNoteId),t.guard=Math.max(0,t.guard-1)),this.pending.push({type:`struck`,...r,action:e.action,judgement:e.judgement,crit:e.crit,damage:I[e.action].damage*(e.crit?2:1),hold:e.hold})),this.parryCharge=Math.min(3,this.parryCharge+e.mods.parryChargePerHit),this.hp=Math.min(fe.maxHp,this.hp+fe.heal[e.judgement])):(this.outcomes.set(e.noteId,`miss`),this.missConsequence(e,t)),e.final&&this.resolve(t,this.outcome(e.noteId)===`hit`,e.noteId,e.time)}escape(e,t,n){let r=this.enemies[e];r&&this.resolve(r,!1,t,n)}update(e){return this.enterUpTo(e),this.pending.splice(0,this.pending.length)}resolve(e,t,n,r){e.state===`fighting`&&(e.state=t?`defeated`:`escaped`,e.stateTime=r,t?this.defeated++:this.escaped++,this.pending.push({type:t?`defeated`:`escaped`,noteId:n,encounter:e.index,time:r}))}enterUpTo(e){for(;this.nextEnter<this.enemies.length;){let t=this.startTimeOf(this.nextEnter);if(t===null||t>e)break;let n=this.enemies[this.nextEnter];n.state=`fighting`,n.stateTime=t,this.pending.push({type:`enemyEnter`,encounter:n.index,time:t}),this.nextEnter++}}damage(e,n,r){let i=this.chart.encounters[n.index].enemy,a=fe.missDamage*t[i].damageMultiplier;this.hitsTaken++,this.hp=Math.max(0,this.hp-a),this.pending.push({type:`playerHit`,noteId:e.noteId,encounter:e.encounter,damage:a,combo:r,time:e.time}),this.hp<=0&&!this.down&&!this.noFail&&(this.down=!0,this.pending.push({type:`playerDown`,time:e.time}))}missConsequence(e,t){let n={noteId:e.noteId,encounter:e.encounter,time:e.time};e.combo?this.damage(e,t,!0):e.action===`block`?this.parryCharge>=1?(--this.parryCharge,this.pending.push({type:`parry`,...n})):this.damage(e,t,!1):this.pending.push({type:`recovered`,...n,action:e.action})}},ty=class{handlers={};on(e,t){let n=this.handlers[e]??=[];return n.push(t),()=>{let e=n.indexOf(t);e>=0&&n.splice(e,1)}}emit(e,t){let n=this.handlers[e];if(n)for(let e of[...n])e(t)}clear(){this.handlers={}}},ny=class{windows;state=[];byLane;cursor;holding;pendingCount=0;constructor(e,t,n){this.windows=n,this.byLane=Array.from({length:t},()=>[]),this.cursor=Array(t).fill(0),this.holding=Array(t).fill(null);for(let t of e)this.add(t)}add(e){let t=this.byLane[e.lane];if(!t)return;this.state[e.id]=`pending`,this.pendingCount++;let n=t.length;for(;n>this.cursor[e.lane]&&t[n-1].time>e.time;)n--;t.splice(n,0,e)}void(e){this.state[e]===`pending`&&(this.state[e]=`void`,this.pendingCount--)}classify(e){let t=this.windows;return e<=t.perfect?`perfect`:e<=t.great?`great`:e<=t.good?`good`:`miss`}isPending(e){return this.state[e]===`pending`}isHolding(e){return this.state[e]===`holding`}isVoid(e){return this.state[e]===`void`}press(e,t){let n=this.byLane[e];if(!n||this.holding[e])return null;for(let r=this.cursor[e];r<n.length;r++){let i=n[r];if(this.state[i.id]!==`pending`)continue;let a=t-i.time;if(a>this.windows.good)continue;if(a<-this.windows.miss)return null;let o=this.classify(Math.abs(a));return this.pendingCount--,i.endTime!==null&&o!==`miss`?(this.state[i.id]=`holding`,this.holding[e]=i,{noteId:i.id,lane:e,kind:`holdStart`,judgement:o,offset:a,time:t}):(this.state[i.id]=`done`,this.advance(e),{noteId:i.id,lane:e,kind:i.endTime===null?`tap`:`holdStart`,judgement:o,offset:a,time:t})}return null}release(e,t){let n=this.holding[e];if(!n||n.endTime===null)return null;this.holding[e]=null,this.state[n.id]=`done`,this.advance(e);let r=t-n.endTime,i=r>=-this.windows.good?`perfect`:`miss`;return{noteId:n.id,lane:e,kind:`holdEnd`,judgement:i,offset:r,time:t}}update(e){let t=[];for(let n=0;n<this.byLane.length;n++){let r=this.holding[n];r&&r.endTime!==null&&e>=r.endTime&&(this.holding[n]=null,this.state[r.id]=`done`,t.push({noteId:r.id,lane:n,kind:`holdEnd`,judgement:`perfect`,offset:0,time:r.endTime}));let i=this.byLane[n];for(let r=this.cursor[n];r<i.length;r++){let a=i[r];if(this.state[a.id]===`pending`){if(e-a.time<=this.windows.good)break;this.state[a.id]=`done`,this.pendingCount--,t.push({noteId:a.id,lane:n,kind:a.endTime===null?`tap`:`holdStart`,judgement:`miss`,offset:0,time:a.time+this.windows.good})}}this.advance(n)}return t.sort((e,t)=>e.time-t.time)}get finished(){return this.pendingCount===0&&this.holding.every(e=>e===null)}advance(e){let t=this.byLane[e],n=this.cursor[e];for(;n<t.length&&this.state[t[n].id]!==`pending`&&this.state[t[n].id]!==`holding`;)n++;this.cursor[e]=n}},ry=class{score=0;combo=0;maxCombo=0;counts={perfect:0,great:0,good:0,miss:0};weightSum=0;judged=0;recentOffsets=[];get accuracy(){return this.judged===0?1:this.weightSum/this.judged}get multiplier(){let e=1;for(let[t,n]of de)this.combo>=t&&(e=n);return e}get meanOffsetMs(){return this.recentOffsets.length===0?0:this.recentOffsets.reduce((e,t)=>e+t,0)/this.recentOffsets.length*1e3}apply(e,t=1){this.counts[e.judgement]++,this.judged++,this.weightSum+=le[e.judgement],e.judgement===`miss`?this.combo=0:(this.combo++,this.maxCombo=Math.max(this.maxCombo,this.combo),this.score+=Math.round(ue[e.judgement]*this.multiplier*t),e.kind!==`holdEnd`&&(this.recentOffsets.push(e.offset),this.recentOffsets.length>40&&this.recentOffsets.shift()))}get grade(){let e=this.accuracy;return this.counts.miss===0&&e>=.98?`SS`:e>=.95?`S`:e>=.9?`A`:e>=.8?`B`:e>=.7?`C`:`D`}},iy=class{chart;plays=[];cues=[];constructor(e){this.chart=e}planUntil(e){let t=[];for(;;){let n=this.plays[this.plays.length-1];if(n&&n.start>=e)break;let r=this.nextPlay(n);if(!r)break;this.plays.push(r);let i=this.chart.bars[r.bar];for(let e of i.noteIds){let n=this.chart.notes[e],a={id:this.cues.length,noteId:e,play:r.index,bar:r.bar,lane:n.lane,action:n.action,time:r.start+(n.time-i.startSec),endTime:n.endTime===null?null:r.start+(n.endTime-i.startSec),encounter:n.encounter,combo:r.combo,attempt:r.attempt,removed:!1};this.cues.push(a),r.cueIds.push(a.id),t.push(a)}}return t}nextPlay(e){let t=this.chart.bars;if(!e){let e=t[0];return e?this.makePlay(0,0,e.startSec,1):null}let n=e.start+e.dur;return e.combo&&e.status===`failed`&&e.attempt<e.maxAttempts?this.makePlay(e.index+1,e.bar,n,e.attempt+1):e.bar+1>=t.length?null:this.makePlay(e.index+1,e.bar+1,n,1)}makePlay(e,t,n,r){let i=this.chart.bars[t];return{index:e,bar:t,start:n,dur:i.durSec,attempt:r,maxAttempts:i.combo?i.combo.retries+1:1,combo:i.combo!==null,status:`planned`,failTime:null,cueIds:[]}}fail(e,t){let n=this.plays[e];if(!n||!n.combo)return{retry:!1,removed:[],firstFail:!1};if(n.status===`failed`)return{retry:n.attempt<n.maxAttempts,removed:[],firstFail:!1};n.status=`failed`,n.failTime=t;let r=n.attempt<n.maxAttempts,i=[];if(r)for(let t of this.plays.splice(e+1))for(let e of t.cueIds){let t=this.cues[e];t.removed=!0,i.push(t)}return{retry:r,removed:i,firstFail:!0}}playAt(e){for(let t=this.plays.length-1;t>=0;t--){let n=this.plays[t];if(n.start<=e)return e<n.start+n.dur?n:null}return null}beatAt(e){let t=this.playAt(e),n=this.chart.beatsPerBar;if(t)return this.chart.bars[t.bar].startBeat+(e-t.start)/t.dur*n;let r=this.plays[0];if(!r||e<r.start)return this.chart.tempo.secToBeat(e);let i=this.plays[this.plays.length-1];return this.chart.bars[i.bar].startBeat+n+(e-i.start-i.dur)/i.dur*n}firstTimeOfBeat(e){let t=this.chart.beatsPerBar,n=Math.floor(e/t+1e-9),r=this.plays.find(e=>e.bar===n);if(!r)return e<=0?this.chart.tempo.beatToSec(e):null;let i=this.chart.bars[n];return r.start+(this.chart.tempo.beatToSec(e)-i.startSec)}get complete(){let e=this.plays[this.plays.length-1];return!!e&&this.nextPlay(e)===null}get endTime(){let e=this.plays[this.plays.length-1];return e?e.start+e.dur:0}},ay=class{chart;bus=new ty;conductor;judge;duel;score=new ry;patch;mods;combosCleared=0;combosFailed=0;lastTime=-1/0;nextMeasure=0;constructor(e,t){this.chart=e,this.conductor=new iy(e),this.judge=new ny([],e.lanes.length,t.windows??ce),this.duel=new ey(e,t.noFail,e=>this.encounterStart(e)),this.patch={...t.patch??C},this.mods=m(this.patch)}setPatch(e){this.patch={...e},this.mods=m(this.patch)}encounterStart(e){let t=this.chart.encounters[e];return t?this.conductor.firstTimeOfBeat(t.startBeat):null}encounterCues(e){return this.conductor.cues.filter(t=>t.encounter===e&&!t.removed&&!this.judge.isVoid(t.id))}cuesBetween(e,t){return this.conductor.cues.filter(n=>!n.removed&&!this.judge.isVoid(n.id)&&(n.endTime??n.time)>=e&&n.time<=t)}step(e,t){for(let t of e){this.advance(t.time),this.bus.emit(`input`,t);let e=t.down?this.judge.press(t.lane,t.time):this.judge.release(t.lane,t.time);e&&this.handleJudgement(e)}this.advance(t)}get finished(){return this.duel.down||this.conductor.complete&&this.judge.finished&&this.lastTime>=this.lastCueEnd()}lastCueEnd(){let e=0;for(let t of this.conductor.cues)t.removed||(e=Math.max(e,t.endTime??t.time));return e}plan(e){let t=this.conductor.planUntil(e+4);if(t.length!==0){for(let e of t)this.judge.add(e);this.bus.emit(`cues`,t)}}advance(e){e<this.lastTime&&(e=this.lastTime),this.lastTime=e,this.plan(e);for(let t of this.judge.update(e))this.handleJudgement(t);for(;this.nextMeasure<this.conductor.plays.length;){let t=this.conductor.plays[this.nextMeasure];if(t.start>e)break;this.bus.emit(`measure`,t),this.nextMeasure++}for(let t of this.duel.update(e))this.bus.emit(`duel`,t)}handleJudgement(e){let t=this.conductor.cues[e.noteId],n=e.judgement===`miss`,r=!1,i=null;t.combo&&n&&(i=this.conductor.fail(t.play,e.time),r=i.retry);let a=$v(e,t,this.duel.isLastNote(t.noteId)&&!(n&&r),this.mods);this.score.apply(e,a.crit?this.mods.critMultiplier:1),this.bus.emit(`judgement`,e),this.bus.emit(`action`,a),this.duel.apply(a),i?.firstFail?this.failCombo(t,i,e.time):t.combo&&!n&&e.kind!==`holdStart`&&this.checkCleared(t,e.time);for(let t of this.duel.update(e.time))this.bus.emit(`duel`,t)}failCombo(e,t,n){let r=this.conductor.plays[e.play],i=[];for(let e of r.cueIds)if(this.judge.isPending(e)){this.judge.void(e),i.push(e);let r=this.conductor.cues[e];!t.retry&&this.duel.isLastNote(r.noteId)&&this.duel.escape(r.encounter,e,n)}for(let e of t.removed)this.judge.void(e.id),i.push(e.id);this.combosFailed++,i.length&&this.bus.emit(`cuesDropped`,i),this.bus.emit(`combo`,{type:`failed`,play:r,retry:t.retry,time:n,until:r.start+r.dur}),t.retry&&this.plan(n)}checkCleared(e,t){let n=this.conductor.plays[e.play];n.status!==`failed`&&n.cueIds.every(e=>this.duel.outcome(e)===`hit`)&&(this.combosCleared++,this.bus.emit(`combo`,{type:`cleared`,play:n,time:t}))}},oy=2,sy=class{els;sfx;rain;settings;opts;hooks;session;engine;arena;hud;keyboard;layer;fx;auto;runtime;approachBase;raf=0;lastPerf=0;ended=!1;downAt=null;onResize=()=>{this.arena.resize(),this.hud.resize()};onPointer=e=>this.pointerLane(e);constructor(e,t,n,r,i,a,o,s,c){this.els=e,this.sfx=r,this.rain=i,this.settings=a,this.opts=s,this.hooks=c;let l=t.chart,u=s.experiment??null,d=u?.options??{};this.session=new ay(l,{noFail:a.noFail,patch:o,windows:{...ce,...d.windows}}),this.engine=new L_(n,l,t.stems);let f=d.keys??a.keys4;this.keyboard=new Xv(e=>this.engine.timeAt(e)),this.keyboard.setKeys(s.autoplay?[]:[...f],[...d.altKeys??[]]),this.arena=new Wv(e.arenaCanvas,e.labelLayer,l,this.session,{highway:d.highway??!0,enemyIcon:d.enemyIcon??!0}),this.hud=new Yv(e.hudCanvas,l,this.session,this.arena,f,{laneLabels:d.laneLabels??!0,comboTags:d.highway??!0,judgement:d.judgementHud??!0,prompts:d.prompts??!0}),this.approachBase=d.approachSeconds??1.6;let p=d.musicMapping??a.musicMapping;this.layer=p===`none`?{}:At(p).create({ctx:n,engine:this.engine,sfx:r,chart:l,session:this.session});let m=e.arenaCanvas.parentElement;if(this.fx=this.layer.meter&&m?new qv(m,e.arenaCanvas,f):null,this.auto=s.autoplay?new Qv(me.jitter,me.missRate,me.seed,s.autoplayFailBars??[]):null,this.auto){let e=this.auto;this.session.bus.on(`cues`,t=>e.onCues(t)),this.session.bus.on(`cuesDropped`,t=>e.onDropped(t))}this.session.bus.on(`action`,e=>{e.hit&&e.action===`block`&&this.rain.pulse(.6),e.hit&&e.action===`flourish`&&this.rain.pulse(1)}),this.session.bus.on(`duel`,e=>{e.type===`playerHit`&&(this.sfx.hurt(),cy())}),this.session.bus.on(`combo`,e=>{e.type===`failed`&&(this.engine.wonky(e.time,e.until),cy())}),this.runtime=u?.create?.({scene:this.arena.scene,camera:this.arena.camera,arena:this.arena,session:this.session,chart:l,engine:this.engine,audio:n,sfx:r,rain:i,settings:a,keys:f,autoplay:s.autoplay})??{};let h=this.runtime;h.update&&this.arena.onBeforeRender((e,t)=>h.update(e,t,this.approach())),h.drawHud&&(this.hud.extraDraw=(e,t,n,r)=>h.drawHud(e,t,n,r)),window.addEventListener(`resize`,this.onResize),e.hudCanvas.addEventListener(`pointerdown`,this.onPointer),e.hudCanvas.addEventListener(`pointerup`,this.onPointer)}start(){this.applySettings(this.settings),this.engine.start(-2.5),this.lastPerf=performance.now(),this.raf=requestAnimationFrame(this.frame)}applySettings(e){this.settings=e,this.engine.userOffsetSec=e.audioOffsetMs/1e3,this.arena.visualOffset=e.visualOffsetMs/1e3,this.engine.output.gain.cancelScheduledValues(0),this.engine.output.gain.value=e.musicVolume,this.sfx.volume=e.hitsoundVolume}approach(){return this.approachBase/Math.max(.25,this.settings.scrollSpeed)}setPatch(e){this.session.setPatch(e)}get paused(){return!this.engine.playing}pause(){this.engine.pause()}resume(){this.engine.resume()}stop(){cancelAnimationFrame(this.raf),this.engine.stop(),this.runtime.dispose?.(),this.layer.dispose?.(),this.fx?.dispose(),this.keyboard.dispose(),this.arena.dispose(),window.removeEventListener(`resize`,this.onResize),this.els.hudCanvas.removeEventListener(`pointerdown`,this.onPointer),this.els.hudCanvas.removeEventListener(`pointerup`,this.onPointer),this.session.bus.clear(),this.els.hudCanvas.getContext(`2d`)?.clearRect(0,0,this.els.hudCanvas.width,this.els.hudCanvas.height)}frame=e=>{this.raf=requestAnimationFrame(this.frame);let t=(e-this.lastPerf)/1e3,n=Math.min(.05,t);this.lastPerf=e,this.engine.sampleClock(e);let r=this.engine.timeAt(e);if(this.engine.playing){let e=this.runtime.mapInput,t=[];for(let n of this.keyboard.drain()){let i=e?e(n,r):n;i&&t.push(i)}this.runtime.pollInputs&&t.push(...this.runtime.pollInputs(r)),this.auto&&t.push(...this.auto.due(r)),t.sort((e,t)=>e.time-t.time),this.session.step(t,r),this.engine.schedule(this.session.conductor.plays,r),this.layer.update?.(r)}let i=r+this.settings.visualOffsetMs/1e3,a=this.approach();this.arena.update(i,this.engine.playing?n:0,t,a),this.fx&&this.layer.meter&&this.fx.update(this.layer.meter(i),n),this.hud.draw(i,a),this.rain.update(n),this.hooks.onFrame(this.session,r),!this.ended&&(this.session.duel.down?(this.downAt??=e,this.engine.output.gain.value*=.95,e-this.downAt>1500&&this.finish(!0)):this.session.finished&&r>this.session.lastCueEnd()+oy&&this.finish(!1))};finish(e){this.ended=!0,this.engine.output.gain.setTargetAtTime(0,this.engine.ctx.currentTime,.3),this.hooks.onEnd(this.session,e)}pointerLane(e){if(this.opts.autoplay)return;let t=this.els.hudCanvas.getBoundingClientRect(),{xs:n,width:r}=this.arena.laneScreen(),i=e.clientX-t.left,a=-1,o=1/0;n.forEach((e,t)=>{let n=Math.abs(e-i);n<o&&(o=n,a=t)}),!(a<0||o>r*2)&&this.keyboard.push(a,e.type===`pointerdown`,e.timeStamp)}};function cy(){let e=document.getElementById(`app`);e&&(e.classList.remove(`glitch`),e.offsetWidth,e.classList.add(`glitch`))}var ly=class{canvas;ctx;drops=[];speeds=[];cols=0;boost=0;acc=0;constructor(e){this.canvas=e,this.ctx=e.getContext(`2d`),this.resize()}resize(){let e=this.canvas.width=Math.floor(this.canvas.clientWidth);this.canvas.height=Math.floor(this.canvas.clientHeight),this.cols=Math.ceil(e/qp.fontSize),this.drops=Array.from({length:this.cols},()=>Math.random()*-50),this.speeds=Array.from({length:this.cols},()=>.6+Math.random()*.8),this.ctx.fillStyle=`#000`,this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height)}pulse(e=1){this.boost=Math.min(2,this.boost+e)}update(e){let{ctx:t,canvas:n}=this;if(this.boost=Math.max(0,this.boost-e*4),this.acc+=e,this.acc<1/30)return;let r=this.acc;this.acc=0,t.fillStyle=`rgba(0,0,0,${.12+r})`,t.fillRect(0,0,n.width,n.height),t.font=`${qp.fontSize}px monospace`;let i=n.height/qp.fontSize;for(let e=0;e<this.cols;e++){let n=this.drops[e],a=qp.glyphs[Math.floor(Math.random()*qp.glyphs.length)];t.fillStyle=Math.random()<.05+this.boost*.1?$.white:$.green,t.fillText(a,e*qp.fontSize,n*qp.fontSize),this.drops[e]=n+this.speeds[e]*qp.speed*r*(1+this.boost),this.drops[e]>i&&Math.random()>.97&&(this.drops[e]=Math.random()*-20)}}},uy=`voxel-rhythm-lab`,dy=[{key:`fun`,label:`FUN`,ask:`Did you enjoy it? Want another go?`},{key:`control`,label:`CONTROL`,ask:`Did your presses feel responsive and fair?`},{key:`read`,label:`READABILITY`,ask:`Could you tell what to press, and when?`},{key:`music`,label:`MUSIC`,ask:`Did your actions feel connected to the music?`}];function fy(e,t,n){let r=e.filter(e=>e!==n),i=Zv(t);for(let e=r.length-1;e>0;e--){let t=Math.floor(i()*(e+1));[r[e],r[t]]=[r[t],r[e]]}return n&&e.includes(n)?[n,...r]:r}function py(e,t,n,r,i=new Date){return{format:uy,v:1,seed:t,build:n,startedAt:i.toISOString(),order:fy(e,t,r),index:0,trials:[],skipped:[]}}function my(e){return e.order[e.index]??null}function hy(e){return e.index>=e.order.length}function gy(e,t){return{...e,index:e.index+1,trials:[...e.trials.filter(e=>e.exp!==t.exp),t]}}function _y(e){let t=my(e);return{...e,index:e.index+1,skipped:t?[...e.skipped,t]:e.skipped}}function vy(e){if(!e||typeof e!=`object`)return null;let t=e;return t.format!==`voxel-rhythm-lab`||t.v!==1||!Array.isArray(t.order)||!Array.isArray(t.trials)||typeof t.index!=`number`?null:{...t,skipped:Array.isArray(t.skipped)?t.skipped:[]}}function yy(e){return dy.reduce((t,n)=>t+e[n.key],0)/dy.length}function by(e){let t={lab:uy,v:1,build:e.build,started:e.startedAt,seed:e.seed,order:e.order,ratings:`fun,control,read,music (1-5)`,...e.skipped.length?{skipped:e.skipped}:{}},n=e.order.map(t=>e.trials.find(e=>e.exp===t)).filter(e=>!!e).map(e=>{let t=e.stats;return JSON.stringify({exp:e.exp,r:dy.map(t=>e.ratings[t.key]),...e.note?{note:e.note}:{},...e.plays>1?{plays:e.plays}:{},...t?{acc:Math.round(t.acc*1e3)/1e3,pgom:[t.perfect,t.great,t.good,t.miss],off:Math.round(t.offsetMs),hits:t.hitsTaken,combo:[t.combosCleared,t.combosFailed],kills:`${t.defeated}/${t.enemies}`}:{}})});return`${JSON.stringify(t).slice(0,-1)},"trials":[\n${n.join(`,
`)}\n]}`}var xy=`voxel-rhythm.lab.v1`;function Sy(){try{let e=localStorage.getItem(xy);return e?vy(JSON.parse(e)):null}catch{return null}}function Cy(e){try{localStorage.setItem(xy,JSON.stringify(e))}catch{}}function wy(){try{localStorage.removeItem(xy)}catch{}}var Ty=(e,t)=>e.length===t.length&&e.every(e=>t.includes(e)),Ey=e=>e.replace(/[&<>"]/g,e=>`&#${e.charCodeAt(0)};`),Dy=35,Oy=class{host;state=Sy();active=!1;plays=0;lastStats=null;draft={ratings:{},note:``};constructor(e){this.host=e}keys(){return N_.map(e=>e.key)}estimateMinutes(e){let t=e.reduce((e,t)=>{let n=P_(t);return e+(n?Bt(n)+Dy:0)},0);return Math.max(1,Math.round(t/60))}home(){this.active=!1,this.host.offScreen();let e=this.state,t=!!e&&!Ty(e.order,this.keys()),n=!!e&&!t&&!hy(e),r=e?.trials.length??0,i=e&&!t?e.order:this.keys(),a=this.host.show(`
      <h1>PLAYTEST LAB</h1>
      <div class="sub">${N_.length} gameplay experiments, one short trial each, about ${this.estimateMinutes(i)} minutes in total.</div>
      <div class="lab-box">
        <ol>
          <li>Each trial starts with a <b>10-second how-to</b> (press <kbd>Space</kbd> to skip it).</li>
          <li>Play the trial (about a minute, no-fail is on). Just play naturally.</li>
          <li>Rate it 1-5 on <b>fun</b>, <b>control</b>, <b>readability</b> and <b>music connection</b>, and add a one-line note if something stood out.</li>
        </ol>
        <div class="help">The baseline (the current game) always comes first as your reference; the rest are shuffled. Headphones help. Progress saves after every trial, so you can stop and resume.
        At the end, <b>COPY RESULTS</b> and paste the JSON into chat.</div>
      </div>
      ${n?`<div class="sub">In progress: trial ${e.index+1} of ${e.order.length} (${r} rated).</div>`:``}
      ${t?`<div class="sub">Your saved run (${r} rated) is from a version with different experiments. RESULTS still shows it; START begins a new run with all ${N_.length}.</div>`:``}
      <div style="margin-top:12px">
        ${n?`<button class="big" id="l-resume">RESUME</button>`:``}
        <button class="big" id="l-start">${e&&!t?`START OVER`:`START`}</button>
        ${r?`<button class="big" id="l-results">RESULTS</button>`:``}
        <button class="big" id="l-cal">CALIBRATE OFFSET</button>
        <button class="big" id="l-back">BACK</button>
      </div>`);a.querySelector(`#l-resume`)?.addEventListener(`click`,()=>this.next()),a.querySelector(`#l-start`).onclick=()=>{e&&e.trials.length&&!confirm(`Start a new run? Your saved Lab ratings will be cleared (copy them from RESULTS first).`)||(wy(),this.state=py(this.keys(),(Date.now()^Math.random()*2147483647)>>>0,this.host.build,M_),Cy(this.state),this.next())},a.querySelector(`#l-results`)?.addEventListener(`click`,()=>this.results()),a.querySelector(`#l-cal`).onclick=()=>this.host.calibrate(),a.querySelector(`#l-back`).onclick=()=>this.host.menu()}next(){let e=this.state;if(!e)return this.home();let t=my(e);if(t===null)return this.results();let n=P_(t);if(!n)return this.state=_y(e),Cy(this.state),this.next();this.plays=0,this.lastStats=null,this.draft={ratings:{},note:``},this.play(n)}play(e){let t=this.state;this.active=!0,this.plays++,this.host.runTrial(e,`PLAYTEST LAB · TRIAL ${t.index+1} / ${t.order.length}`,()=>this.home())}trialEnded(e){this.active=!1;let t=e.score;this.lastStats={acc:t.accuracy,perfect:t.counts.perfect,great:t.counts.great,good:t.counts.good,miss:t.counts.miss,offsetMs:t.meanOffsetMs,hitsTaken:e.duel.hitsTaken,combosCleared:e.combosCleared,combosFailed:e.combosFailed,defeated:e.duel.defeated,enemies:e.chart.encounters.length},this.rate()}trialQuit(){this.active=!1,this.rate()}rate(){let e=this.state,t=my(e),n=P_(t);this.host.offScreen();let r=this.lastStats,i=dy.findIndex(e=>this.draft.ratings[e.key]===void 0);i<0&&(i=0);let a=this.host.show(`
      <div class="sub">PLAYTEST LAB · TRIAL ${e.index+1} / ${e.order.length}</div>
      <h2>RATE: ${Ey(n.label)}</h2>
      ${r?`<div class="sub">accuracy ${(r.acc*100).toFixed(1)}% · ${r.miss} missed · ${r.hitsTaken} hits taken</div>`:``}
      <div class="lab-rate">${dy.map((e,t)=>`<div class="lab-row" data-row="${t}">
          <div class="lab-q"><b>${e.label}</b><span>${Ey(e.ask)}</span></div>
          <div class="lab-opts">${[1,2,3,4,5].map(t=>`<button class="lab-opt" data-k="${e.key}" data-v="${t}" aria-pressed="false">${t}</button>`).join(``)}</div></div>`).join(``)}</div>
      <div class="help">Keys: <kbd>1</kbd>-<kbd>5</kbd> rate the highlighted row (1 = bad, 5 = great), <kbd>↑</kbd> <kbd>↓</kbd> move. <kbd>Enter</kbd> saves.</div>
      <input id="l-note" class="lab-note" maxlength="160" placeholder="optional one-line note (what felt good or wrong?)" value="${Ey(this.draft.note)}">
      <div style="margin-top:12px">
        <button class="big" id="l-save" disabled>SAVE &amp; NEXT</button>
        <button class="big" id="l-again">PLAY AGAIN</button>
        <button class="big" id="l-skip">SKIP</button>
        <button class="big" id="l-quit">PAUSE LAB</button>
      </div>`),o=a.querySelector(`#l-note`),s=a.querySelector(`#l-save`),c=()=>{a.querySelectorAll(`.lab-opt`).forEach(e=>{let t=this.draft.ratings[e.dataset.k]===Number(e.dataset.v);e.setAttribute(`aria-pressed`,String(t))}),a.querySelectorAll(`.lab-row`).forEach(e=>e.classList.toggle(`focus`,Number(e.dataset.row)===i)),s.disabled=dy.some(e=>this.draft.ratings[e.key]===void 0)},l=(e,t)=>{this.draft.ratings[e]=t;let n=dy.findIndex(t=>t.key===e);i=Math.min(dy.length-1,n+1),c()};a.querySelectorAll(`.lab-opt`).forEach(e=>{e.onclick=()=>l(e.dataset.k,Number(e.dataset.v))}),o.oninput=()=>this.draft.note=o.value;let u=e=>{if(!a.isConnected)return window.removeEventListener(`keydown`,u);document.activeElement===o?e.key===`Enter`&&(o.blur(),s.disabled||s.click()):/^Digit[1-5]$/.test(e.code)||/^Numpad[1-5]$/.test(e.code)?(e.preventDefault(),l(dy[i].key,Number(e.code.slice(-1)))):e.code===`ArrowDown`?(i=Math.min(dy.length-1,i+1),c()):e.code===`ArrowUp`?(i=Math.max(0,i-1),c()):e.code===`Enter`&&!s.disabled&&s.click()};window.addEventListener(`keydown`,u);let d=()=>window.removeEventListener(`keydown`,u);s.onclick=()=>{d(),this.state=gy(e,{exp:t,ratings:this.draft.ratings,note:this.draft.note.trim(),plays:this.plays,stats:this.lastStats,at:new Date().toISOString()}),Cy(this.state),this.next()},a.querySelector(`#l-again`).onclick=()=>{d(),this.play(n)},a.querySelector(`#l-skip`).onclick=()=>{d(),this.state=_y(e),Cy(this.state),this.next()},a.querySelector(`#l-quit`).onclick=()=>{d(),this.home()},c()}results(){this.active=!1,this.host.offScreen();let e=this.state;if(!e)return this.home();let t=by(e),n=e.order.map(t=>({k:t,t:e.trials.find(e=>e.exp===t),e:P_(t)})).filter(e=>e.t),r=this.host.show(`
      <h2>LAB RESULTS</h2>
      <div class="sub">${e.trials.length} of ${e.order.length} trials rated${hy(e)?` · complete`:``}</div>
      <table class="lab-table">
        <tr><th>experiment</th>${dy.map(e=>`<th>${e.label}</th>`).join(``)}<th>avg</th><th>note</th></tr>
        ${n.map(({k:e,t,e:n})=>`<tr><td>${Ey(n?.label??e)}</td>${dy.map(e=>`<td>${t.ratings[e.key]}</td>`).join(``)}<td><b>${yy(t.ratings).toFixed(1)}</b></td><td class="lab-n">${Ey(t.note)}</td></tr>`).join(``)}
      </table>
      <div style="margin-top:12px">
        <button class="big" id="l-copy">COPY RESULTS</button>
        <button class="big" id="l-dl">DOWNLOAD .json</button>
        ${hy(e)?``:`<button class="big" id="l-resume">RESUME</button>`}
        <button class="big" id="l-home">LAB HOME</button>
      </div>
      <div class="help">Paste the copied JSON into chat. If copying is blocked, select the text below.</div>
      <textarea id="l-json" class="lab-json" readonly rows="8">${Ey(t)}</textarea>`),i=r.querySelector(`#l-json`),a=r.querySelector(`#l-copy`);a.onclick=async()=>{try{await navigator.clipboard.writeText(t)}catch{i.select(),document.execCommand(`copy`)}a.textContent=`COPIED ✓`},r.querySelector(`#l-dl`).onclick=()=>{let n=document.createElement(`a`);n.href=URL.createObjectURL(new Blob([t],{type:`application/json`})),n.download=`voxel-lab-${e.startedAt.slice(0,10)}.json`,n.click(),URL.revokeObjectURL(n.href)},r.querySelector(`#l-resume`)?.addEventListener(`click`,()=>this.next()),r.querySelector(`#l-home`).onclick=()=>this.home()}},ky=`voxel-rhythm.patch.v2`;function Ay(){try{let e=localStorage.getItem(ky);if(e)return te({...C,...JSON.parse(e)})}catch{}return{...C}}function jy(e){try{localStorage.setItem(ky,JSON.stringify(e))}catch{}}var My={sine:e=>Math.sin(e*Math.PI*2),triangle:e=>1-4*Math.abs((e+.25)%1-.5),saw:e=>e%1*2-1,square:e=>e%1<.5?1:-1},Ny=class{onChange;el;wave;inputs=new Map;patch;constructor(e,t){this.onChange=t,this.patch=Ay(),this.el=document.createElement(`div`),this.el.className=`synth-panel`,this.el.innerHTML=`
      <div class="synth-head"><span>WAVETABLE // SWORD + LEAD SYNTH</span><span class="hint">[Tab] expand/collapse</span></div>
      <canvas class="synth-wave" width="260" height="70"></canvas>
      <div class="synth-presets"></div>
      <div class="synth-params"></div>`,e.appendChild(this.el),this.wave=this.el.querySelector(`.synth-wave`);let n=this.el.querySelector(`.synth-presets`);for(let[e,t]of Object.entries(N)){let r=document.createElement(`button`);r.textContent=e,r.onclick=()=>this.set({...this.patch,...t}),n.appendChild(r)}let r=this.el.querySelector(`.synth-params`);for(let e of y){let t=document.createElement(`label`);t.className=`synth-row`+(e.live?``:` locked`),t.title=e.effect,t.innerHTML=`<span class="lbl">${e.label}</span>`;let n=document.createElement(`input`);n.type=`range`,n.min=String(e.min),n.max=String(e.max),n.step=String(e.step),n.disabled=!e.unlocked,n.oninput=()=>this.set({...this.patch,[e.key]:Number(n.value)}),n.addEventListener(`keydown`,e=>e.preventDefault());let i=document.createElement(`span`);i.className=`fx`,i.textContent=e.unlocked?e.effect:`LOCKED ${e.effect}`,t.append(n,i),r.appendChild(t),this.inputs.set(e.key,n)}this.sync()}set(e){this.patch=te(e),jy(this.patch),this.sync(),this.onChange(this.patch)}toggle(e){this.el.classList.toggle(`compact`,e===void 0?void 0:!e)}sync(){for(let e of y){let t=this.inputs.get(e.key);t.value=String(this.patch[e.key])}this.drawWave()}drawWave(){let e=this.wave.getContext(`2d`),{width:t,height:r}=this.wave;e.clearRect(0,0,t,r),e.fillStyle=`rgba(0,20,6,0.8)`,e.fillRect(0,0,t,r);let i=n(this.patch.wtPosition),a=Math.round(this.patch.unison),o=1-this.patch.cutoff;for(let n=0;n<a;n++){let s=a>1?(n/(a-1)-.5)*this.patch.detune*.12:0;e.strokeStyle=n===Math.floor(a/2)?`#e6ffe9`:`rgba(57,255,106,0.55)`,e.lineWidth=n===Math.floor(a/2)?2:1,e.beginPath();let c=0;for(let n=0;n<=t;n++){let a=n/t*2*(1+s),l=0;F.forEach((e,t)=>l+=(i[t]??0)*My[e](a)),l=c+(l-c)*(1-o*.85),c=l;let u=r/2-r*.38*l;n===0?e.moveTo(n,u):e.lineTo(n,u)}e.stroke()}e.fillStyle=`rgba(57,255,106,0.7)`,e.font=`10px monospace`;let s=F.map((e,t)=>`${e}${(i[t]??0)>.01?` ${Math.round((i[t]??0)*100)}%`:``}`).filter((e,t)=>(i[t]??0)>.01).join(` / `);e.fillText(s,4,r-4)}},Py=e=>document.getElementById(e),Fy=Py(`overlay`),Iy=new URLSearchParams(location.search),Ly=Ft(),Ry=Ly.musicMapping,zy=ge(Iy.get(`mapping`),Ry,Ot,kt);Ly={...Ly,musicMapping:zy.key};var By=zy.unknown;function Vy(){It({...Ly,musicMapping:Ry})}function Hy(e){Ly={...Ly,musicMapping:e},Ry=e,By=null,Vy(),history.replaceState(null,``,_e(location.href,e))}var Uy=new g,Wy=new oe(Uy.ctx),Gy=new ly(Py(`rain`)),Ky=null,qy=null,Jy=null,Yy=Iy.get(`autoplay`)===`1`,Xy=(Iy.get(`failbars`)??``).split(`,`).filter(Boolean).map(Number),Zy=`menu`,Qy=new Ny(Py(`synth-mount`),e=>Ky?.setPatch(e)),$y=0,eb=performance.now();function tb(e){$y=requestAnimationFrame(tb),Gy.update(Math.min(.05,(e-eb)/1e3)),eb=e}$y=requestAnimationFrame(tb),window.addEventListener(`resize`,()=>Gy.resize());function nb(){return`<div class="lanes-help">${_.map((e,t)=>{let n=I[e];return`<div class="lane" style="color:${n.color}"><b>[${ab(Pt(Ly.keys4[t]??``))}] ${n.label}</b>when the enemy ${n.telegraph}</div>`}).join(``)}</div>`}function rb(e){return Fy.innerHTML=`<div class="screen">${e}</div>`,Fy.firstElementChild}function ib(){Fy.innerHTML=``}var ab=e=>e.replace(/[&<>"]/g,e=>`&#${e.charCodeAt(0)};`);function ob(){let e=db(Ly.musicMapping);return`<div class="mapping" role="radiogroup" aria-label="actions to music">
      <div class="mapping-head">ACTIONS → MUSIC</div>
      <div class="mapping-opts">${Object.entries(Ot).map(([e,t])=>`<button class="mapping-opt" role="radio" data-mapping="${ab(e)}" aria-checked="${e===Ly.musicMapping}" title="${ab(t.description)}">${ab(t.label)}</button>`).join(``)}</div>
      <div class="mapping-desc">${ab(Ot[Ly.musicMapping]?.description??``)}</div>
      ${By?`<div class="warn">This version has no "${ab(By)}" mapping, so it plays ${ab(e)}.</div>`:``}
    </div>`}function sb(){return`<div class="experiments">
      <div class="mapping-head">GAMEPLAY EXPERIMENTS <button class="big" id="b-lab">PLAYTEST LAB</button></div>
      <div class="exp-opts">${N_.map(e=>`<button class="exp-opt" data-exp="${ab(e.key)}" title="${ab(e.tagline)}"><b>${ab(e.label)}</b><span>${ab(e.tagline)}</span></button>`).join(``)}</div>
    </div>`}async function cb(e,t,n){Zy=`other`,await Uy.resumeContext();let r=Vt(e);r.catch(()=>void 0);let i=e.options?.keyLegend??Ly.keys4.map(Pt).join(` `),a=lb,o=rb(`
    <div class="sub">${ab(t)}</div>
    <h2>${ab(e.label)}</h2>
    <div class="sub">${ab(e.tagline)}</div>
    <div class="howto"><div class="howto-keys">${ab(i)}</div>
      <ul>${e.howTo.map(e=>`<li>${ab(e)}</li>`).join(``)}</ul></div>
    <div class="howto-count">starting in <b id="h-left">${a}</b> · <kbd>Space</kbd> start now · <kbd>Esc</kbd> back</div>`),s=!1,c=async t=>{if(!s){if(s=!0,clearInterval(l),window.removeEventListener(`keydown`,u,!0),!t)return n();if(o.isConnected){rb(`<h2>LOADING</h2><div class="sub">rendering audio…</div>`);try{let t=await r;qy=t,gb(t,e)}catch(e){e instanceof M?Tb(e.message,e.details):Tb(e instanceof Error?e.message:String(e))}}}},l=setInterval(()=>{a--;let e=o.querySelector(`#h-left`);e&&(e.textContent=String(a)),a<=0&&c(!0)},1e3),u=e=>{e.code===`Space`||e.code===`Enter`?(e.preventDefault(),e.stopPropagation(),c(!0)):e.code===`Escape`&&(e.stopPropagation(),c(!1))};window.addEventListener(`keydown`,u,!0)}var lb=10,ub=new Oy({show:rb,offScreen:()=>{Ky?.stop(),Ky=null,Zy=`other`},runTrial:(e,t,n)=>void cb(e,t,n),menu:()=>void pb(),calibrate:()=>void wb(),build:`99fa29f`});function db(e){return Ot[e]?.label??(e===`none`?`EXPERIMENT AUDIO`:e)}function fb(e){e.querySelectorAll(`button[data-mapping]`).forEach(t=>{t.onclick=()=>{Hy(t.dataset.mapping),e.querySelector(`.mapping`).outerHTML=ob(),fb(e)}})}async function pb(){Zy=`menu`;let e=[];try{e=await A()}catch{}let t=rb(`
    <h1>VOXEL//RHYTHM</h1>
    <div class="sub">one enemy at a time. four keys. every key is a sword move.</div>
    ${sb()}
    ${ob()}
    <div class="maps">
      ${e.map(e=>`<div class="map"><div><div class="title">${ab(e.title)}</div><div class="sub" style="margin:0">${ab(e.artist??``)}</div></div>
          <div>${e.charts.map(t=>`<button class="big" data-map="${ab(e.id)}" data-file="${ab(t.file)}">${ab(t.difficulty.toUpperCase())}</button>`).join(``)}</div></div>`).join(``)}
      <div class="map"><div><div class="title">CUSTOM MAP</div>
        <div class="sub" style="margin:4px 0 0">chart <input type="file" id="f-chart" accept=".json,application/json"></div>
        <div class="sub" style="margin:4px 0 0">audio <input type="file" id="f-audio" accept="audio/*"></div></div>
        <div><button class="big" id="b-custom">PLAY</button></div></div>
    </div>
    <label class="chk"><input type="checkbox" id="c-auto" ${Yy?`checked`:``}> autoplay (watch the bot)</label>
    <label class="chk"><input type="checkbox" id="c-nofail" ${Ly.noFail?`checked`:``}> no-fail</label>
    <div style="margin-top:14px">
      <button class="big" id="b-settings">SETTINGS</button>
      <button class="big" id="b-cal">CALIBRATE OFFSET</button>
      <button class="big" id="b-editor">MAP EDITOR</button>
    </div>
    ${nb()}
    <div class="help">
      ${Ly.keys4.map(e=>`<kbd>${ab(Pt(e))}</kbd>`).join(` `)} block / slash / stab / flourish (change keys in SETTINGS) &nbsp; hold long cues<br>
      <kbd>Esc</kbd> pause &nbsp; <kbd>Tab</kbd> show/hide the sword synth &nbsp; <kbd>R</kbd> retry on results<br>
      One enemy at a time. Read its telegraph, hit the matching action as its cue reaches the line.
      Gold-railed measures are BOSS COMBOS: miss once and you take damage, the music glitches, and the measure repeats.
      Start with EASY. Tweak the WAVETABLE synth to change your sword: WT POS reshapes slashes,
      UNISON adds echo blades that build ECHO PARRY (it saves you from a missed block).
    </div>`);t.querySelectorAll(`button[data-map]`).forEach(e=>{e.onclick=()=>mb(e.dataset.map,e.dataset.file)}),t.querySelectorAll(`button[data-exp]`).forEach(e=>{e.onclick=()=>{let t=P_(e.dataset.exp);t&&cb(t,`EXPERIMENT`,()=>void pb())}}),Py(`b-lab`).onclick=()=>ub.home(),fb(t),Py(`c-auto`).onchange=e=>Yy=e.target.checked,Py(`c-nofail`).onchange=e=>{Ly={...Ly,noFail:e.target.checked},Vy()},Py(`b-settings`).onclick=Cb,Py(`b-cal`).onclick=wb,Py(`b-editor`).onclick=()=>window.open(`/voxel-rhythm-game/main/editor.html`,`_blank`),Py(`b-custom`).onclick=async()=>{let e=Py(`f-chart`).files?.[0],t=Py(`f-audio`).files?.[0];if(!e)return Tb(`Pick a chart .json file first.`);await hb(async()=>T(Uy.ctx,await e.text(),t?await t.arrayBuffer():void 0))}}async function mb(e,t){await hb(()=>j(Uy.ctx,e,t))}async function hb(e,t=null){Zy=`other`,await Uy.resumeContext(),rb(`<h2>LOADING</h2><div class="sub">jacking in… rendering audio</div>`);try{let n=await e();qy=n,n.warnings.length&&console.warn(`chart warnings:
`+n.warnings.join(`
`)),gb(n,t)}catch(e){e instanceof M?Tb(e.message,e.details):Tb(e instanceof Error?e.message:String(e))}}function gb(e,t=null){Jy=t,Ky?.stop(),ib(),Qy.toggle(!1),cancelAnimationFrame($y),Zy=`play`,Ky=new sy({arenaCanvas:Py(`arena`),hudCanvas:Py(`hud`),labelLayer:Py(`labels`)},e,Uy.ctx,Wy,Gy,Ly,Qy.patch,{autoplay:Yy,autoplayFailBars:Xy,experiment:t},{onFrame:_b,onEnd:xb}),Ky.start()}function _b(e){let t=e.duel.hp/fe.maxHp,n=Py(`hp-fill`);n.style.width=`${t*100}%`,n.classList.toggle(`low`,t<.3);let r=Math.floor(e.duel.parryCharge),i=e.duel.parryCharge-r;Py(`parry`).textContent=`◆`.repeat(r)+(e.mods.echoCount>0?`◇${Math.round(i*100)}%`:` (needs UNISON > 1)`),Py(`kills`).textContent=`${e.duel.defeated} / ${e.chart.encounters.length}`,Py(`score`).textContent=String(e.score.score).padStart(7,`0`),Py(`acc`).textContent=`${(e.score.accuracy*100).toFixed(2)}%`,Py(`mult`).textContent=`x${e.score.multiplier}`}function vb(){if(!Ky||Zy!==`play`)return;Ky.pause(),Qy.toggle(!0),Zy=`pause`;let e=rb(`<h2>PAUSED</h2>
    <button class="big" id="p-resume">RESUME</button>
    <button class="big" id="p-restart">RESTART</button>
    <button class="big" id="p-quit">QUIT</button>
    <div class="help">Audio offset ${Ly.audioOffsetMs} ms · tweak the synth now, it applies on resume.</div>`);e.querySelector(`#p-resume`).onclick=yb,e.querySelector(`#p-restart`).onclick=()=>qy&&gb(qy,Jy),e.querySelector(`#p-quit`).onclick=bb}function yb(){Ky&&Zy===`pause`&&(ib(),Qy.toggle(!1),Zy=`play`,Ky.resume())}function bb(){Qy.toggle(!0),Ky?.stop(),Ky=null,$y=requestAnimationFrame(tb),ub.active?ub.trialQuit():pb()}function xb(e,t){if(ub.active){Qy.toggle(!0),$y=requestAnimationFrame(tb),ub.trialEnded(e);return}Zy=`results`;let n=e.score,r=n.meanOffsetMs,i=Math.round(Ly.audioOffsetMs+r),a=rb(`
    <div class="grade">${t?`F`:n.grade}</div>
    <h2>${t?`SYSTEM FAILURE`:`TRACK CLEAR`}</h2>
    <div class="sub">${Jy?`${ab(Jy.label)} · `:``}${ab(e.chart.file.meta.title)} · ${ab(e.chart.file.meta.difficulty??``)} · ${ab(db(Jy?.options?.musicMapping??Ly.musicMapping))}${Yy?` · AUTOPLAY`:``}</div>
    <div class="stats">
      <div>SCORE</div><div>${n.score}</div>
      <div>ACCURACY</div><div>${(n.accuracy*100).toFixed(2)}%</div>
      <div>MAX COMBO</div><div>${n.maxCombo}</div>
      <div>PERFECT / GREAT / GOOD / MISS</div><div>${n.counts.perfect} / ${n.counts.great} / ${n.counts.good} / ${n.counts.miss}</div>
      <div>ENEMIES DEFEATED</div><div>${e.duel.defeated} / ${e.chart.encounters.length}${e.duel.escaped?` (${e.duel.escaped} escaped)`:``}</div>
      <div>HITS TAKEN</div><div>${e.duel.hitsTaken}</div>
      <div>BOSS COMBOS CLEARED / FAILED</div><div>${e.combosCleared} / ${e.combosFailed}</div>
      <div>MEAN HIT OFFSET</div><div>${r>=0?`+`:``}${r.toFixed(1)} ms (${r>=0?`late`:`early`})</div>
    </div>
    ${!Yy&&Math.abs(r)>8?`<div class="help">Your hits average ${r.toFixed(0)} ms ${r>0?`late`:`early`}. <button class="btn" id="r-apply">set audio offset to ${i} ms</button></div>`:``}
    <div style="margin-top:16px"><button class="big" id="r-retry">RETRY [R]</button><button class="big" id="r-menu">MENU [Esc]</button></div>`);a.querySelector(`#r-retry`).onclick=()=>qy&&gb(qy,Jy),a.querySelector(`#r-menu`).onclick=bb;let o=a.querySelector(`#r-apply`);o&&(o.onclick=()=>{Ly={...Ly,audioOffsetMs:i},Vy(),o.textContent=`offset set to ${i} ms`})}function Sb(){return _.map((e,t)=>`<button class="btn" data-lane="${t}" style="color:${I[e].color};border-color:${I[e].color}">${I[e].label} ${ab(Pt(Ly.keys4[t]??``))}</button>`).join(` `)}function Cb(){Zy=`other`;let e=rb(`<h2>SETTINGS</h2>
    <div class="grid">
      ${[[`audioOffsetMs`,`audio offset (ms)`,-250,250,1],[`visualOffsetMs`,`visual offset (ms)`,-150,150,1],[`scrollSpeed`,`cue speed`,.5,2.5,.05],[`musicVolume`,`music volume`,0,1,.01],[`hitsoundVolume`,`hitsound volume`,0,1,.01]].map(([e,t,n,r,i])=>`<span>${t}</span><input type="range" data-k="${e}" min="${n}" max="${r}" step="${i}" value="${Ly[e]}"><span data-v="${e}">${Ly[e]}</span>`).join(``)}
      <span>key preset</span><span><select id="s-preset">${jt.map((e,t)=>`<option value="${t}" ${e.keys.join()===Ly.keys4.join()?`selected`:``}>${e.name}</option>`).join(``)}<option value="-1" ${jt.some(e=>e.keys.join()===Ly.keys4.join())?``:`selected`}>custom</option></select></span><span></span>
      <span>action keys</span><span id="s-keys">${Sb()}</span><span></span>
      <span>actions → music</span><span><select id="s-music">${Object.entries(Ot).map(([e,t])=>`<option value="${e}" ${e===Ly.musicMapping?`selected`:``}>${t.label}</option>`).join(``)}</select></span><span></span>
    </div>
    <div class="help">Audio offset: positive if you tend to hit late (or your audio output is delayed). Use CALIBRATE to measure it.<br>
    Visual offset only moves the cue drawing. Cue speed: higher = cues arrive faster and sit further apart.<br>
    Pick a preset, or click an action's key and press the new key.<br>
    Actions → music picks how your moves interact with the song (applies on the next play).</div>
    <button class="big" id="s-back">BACK</button>`);e.querySelectorAll(`input[data-k]`).forEach(t=>{t.oninput=()=>{let n=t.dataset.k;Ly={...Ly,[n]:Number(t.value)},e.querySelector(`[data-v="${n}"]`).textContent=t.value,Vy()}});let t=()=>{e.querySelectorAll(`button[data-lane]`).forEach(n=>{n.onclick=()=>{n.textContent=`…`;let r=i=>{i.preventDefault();let a=[...Ly.keys4],o=Number(n.dataset.lane),s=a.indexOf(i.code);s>=0&&s!==o&&(a[s]=a[o]),a[o]=i.code,Ly={...Ly,keys4:a},Vy(),window.removeEventListener(`keydown`,r,!0),e.querySelector(`#s-keys`).innerHTML=Sb(),e.querySelector(`#s-preset`).value=String(jt.findIndex(e=>e.keys.join()===a.join())),t()};window.addEventListener(`keydown`,r,!0)}})};t(),e.querySelector(`#s-music`).onchange=e=>Hy(e.target.value),e.querySelector(`#s-preset`).onchange=n=>{let r=jt[Number(n.target.value)];r&&(Ly={...Ly,keys4:[...r.keys]},Vy(),e.querySelector(`#s-keys`).innerHTML=Sb(),t())},Py(`s-back`).onclick=()=>void pb()}async function wb(){Zy=`other`,await Uy.resumeContext();let e=await se(120,32),t=[],n=rb(`<h2>CALIBRATE</h2>
    <div class="sub">Tap <kbd>Space</kbd> on every click. 4 count-in clicks, then tap along.</div>
    <div id="cal-out" style="font-size:22px;color:var(--w)">listening…</div>
    <div id="cal-taps" class="help"></div>
    <button class="big" id="cal-apply" disabled>APPLY</button><button class="big" id="cal-back">BACK</button>`),r=Uy.userOffsetSec;Uy.userOffsetSec=0,Uy.output.gain.cancelScheduledValues(0),Uy.output.gain.value=Ly.musicVolume,Uy.setBuffer(e),Uy.play(-.5);let i=60/120,a=0,o=e=>{if(e.code!==`Space`||e.repeat)return;e.preventDefault();let r=Uy.songTimeAt(e.timeStamp),o=Math.round(r/i);if(o<4||o>=32)return;t.push(r-o*i);let s=[...t].sort((e,t)=>e-t);a=s[Math.floor(s.length/2)]*1e3,n.querySelector(`#cal-out`).textContent=`${a>=0?`+`:``}${a.toFixed(0)} ms (${t.length} taps)`,n.querySelector(`#cal-taps`).textContent=t.slice(-12).map(e=>`${(e*1e3).toFixed(0)}`).join(`  `),n.querySelector(`#cal-apply`).disabled=t.length<8};window.addEventListener(`keydown`,o);let s=()=>{window.removeEventListener(`keydown`,o),Uy.stop(),Uy.userOffsetSec=r,pb()};n.querySelector(`#cal-apply`).onclick=()=>{Ly={...Ly,audioOffsetMs:Math.round(a)},Vy(),s()},n.querySelector(`#cal-back`).onclick=s}function Tb(e,t=[]){Zy=`other`;let n=rb(`<h2>ERROR</h2><div class="err">${ab(e)}</div>
    ${t.length?`<div class="err" style="margin-top:8px">${t.map(ab).join(`
`)}</div>`:``}
    <div style="margin-top:14px"><button class="big" id="e-back">BACK</button></div>`);n.querySelector(`#e-back`).onclick=()=>void pb()}window.addEventListener(`keydown`,e=>{e.code===`Tab`?(e.preventDefault(),Qy.toggle()):(e.code===`Escape`&&(Zy===`play`?vb():Zy===`pause`?yb():Zy===`results`&&bb()),e.code===`KeyR`&&Zy===`results`&&qy&&gb(qy,Jy))}),window.addEventListener(`blur`,()=>{Zy===`play`&&!Yy&&vb()});async function Eb(){if(Iy.get(`lab`)===`1`)return ub.home();let e=Iy.get(`exp`);if(e){let t=P_(e);return t?Iy.get(`autostart`)===`1`?hb(()=>Vt(t),t):cb(t,`EXPERIMENT`,()=>void pb()):Tb(`This version has no experiment "${e}".`)}let t=Iy.get(`map`);if(t===`editor`)await hb(async()=>{let e=await b(Uy.ctx);if(!e)throw new M(`No chart was handed off from the editor.`);return e});else if(t&&Iy.get(`autostart`)===`1`){let e=Iy.get(`diff`)??`easy`;await mb(t,e===`normal`?`chart.json`:`chart-${e}.json`)}else await pb()}Eb();