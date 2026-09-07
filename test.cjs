const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const api = require('./app.js');
let assertions=0;
function equal(a,b){assert.deepEqual(a,b);assertions++;}
const {SimulationEngine,steps,totalDuration,sampleAuthorization,evaluateAuthorization,executeDeposit,evaluatePrice}=api;
equal(totalDuration,42000);
const engine=new SimulationEngine();
equal(engine.snapshot().stepId,'mandate');
engine.play();engine.advance(6000);equal(engine.snapshot().stepId,'identity');
engine.pause();const frozen=engine.time;engine.advance(1000);equal(engine.time,frozen);
engine.play();engine.advance(36000);equal(engine.snapshot().stepId,'receipt');equal(engine.snapshot().progress,1);equal(engine.playing,false);
engine.play();equal(engine.time,0);engine.restart();equal(engine.started,false);
steps.forEach((step,index)=>{engine.seekStep(index);equal(engine.snapshot().stepId,step.id);equal(engine.snapshot().progress,0);});
for(const [scenario,step] of [['budget','pay'],['wallet','execute'],['replay','execute'],['expired','execute']]){
  engine.setScenario(scenario);engine.play();engine.advance(totalDuration);equal(engine.snapshot().stepId,step);equal(engine.snapshot().terminal,true);equal(engine.playing,false);
}
const {input}=sampleAuthorization();
equal(evaluateAuthorization(input).ok,true);
for(const [change,expected] of [
  [{caller:'OTHER'},'WALLET_MISMATCH'],[{chainId:8453},'CHAIN_MISMATCH'],
  [{audience:'OTHER_VAULT'},'AUDIENCE_MISMATCH'],[{audience:'OTHER_VAULT',expectedAudience:'OTHER_VAULT'},'AUDIENCE_MISMATCH'],[{amountUnits:10000001,maxAmountUnits:20000000},'ACTION_MISMATCH'],[{amountUnits:10000001},'ACTION_MISMATCH'],
  [{action:'withdraw'},'ACTION_MISMATCH'],[{challengeMatches:false},'ACTION_MISMATCH'],
  [{now:1600},'AUTHORIZATION_EXPIRED'],[{trustedRoot:false},'UNTRUSTED_ISSUER_ROOT'],
  [{proofValid:false},'INVALID_PROOF'],[{amountUnits:NaN},'INVALID_AUTHORIZATION'],
  [{amountUnits:0},'INVALID_AUTHORIZATION'],[{nonce:''},'INVALID_AUTHORIZATION']
])equal(evaluateAuthorization({...input,...change}).code,expected);
equal(evaluateAuthorization({}).code,'INCOMPLETE_AUTHORIZATION');
equal(evaluatePrice(1000),true);equal(evaluatePrice(10000),true);equal(evaluatePrice(20000),false);equal(evaluatePrice(-1),false);
const state={used:new Set(),balanceUnits:11000000,depositedUnits:0,transferSucceeds:true};
equal(executeDeposit(input,state).code,'DEPOSITED');equal(state.balanceUnits,1000000);equal(state.depositedUnits,10000000);
equal(executeDeposit(input,state).code,'AUTHORIZATION_USED');equal(state.depositedUnits,10000000);
const rollback={used:new Set(),balanceUnits:11000000,depositedUnits:0,transferSucceeds:false};
equal(executeDeposit(input,rollback).code,'TRANSFER_FAILED');equal(rollback.used.size,0);equal(rollback.balanceUnits,11000000);
for(const file of ['styles.css','app.js','review.json','llms.txt','RESEARCH.md','assets/zkproofport-logo.png'])equal(fs.existsSync(path.join(__dirname,file)),true);
equal(fs.readFileSync(path.join(__dirname,'index.html'),'utf8').includes('DESIGN SIMULATION'),true);
equal(api.model.agentId,null);equal(api.model.transactionHash,null);equal(api.model.verifierAddress,null);
const review=JSON.parse(fs.readFileSync(path.join(__dirname,'review.json'),'utf8'));
equal(review.mode,'design-simulation');equal(review.network.chainId,api.model.chainId);
for(const [width,height] of [[1920,1080],[1366,768],[1047,868]]){const scale=Math.min(width/1600,height/900);equal(1600*scale<=width+0.01,true);equal(900*scale<=height+0.01,true);}
console.log(`PASS: ${assertions} checks — timing, playback, scenario stops, proposed authorization logic, rollback, assets, evidence consistency and viewport geometry.`);
console.log('Simulation/specification checks only. No cryptographic verification, Circle API or Arc transaction was executed.');
