const key=(at,type,key)=>({at,type,key});
const hold=(id,behavior,k,duration)=>({id,behavior,duration:behavior==='jumping'?1440:960,events:[key(160,'down',k),key(160+duration,'up',k)]});
const aim=(id,dx,dy=0)=>({id,behavior:'aiming',duration:960,events:[{at:160,type:'mouse',dx,dy}]});
export const recorded=[hold('move-forward','movement','w',320),hold('move-right','movement','d',480),aim('aim-horizontal',40),aim('aim-vertical',0,32),hold('jump-short','jumping','Space',32),hold('jump-long','jumping','Space',160)];
recorded.push({id:'move-diagonal',behavior:'movement',duration:960,events:[key(160,'down','w'),key(160,'down','d'),key(480,'up','w'),key(480,'up','d')]});
export const development=[hold('calibration-forward','movement','w',256),aim('calibration-aim',24),hold('calibration-jump','jumping','Space',64)];
// Evaluator-only sampling. Generated after analysis/generation; never included in their bundles.
export function finalCases(random) {
  const duration=[192,224,352,416][Math.floor(random()*4)];
  const amount=[-36,-28,20,52][Math.floor(random()*4)];
  return [hold('held-movement','movement','w',duration),
    {id:'held-aim','behavior':'aiming',duration:960,events:[{at:160,type:'mouse',dx:amount,dy:0},{at:160+duration,type:'mouse',dx:amount,dy:0}]},
    hold('held-jump','jumping','Space',[48,80,112,192][Math.floor(random()*4)]),
    {id:'held-diagonal',behavior:'movement',duration:960,events:[key(160,'down','w'),key(160,'down','a'),key(160+duration,'up','w'),key(160+duration,'up','a')]},
    {id:'held-move-aim',behavior:'movement',duration:960,events:[key(160,'down','w'),{at:256,type:'mouse',dx:amount,dy:0},key(160+duration,'up','w')]}];
}
