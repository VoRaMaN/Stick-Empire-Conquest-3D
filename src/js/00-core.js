const $=s=>document.querySelector(s);
const V3=THREE.Vector3, UP=new V3(0,1,0);
const clamp=(x,a,b)=>x<a?a:x>b?b:x, lerp=(a,b,t)=>a+(b-a)*t, smooth=t=>t*t*(3-2*t), rand=(a,b)=>a+Math.random()*(b-a);
const EASE={io:smooth,o:t=>1-Math.pow(1-t,3),i:t=>t*t*t,l:t=>t};
const wrapA=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};

