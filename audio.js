'use strict';
(() => {
 const api=window.ProtocolDemo;
 const voice=document.getElementById('voice-enabled'),effects=document.getElementById('effects-enabled');
 const volume=document.getElementById('voice-volume'),fxVolume=document.getElementById('effects-volume');
 const status=document.getElementById('audio-status');
 let player=new Audio(),key='',frame=null,context=null,previous='',milestone='',generation=0;
 player.preload='auto';
 function tone(failed){if(!effects.checked)return;try{context ||= new (window.AudioContext||window.webkitAudioContext)();context.resume();const t=context.currentTime;for(const [i,hz] of (failed?[260,190]:[520,780]).entries()){const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(0,t+i*.11);gain.gain.linearRampToValueAtTime(Number(fxVolume.value)*.12,t+i*.11+.015);gain.gain.exponentialRampToValueAtTime(.001,t+i*.11+.18);osc.connect(gain);gain.connect(context.destination);osc.start(t+i*.11);osc.stop(t+i*.11+.2);}}catch{status.textContent='Effects unavailable';}}
 function sync(f){frame=f;const phase=api.steps[f.stepIndex??api.steps.findIndex(s=>s.id===f.stepId)];const failed=f.scenario!=='valid'&&api.scenarios[f.scenario]?.stop===api.steps.indexOf(phase);const next=failed?f.scenario:f.stepId;
  if(key!==next){player.pause();generation++;player=new Audio(`assets/audio/${next}.wav`);player.preload='auto';key=next;player.addEventListener('loadedmetadata',()=>{if(key===next&&frame)align(true);});player.addEventListener('error',()=>{status.textContent='Audio unavailable';});}
  if(f.playing&&previous!==next){tone(false);previous=next;}
  const done=f.progress>(failed?(f.scenario==='budget'?.42:.85):(f.stepId==='pay'?.7:.85));const event=next+':done';if(f.playing&&done&&milestone!==event&&['pay','prove','execute'].includes(f.stepId)){tone(failed);milestone=event;}if(!f.playing&&!f.terminal&&f.progress===0)milestone='';if(!f.started){previous='';milestone='';}
  align(false);
 }
 function align(force){if(!frame)return;const phase=api.steps.find(s=>s.id===frame.stepId);player.volume=Number(volume.value);const duration=player.duration;
  if(Number.isFinite(duration)&&duration>0){const rate=Math.max(1,duration/(phase.duration/1000-.12));player.playbackRate=rate;const target=Math.min(duration,frame.progress*phase.duration/1000*rate);if(force||Math.abs(player.currentTime-target)>.3)player.currentTime=target;}
  if(frame.playing&&voice.checked){if(player.paused&&(!Number.isFinite(duration)||player.currentTime<duration-.04)){const token=generation,playingElement=player;playingElement.play().then(()=>{if(token!==generation||!frame.playing||!voice.checked)playingElement.pause();else status.textContent='Narration on';}).catch(()=>{status.textContent='Click Play to enable audio';});}}
  else player.pause();
 }
 const render=api.engine.onFrame;api.engine.onFrame=f=>{render(f);sync(f);};
 voice.addEventListener('change',()=>{status.textContent=voice.checked?'Narration on':'Narration muted';align(true);});volume.addEventListener('input',()=>{player.volume=Number(volume.value);});
 const original=api.renderEvent;api.renderEvent=event=>{player.pause();original(event);};
 window.addEventListener('pagehide',()=>player.pause());
 api.audio={pause:()=>player.pause(),getState:()=>({clip:key,paused:player.paused,duration:player.duration,currentTime:player.currentTime})};
 sync(api.engine.snapshot());
})();
