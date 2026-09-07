"use strict";
(() => {
  // All amounts are illustrative. No wallet, proof, registration or transaction is created here.
  const model = Object.freeze({chainId:5042002, gatewayDomain:26, network:"Arc Testnet", walletB:"0x7A3F…91C2", walletRef:"DEMO_WALLET_B", vaultRef:"PROPOSED_ELIGIBLE_USDC_VAULT", feeUnits:1000, feeCapUnits:10000, depositUnits:10000000, gatewayDepositUnits:1000000, expirySeconds:600, identityRegistry:"0x8004A818BFB912233c491871b3d84c89A494BD9e", gatewayWallet:"0x0077777d7EBA4688BDeF3E311b846F25870A19B9", usdc:"0x3600000000000000000000000000000000000000", agentId:null, verifierAddress:null, vaultAddress:null, transactionHash:null});
  const sources = Object.freeze({
    prizes:"https://ethglobal.com/events/ethonline2026/prizes/arc",
    starter:"https://github.com/circlefin/agent-stack-starter-kits",
    wallet:"https://developers.circle.com/agent-stack/agent-wallets",
    walletChains:"https://developers.circle.com/agent-stack/agent-wallets/supported-blockchains",
    walletExecute:"https://developers.circle.com/agent-stack/agent-wallets/wallet-operations/execute-contract",
    policies:"https://developers.circle.com/agent-stack/agent-wallets/wallet-operations/custom-policies",
    identity:"https://docs.arc.io/arc/tutorials/register-your-first-ai-agent",
    appkit:"https://docs.arc.io/app-kit/quickstarts/unified-balance-deposit-and-spend",
    nano:"https://developers.circle.com/gateway/nanopayments",
    buyer:"https://developers.circle.com/gateway/nanopayments/quickstarts/buyer",
    seller:"https://developers.circle.com/gateway/nanopayments/quickstarts/seller",
    batch:"https://developers.circle.com/gateway/nanopayments/concepts/batched-settlement",
    chains:"https://developers.circle.com/gateway/references/supported-blockchains",
    contracts:"https://docs.arc.io/arc/references/contract-addresses",
    evm:"https://docs.arc.io/arc/references/evm-differences",
    cli:"https://developers.circle.com/agent-stack/agent-nanopayments/quickstart"
  });
  const steps = [
    {id:"mandate",nav:"Mandate",duration:6000,kicker:"01 / THE AGENT'S MISSION",title:"This vault requires proof of Coinbase KYC.",location:"OFFCHAIN · AGENT STACK",caption:"Prove eligibility using Wallet A, then authorize public Wallet B to deposit 10 USDC. A stays out of the public payload.",decision:"Request eligibility",reason:"The vault requires a valid Coinbase KYC proof for Wallet B."},
    {id:"identity",nav:"Discover",duration:5000,kicker:"02 / PROVER IDENTITY",title:"Find the prover. Verify its Arc identity.",location:"ARC + OFFCHAIN METADATA",caption:"Discovery reads registry events and metadata; the registry is an identity anchor, not a search engine.",decision:"Select ZKProofport",reason:"Match the proof capability, Arc registration and trusted endpoint."},
    {id:"fund",nav:"Fund",duration:5000,kicker:"03 / CAPITAL PREPARATION",title:"Bring USDC to the agent on Arc.",location:"APP KIT → ARC TESTNET",caption:"Start from a funded Unified Balance. Spend to Wallet B, then deposit 1 USDC into Gateway on Arc.",decision:"Reserve the funds",reason:"Keep the 10 USDC action, proof budget and USDC gas reserve separate."},
    {id:"pay",nav:"Pay",duration:6000,kicker:"04 / PAY-PER-PROOF",title:"Authorize a nanopayment. Start proving.",location:"OFFCHAIN → LATER ARC BATCH",caption:"Gateway accepts and locks the payment before proof work starts. Onchain batch settlement happens later.",decision:"Accept the quote",reason:"0.001 USDC is below the 0.01 USDC proof-price ceiling."},
    {id:"prove",nav:"Prove",duration:7000,kicker:"05 / ZKPROOFPORT",title:"A private credential. A scoped proof.",location:"OFFCHAIN · PROVER",caption:"Wallet A signs the action challenge. The proof binds Wallet B, Arc, the vault, amount, nonce and expiry.",decision:"Check the proof",reason:"Proof validity and authorization must both pass before spending."},
    {id:"execute",nav:"Execute",duration:8000,kicker:"06 / CONDITIONAL EXECUTION",title:"Verify and deposit in one Arc transaction.",location:"ARC ONCHAIN · USDC GAS",caption:"Proposed gate: verify proof, consume authorization and transfer 10 USDC atomically. Exact allowance is prepared first.",decision:"Evaluate the gate",reason:"A mismatch stops the deposit; a failed call cannot consume its authorization."},
    {id:"receipt",nav:"Receipt",duration:5000,kicker:"07 / THE RESULT",title:"KYC verified. Deposit complete. Wallet A omitted.",location:"ARC OUTCOME · SIMULATED",caption:"The service receives eligibility and Wallet B’s action, not Wallet A’s address. Simulated outcome; privacy limits remain in Evidence.",decision:"Mission complete",reason:"Simulated deposit succeeded. The proof fee is still pending Gateway batch settlement."}
  ];
  const totalDuration = steps.reduce((n,s)=>n+s.duration,0);
  const scenarios = {valid:{title:"Valid authorization"},budget:{title:"Proof fee over budget",stop:3,code:"PRICE_CAP_EXCEEDED",reason:"The 0.02 USDC quote exceeds the authorized 0.01 USDC ceiling. No nanopayment is signed."},wallet:{title:"Wrong execution wallet",stop:5,code:"WALLET_MISMATCH",reason:"The proof authorizes Wallet B. A different caller cannot use it to deposit."},replay:{title:"Replayed authorization",stop:5,code:"AUTHORIZATION_USED",reason:"This nonce has already been consumed for the bound wallet and vault. A second deposit is rejected."},expired:{title:"Expired authorization",stop:5,code:"AUTHORIZATION_EXPIRED",reason:"The authorization has passed its expiry. The agent must request a fresh authorization."}};

  // Executable specification of the proposed gate; NOT a ZK verifier or deployed contract.
  function evaluateAuthorization(input, used = new Set()) {
    const required = ["caller","targetWallet","chainId","audience","expectedAudience","action","amountUnits","maxAmountUnits","nonce","expiresAt","now","proofValid","trustedRoot","challengeMatches"];
    if (!input || required.some(k=>input[k]===undefined)) return {ok:false,code:"INCOMPLETE_AUTHORIZATION"};
    if (![input.amountUnits,input.maxAmountUnits,input.now,input.expiresAt,input.chainId].every(Number.isSafeInteger) || input.amountUnits<=0 || input.maxAmountUnits<=0 || !input.nonce) return {ok:false,code:"INVALID_AUTHORIZATION"};
    const checks = [
      [input.proofValid===true,"INVALID_PROOF"], [input.trustedRoot===true,"UNTRUSTED_ISSUER_ROOT"],
      [input.caller===input.targetWallet,"WALLET_MISMATCH"], [input.chainId===model.chainId,"CHAIN_MISMATCH"],
      [input.audience===model.vaultRef,"AUDIENCE_MISMATCH"],
      [input.action==="deposit"&&input.amountUnits<=input.maxAmountUnits&&input.amountUnits<=model.depositUnits&&input.challengeMatches===true,"ACTION_MISMATCH"],
      [input.now<input.expiresAt,"AUTHORIZATION_EXPIRED"],
      [!used.has(`${input.targetWallet}:${input.audience}:${input.nonce}`),"AUTHORIZATION_USED"]
    ];
    const failed=checks.find(([ok])=>!ok);
    return failed?{ok:false,code:failed[1]}:{ok:true,code:"AUTHORIZED"};
  }
  function executeDeposit(input, state) {
    const verdict=evaluateAuthorization(input,state.used);
    if(!verdict.ok)return verdict;
    if(state.balanceUnits<input.amountUnits || state.transferSucceeds!==true)return {ok:false,code:"TRANSFER_FAILED"};
    state.used.add(`${input.targetWallet}:${input.audience}:${input.nonce}`);
    state.balanceUnits-=input.amountUnits;
    state.depositedUnits+=input.amountUnits;
    return {ok:true,code:"DEPOSITED"};
  }
  function sampleAuthorization(scenario="valid") {
    const input={caller:model.walletRef,targetWallet:model.walletRef,chainId:model.chainId,audience:model.vaultRef,expectedAudience:model.vaultRef,action:"deposit",amountUnits:model.depositUnits,maxAmountUnits:model.depositUnits,nonce:"DEMO_AUTH_NONCE",expiresAt:1600,now:1000,proofValid:true,trustedRoot:true,challengeMatches:true};
    if(scenario==="wallet")input.caller="DEMO_DIFFERENT_WALLET";
    if(scenario==="expired")input.now=1600;
    const used=new Set();if(scenario==="replay")used.add(`${input.targetWallet}:${input.audience}:${input.nonce}`);
    return {input,used};
  }
  function evaluatePrice(units){return Number.isSafeInteger(units)&&units>0&&units<=model.feeCapUnits;}
  class SimulationEngine {
    constructor(onFrame=()=>{}){this.onFrame=onFrame;this.scenario="valid";this.time=0;this.playing=false;this.started=false;this.terminal=false;}
    snapshot(){let offset=0,index=steps.length-1,p=1;for(let i=0;i<steps.length;i++){if(this.time<offset+steps[i].duration||(this.terminal&&i===scenarios[this.scenario].stop)){index=i;p=Math.min(1,(this.time-offset)/steps[i].duration);break;}offset+=steps[i].duration;}return {stepId:steps[index].id,stepIndex:index,progress:p,totalProgress:this.time/totalDuration,playing:this.playing,scenario:this.scenario,started:this.started,terminal:this.terminal};}
    emit(){const frame=this.snapshot();this.onFrame(frame);return frame;}
    play(){if(this.terminal||this.time>=totalDuration){this.time=0;this.terminal=false;}this.started=true;this.playing=true;return this.emit();}
    pause(){this.playing=false;return this.emit();}
    restart(){this.time=0;this.started=false;this.playing=false;this.terminal=false;return this.emit();}
    setScenario(id){if(!scenarios[id])throw new Error("Unknown scenario");this.scenario=id;return this.restart();}
    advance(ms){if(!Number.isFinite(ms))throw new Error("Invalid elapsed time");if(this.playing){const stop=scenarios[this.scenario].stop;const end=stop===undefined?totalDuration:steps.slice(0,stop+1).reduce((n,s)=>n+s.duration,0);this.time=Math.min(end,this.time+Math.max(0,ms));if(this.time>=end){this.playing=false;this.terminal=stop!==undefined;}}return this.emit();}
    seekStep(index){if(!Number.isInteger(index))throw new Error("Invalid step index");index=Math.max(0,Math.min(steps.length-1,index));this.time=steps.slice(0,index).reduce((n,s)=>n+s.duration,0);this.started=true;this.playing=false;this.terminal=false;return this.emit();}
    next(){return this.seekStep(this.snapshot().stepIndex+1);}previous(){return this.seekStep(this.snapshot().stepIndex-1);}
  }

  const paths={agent:'<rect x="5" y="8" width="22" height="19" rx="4"/><path d="M16 3v5M10 15h2m8 0h2M11 22h10"/>',wallet:'<path d="M27 10V6H8a4 4 0 0 0 0 8h20v13H8a4 4 0 0 1-4-4V10M22 18h6"/>',registry:'<path d="M6 6h20v21H6zM11 11h10M11 17h10M11 22h6"/>',lock:'<rect x="6" y="14" width="20" height="15" rx="2"/><path d="M10 14V9a6 6 0 0 1 12 0v5M16 20v4"/>',proof:'<path d="m16 3 12 5v9c0 7-12 12-12 12S4 24 4 17V8zM10 16l4 4 8-9"/>',vault:'<rect x="4" y="5" width="24" height="24" rx="2"/><circle cx="16" cy="17" r="6"/><path d="M16 11v12M10 17h12M8 8h2"/>',stack:'<path d="m16 4 13 7-13 7L3 11zM3 17l13 7 13-7M3 23l13 7 13-7"/>',stop:'<path d="m10 3 12 0 9 9v10l-9 9H10l-9-9V12zM11 11l10 10M21 11 11 21"/>'};
  const icon=(name,cls="")=>`<div class="symbol ${cls}"><svg viewBox="0 0 32 32" aria-hidden="true">${paths[name]}</svg></div>`;
  const connector=(text="")=>`<div class="connector"><span>${text}</span><i class="traveler"></i></div>`;
  const rule=(text,pass=null)=>`<div class="rule ${pass===true?"pass":pass===false?"fail":""}"><b>${pass===true?"✓":pass===false?"×":"·"}</b>${text}</div>`;
  const unit=(name,title,detail,label="",cls="")=>`<div class="unit"><span class="mini-label">${label}</span>${icon(name,cls)}<h3>${title}</h3><p>${detail}</p></div>`;
  function block(scenario){const s=scenarios[scenario];return `<div class="block-scene">${icon("stop")}<div><h3>${s.code.replaceAll("_"," ")}</h3><p>${s.reason}</p><span class="tag">${scenario==="budget"?"NO PAYMENT · NO PROOF REQUEST":"NO DEPOSIT · NO NEW AUTHORIZATION CONSUMED"}</span></div></div>`;}
  const mapNodes=[
    {id:"funding",phase:2,x:32,y:34,w:246,name:"Public funding",detail:"App Kit · Unified Balance",place:"SOURCE CHAIN → ARC",icon:"stack",kind:"mixed"},
    {id:"registry",phase:1,x:640,y:34,w:246,name:"ERC-8004 registry",detail:"Prover identity on Arc",place:"ARC ONCHAIN",icon:"registry",kind:"chain"},
    {id:"agent",phase:0,x:32,y:209,w:246,name:"Agent + Wallet B",detail:"Circle Agent Wallets · EOA",place:"AGENT STACK · WALLET ON ARC",icon:"agent",kind:"mixed"},
    {id:"payment",phase:3,x:336,y:209,w:246,name:"Gateway payment",detail:"x402 · USDC Nanopayments",place:"ARC DEPOSIT · OFFCHAIN APPROVAL",icon:"wallet",kind:"mixed"},
    {id:"prover",phase:4,x:640,y:209,w:246,name:"TEE Prover",detail:"ZKProofport · Noir / UltraHonk",place:"OFFCHAIN · TEE TARGET",icon:"lock",kind:"offchain"},
    {id:"gate",phase:5,x:944,y:209,w:246,name:"Verifier contract",detail:"ZK proof + authorization",place:"ARC ONCHAIN",icon:"proof",kind:"chain"},
    {id:"vault",phase:6,x:1248,y:209,w:246,name:"USDC vault",detail:"10 USDC · authorized deposit",place:"ARC ONCHAIN",icon:"vault",kind:"chain"},
    {id:"private",phase:4,x:640,y:404,w:246,name:"Private Wallet A",detail:"Coinbase credential + signature",place:"BASE CREDENTIAL · PRIVATE INPUT",icon:"lock",kind:"private"}
  ];
  const mapEdges=[
    {id:"fund",phase:2,d:"M155 130 V209",label:"fund B",x:174,y:168},
    {id:"discover",phase:1,d:"M278 229 H306 V82 H640",label:"discover + check identity",x:332,y:69},
    {id:"registered",phase:1,d:"M763 130 V209",label:"resolve prover",x:779,y:168},
    {id:"quote",phase:3,d:"M278 263 H336",label:"pay",x:290,y:251},
    {id:"accepted",phase:3,d:"M582 263 H640",label:"accept",x:586,y:251},
    {id:"witness",phase:4,d:"M763 410 V359",label:"private witness",x:778,y:389},
    {id:"proof",phase:5,d:"M886 263 H944",label:"proof",x:895,y:251},
    {id:"execute",phase:5,d:"M1190 263 H1248",label:"allow",x:1199,y:251}
  ];
  function mapMarkup(){return `<div class="protocol-map"><div class="arc-execution-zone"><strong>Arc</strong><span>ONCHAIN VERIFICATION + USDC EXECUTION</span></div><div class="tee-zone" aria-hidden="true"></div><svg class="map-wires" viewBox="0 0 1520 506" aria-hidden="true"><defs><marker id="map-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L5 3 L0 6" fill="none" stroke="context-stroke"/></marker></defs>${mapEdges.map(e=>`<g data-edge="${e.id}"><path d="${e.d}" marker-end="url(#map-arrow)"/><text x="${e.x}" y="${e.y}">${e.label}</text></g>`).join("")}</svg>${mapNodes.map(n=>`<button class="map-node ${n.kind}" data-map-node="${n.id}" data-phase="${n.phase}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px" aria-label="Inspect ${n.name}"><span class="node-place">${n.place}</span><span class="node-content">${icon(n.icon)}<span><strong>${n.name}</strong><small>${n.detail}</small></span></span>${["payment","prover","gate","vault"].includes(n.id)?`<span class="node-state" id="state-${n.id}"></span>`:""}</button>`).join("")}<div class="map-note payment-note"><span>1 USDC deposit · 0.001 USDC / proof</span><strong>Accepted now · Arc batch settles later</strong></div><div class="map-note bound-note"><span>WALLET B → ARC CONTRACTS</span><strong>Bound wallet · scope · nonce · expiry</strong></div><div class="map-note privacy-note"><span>TEE PROVING BOUNDARY</span><strong>Private witness in. ZK proof out.</strong><small>TEE implemented; current host is a standard server. TEE redeployment is planned.</small></div><div class="map-note final-note"><span id="map-outcome">PROPOSED ATOMIC ACTION</span><strong id="map-verdict">Verify → consume nonce → deposit</strong></div></div>`;}
  const evidence={
    integration:[
      ["Circle Agent Stack","TARGET INTEGRATION","Use a starter-kit harness and Circle CLI with an Arc EOA agent wallet. Read the real vault policy, discover the prover and accept only a quote within the user-approved mandate. Keep the starter kit’s approval gate or explicitly implement a constrained mandate executor.",[["Starter kit","starter"],["Agent Wallets","wallet"],["Arc support","walletChains"]]],
      ["ERC-8004 on Arc","OFFICIAL DEPLOYMENT","Register the prover on Arc Testnet, resolve its tokenURI and check owner + endpoint. Agent computation stays offchain. The Base agent ID does not carry over; the Arc ID is currently unknown. A registration proves identity ownership, not that a prover is trustworthy.",[["Arc registration guide","identity"]]],
      ["App Kit / Unified Balance","TARGET FUNDING PATH","Spend a prefunded Base Sepolia Unified Balance to public Wallet B on Arc. Use a compatible signer adapter for the public funding wallet; do not assume a developer-controlled adapter can operate a user-controlled Agent Wallet. Then fund B’s Arc Gateway balance. Keep funding fees and USDC gas reserves.",[["Deposit & spend quickstart","appkit"]]],
      ["Gateway Nanopayments","TARGET PAYMENT PATH","Use Circle CLI services pay on ARC-TESTNET, with a maximum price, and @circle-fin/x402-batching on the seller. Choose the eip155:5042002 GatewayWalletBatched option. EOA signatures are required; ERC-1271/SCA signatures are not supported here.",[["Buyer implementation","buyer"],["Seller middleware","seller"],["Agent CLI","cli"]]],
      ["Acceptance ≠ settlement","DOCUMENTED LIFECYCLE","Gateway verifies authorization and locks buyer funds; the prover can serve immediately. The payment remains pending until Gateway batches it onchain. Never show a fabricated settlement transaction or equate Arc finality with the Gateway batching delay.",[["Batch lifecycle","batch"]]],
      ["Arc execution","CUSTOM GATE REQUIRED","Call a proposed verify-and-deposit function from Wallet B with Circle wallet execute. Arc native USDC gas uses 18 decimals; the ERC-20 USDC interface uses 6. Both represent the same balance. The vault and verifier still need Arc deployment.",[["Contract execution","walletExecute"],["Arc EVM differences","evm"],["Addresses","contracts"]]]
    ],
    security:[
      ["Action binding","REQUIRED BEFORE LIVE","Define a domain-separated challenge over chainId, verifying contract, Wallet B, action/calldata hash, amount, nonce and expiry. Wallet A signs this challenge; the gate recomputes it from the actual call and compares it to the proof’s public signal. The current input builder does not implement this profile.",[]],
      ["Privacy hardening","CURRENT CODE GAP","Current signal/nullifier formulas allow testing known candidate Wallet A addresses. Omitting an address is not the same as making it unlinkable. Add a private high-entropy witness secret to nullifier derivation, update the circuit and test candidate matching before claiming source-wallet unlinkability.",[]],
      ["Issuer & credential state","TRUST REQUIREMENT","The gate must pin an approved signer root, not accept a root provided by the requester. A signed attestation transaction alone is not a current non-revocation or chain-inclusion proof. Specify the accepted credential freshness and source-verification model.",[]],
      ["TEE deployment","IMPLEMENTED / NOT ACTIVE","TEE support exists in ZKProofport, but the current cost-saving deployment uses an ordinary server. Treat witness confidentiality from the current prover host as unavailable. Circle Gateway’s own TEE is a separate system and does not protect ZKProofport’s witness.",[["Gateway TEE scope","batch"]]],
      ["Budget enforcement","TESTNET APP POLICY","Circle Agent Wallet custom spending policies are documented as mainnet-only. The Arc Testnet budget shown here is an application rule and CLI max-amount check, not a Circle-enforced wallet policy. The proposed vault independently enforces the authorized action.",[["Policy limitation","policies"]]],
      ["Negative-path checks","EXECUTABLE SIMULATION","The controls demonstrate rejection of an over-budget quote, wrong caller, expired authorization and replay. Tests also cover wrong chain/audience, bad proof, untrusted root and transfer rollback. These test the design specification, not Solidity or cryptographic verification.",[]]
    ],
    submission:[
      ["ETHOnline 2026 · Arc","PUBLISHED CRITERIA","The Arc track requests a working frontend/backend, architecture diagram, video and repository. Agentic entries should connect real signals to autonomous USDC actions using Agent Stack. A visualizer alone does not meet that functional-MVP requirement.",[["Official Arc prizes","prizes"]]],
      ["Existing project route","CONTINUITY CANDIDATE","ZKProofport is pre-existing work. Assess eligibility for the Continuity categories and declare the exact event-period changes. The launch category also requires deployment or mainnet readiness by September 30. Event/registration choice must be confirmed by the team.",[["Track requirements","prizes"]]],
      ["Evidence, not assertions","HUMAN + MACHINE REVIEW","Publish actual Arc registration, verifier and gate addresses; receipts for funding and execution; Gateway authorization/settlement status; proof verification and rejected transactions. Unknown values stay null. No official evidence that AI agents will judge this track was found.",[]],
      ["Machine-readable package","AVAILABLE LOCALLY","review.json describes sources, integration status, expected behavior and missing live evidence. llms.txt points to the research and executable specification. Human and automated reviewers can inspect the same facts without relying on the animation.",[]],
      ["Useful next integrations","OPTIONAL / NOT CLAIMED","A Circle Agent Marketplace listing can make the proof service reusable; it requires a real endpoint and listing process. ERC-8183 can escrow longer proof jobs, but it is a separate payment design and is unnecessary for this single nanopayment flow. Do not claim USYC eligibility from Coinbase KYC.",[["Agent Stack","wallet"],["Arc contract requirements","contracts"]]]
    ]
  };
  class ProtocolRenderer{
    constructor(doc){this.doc=doc;this.lastScene="";doc.getElementById("scene-body").innerHTML=mapMarkup();}
    text(id,value){const el=this.doc.getElementById(id);if(el.textContent!==value)el.textContent=value;}
    render(frame){const index=steps.findIndex(s=>s.id===frame.stepId);if(index<0)throw new Error("Unknown phase");const step=steps[index],p=frame.progress,scenario=frame.scenario||"valid",stop=scenarios[scenario].stop;const blocked=stop!==undefined&&(index>stop||(index===stop&&p>(scenario==="budget"?.42:.85)));
      this.text("scene-kicker",step.kicker);this.text("scene-title",blocked?"The safe action is to stop.":step.title);this.text("scene-location",step.location);this.text("scene-caption",blocked?scenarios[scenario].reason:step.caption);
      const activeNodes={mandate:["agent"],identity:["agent","registry","prover"],fund:["funding","agent"],pay:["agent","payment","prover"],prove:["private","prover"],execute:["prover","gate","vault"],receipt:["agent","gate","vault"]}[step.id];
      this.doc.querySelectorAll("[data-map-node]").forEach(el=>{el.classList.toggle("active",activeNodes.includes(el.dataset.mapNode));el.classList.toggle("blocked",blocked&&el.dataset.mapNode===(scenario==="budget"?"payment":"gate"));});
      this.doc.querySelectorAll("[data-edge]").forEach(el=>{const edge=mapEdges.find(e=>e.id===el.dataset.edge);el.classList.toggle("active",edge.phase===index&&!blocked);el.classList.toggle("blocked",blocked&&(edge.id==="execute"||scenario==="budget"&&edge.id==="accepted"));});
      this.text("story-label",blocked?"SIMULATED RESULT · AUTHORIZATION REJECTED":index===6?"SIMULATED RESULT · ELIGIBILITY CONFIRMED":"THE SCENARIO · COINBASE KYC REQUIRED");
      this.text("story-title",blocked?"The vault stays locked. No deposit is made.":index===6?"KYC verified. Deposit complete. Source address omitted.":"Use a KYC-gated vault without publishing Wallet A.");
      this.text("story-detail",index===6&&!blocked?"Wallet A’s address is excluded from public results. Wallet B and its deposit remain public.":"Wallet A holds the credential. Wallet B is the public Arc wallet that deposits.");
      this.text("map-outcome",blocked?"ACTION BLOCKED":index===6?"SIMULATED OUTCOME":"PROPOSED ATOMIC ACTION");
      this.text("map-verdict",blocked?scenarios[scenario].code:index===6?"KYC verified · 10 USDC deposited":"Verify → consume nonce → deposit");
      this.text("decision-value",blocked?"Stop execution":step.decision);this.text("decision-reason",blocked?scenarios[scenario].reason:step.reason);this.text("run-state",blocked?"BLOCKED":index===6?"COMPLETE":frame.started?"IN PROGRESS":"READY");
      const paid=scenario!=="budget"&&(index>3||(index===3&&p>.7)),proof=scenario!=="budget"&&(index>4||(index===4&&p>.85)),executed=!blocked&&(index>5||(index===5&&p>.85));
      this.text("state-payment",scenario==="budget"&&blocked?"Rejected":paid?"Accepted":index===3?(p<.4?"402 · Quote":"Authorizing…"):"Unpaid");
      this.text("state-prover",scenario==="budget"&&blocked?"Not started":proof?"Proof ready":index===4?`Proving ${Math.min(99,Math.floor(p/.85*100))}%`:"Ready to prove");
      this.text("state-gate",blocked?"Rejected":executed?"Verified on Arc":index===5?`Checking ${Math.min(8,Math.floor(p*10))}/8`:"Awaiting proof");
      this.text("state-vault",blocked?"Blocked":executed?"10 USDC deposited":"Deposit locked");
      this.text("decision-value",blocked?"Action blocked":step.id==="pay"?(paid?"0.001 USDC accepted":"0.001 USDC quote"):step.id==="prove"?(proof?"ZK proof ready":`Proving ${Math.min(99,Math.floor(p/.85*100))}%`):step.id==="execute"?(executed?"Verified on Arc":`Verifying ${Math.min(8,Math.floor(p*10))} / 8 checks`):step.id==="receipt"?"10 USDC deposited":step.id==="fund"?"USDC → Arc Wallet B":step.id==="identity"?"ERC-8004 on Arc":"10 USDC mandate");
      const status=[["Proof fee",scenario==="budget"&&blocked?"NOT PAID":paid?"ACCEPTED*":"PENDING",paid],["Eligibility",scenario==="budget"&&blocked?"NOT REQUESTED":proof?"PROOF READY*":"REQUIRED",proof],["Arc action",blocked?"BLOCKED":executed?"DEPOSITED*":"LOCKED",executed]];
      this.doc.getElementById("status-list").innerHTML=status.map(([a,b,pass])=>`<div><dt>${a}</dt><dd class="${blocked&&a==="Arc action"?"fail":pass?"pass":""}">${b}</dd></div>`).join("");
      this.doc.querySelectorAll("#timeline button").forEach((b,i)=>{b.classList.toggle("active",i===index);b.classList.toggle("done",i<index);b.setAttribute("aria-current",i===index?"step":"false");});
      this.doc.querySelectorAll("[data-component]").forEach(el=>el.classList.toggle("active",el.dataset.component.split(",").includes(step.id)));
      this.doc.getElementById("play").disabled=frame.playing;this.doc.getElementById("pause").disabled=!frame.playing;this.doc.getElementById("previous").disabled=index===0;this.doc.getElementById("next").disabled=index===6;
      this.text("clock",`${String(Math.floor(frame.totalProgress*42)).padStart(2,"0")} / 42s`);this.doc.querySelector("#progress>span").style.width=frame.totalProgress*100+"%";this.doc.getElementById("progress").setAttribute("aria-valuenow",Math.round(frame.totalProgress*100));
    }
  }
  const api={model,sources,steps,scenarios,mapNodes,mapEdges,totalDuration,evaluateAuthorization,executeDeposit,sampleAuthorization,evaluatePrice,SimulationEngine,ProtocolRenderer};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;if(typeof document==="undefined")return;
  const renderer=new ProtocolRenderer(document),engine=new SimulationEngine(frame=>renderer.render(frame));let animation=0,last=0;
  function tick(now){animation=0;const delta=last?Math.min(now-last,250):0;last=now;engine.advance(delta);if(engine.playing)animation=requestAnimationFrame(tick);}
  function pause(){if(animation)cancelAnimationFrame(animation);animation=0;last=0;engine.pause();}
  function play(){if(animation)cancelAnimationFrame(animation);last=0;engine.play();animation=requestAnimationFrame(tick);}
  function restart(){pause();engine.restart();}
  function seekStep(i){pause();engine.seekStep(i);}
  document.getElementById("wallet-address").textContent=model.walletB+" · DEMO";
  document.querySelectorAll("[data-phase]").forEach(b=>b.addEventListener("click",()=>seekStep(Number(b.dataset.phase))));
  document.querySelector(".receipt-footer small").textContent="*Simulated. See Evidence for privacy limits.";
  steps.forEach((step,i)=>{const button=document.createElement("button");button.innerHTML=`<b>${String(i+1).padStart(2,"0")}</b>${step.nav}`;button.setAttribute("aria-label",`Phase ${i+1}: ${step.nav}`);button.addEventListener("click",()=>seekStep(i));document.getElementById("timeline").append(button);});
  for(const [id,fn] of [["play",play],["pause",pause],["restart",restart],["previous",()=>seekStep(engine.snapshot().stepIndex-1)],["next",()=>seekStep(engine.snapshot().stepIndex+1)]])document.getElementById(id).addEventListener("click",fn);
  document.getElementById("scenario").addEventListener("change",e=>{pause();engine.setScenario(e.target.value);if(e.target.value!=="valid")seekStep(scenarios[e.target.value].stop);});
  function showEvidenceTab(name){document.querySelectorAll("[data-tab]").forEach(el=>el.setAttribute("aria-selected",String(el.dataset.tab===name)));document.getElementById("evidence-body").innerHTML=evidence[name].map(([title,status,body,links])=>`<section class="evidence-row"><div><h3>${title}</h3><span class="tag">${status}</span></div><div><p>${body}</p>${links.map(([text,id])=>`<a href="${sources[id]}" target="_blank" rel="noopener">${text} ↗</a>`).join("")}</div></section>`).join("");document.getElementById("evidence-body").scrollTop=0;}
  const dialog=document.getElementById("evidence");function openEvidence(){pause();showEvidenceTab("integration");dialog.showModal();}
  document.getElementById("evidence-open").addEventListener("click",openEvidence);document.getElementById("scene-evidence").addEventListener("click",openEvidence);document.getElementById("evidence-close").addEventListener("click",()=>dialog.close());document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>showEvidenceTab(b.dataset.tab)));
  document.addEventListener("keydown",e=>{if(dialog.open||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==="Space"){e.preventDefault();engine.playing?pause():play();}if(e.key.toLowerCase()==="r"){e.preventDefault();restart();}});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)pause();});
  function fit(){document.getElementById("stage").style.transform=`scale(${Math.min(innerWidth/1600,innerHeight/900)})`;}addEventListener("resize",fit);fit();engine.emit();
  window.ProtocolDemo={...api,engine,renderer,play,pause,restart,seekStep,renderEvent(event){
    if(!event||!steps.some(s=>s.id===event.stepId)||![event.progress,event.totalProgress].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||(event.scenario&&!scenarios[event.scenario]))throw new Error("Invalid normalized simulation frame");
    pause();renderer.render({...event,playing:false,started:true,scenario:event.scenario||"valid"});
  }};
})();
