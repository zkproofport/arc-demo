# ZKProofport × Arc — Eligibility to execution

Open `index.html` directly, or visit https://zkproofport.github.io/arc-demo/. For a local preview, run `python3 -m http.server 8766` from this folder. Pure HTML/CSS/JavaScript: no build, dependencies, fonts, wallet connections or network calls. The 42-second flow is a **design simulation**.

## Interaction

- Play/Pause, Space, Restart/R, previous/next and seven phase controls.
- Select a valid authorization, over-budget quote, wrong caller, replay or expiry. Failed scenarios stop at their rejection point.
- Evidence & sources shows official capabilities, proposed integration and current gaps. Opening it pauses playback; Escape closes it.
- The complete connected topology stays visible in every phase. Click a component or phase to highlight its path; the strip below explains the selected step. Funding, Arc identity, Wallet A, payment, proof, gate and vault remain onscreen.
- Fixed 1600×900 composition scales to fit 1920×1080 and 1366×768 without page scrolling. Narrow displays show the complete scaled composition.

## Review

- [RESEARCH.md](RESEARCH.md): official findings, ETHOnline 2026 award fit, code gaps and implementation order.
- [review.json](review.json): structured sources, status and missing real evidence.
- [llms.txt](llms.txt): entry point for automated readers.

All Circle/Arc integrations shown are the researched target. Project-specific Arc deployment IDs and hashes remain null. Current code uses Ethereum/Base configurations; current prover operation is an ordinary server. Source-wallet unlinkability hardening and the action-bound gate are not yet implemented.

## Implementation

`app.js` exports the central model, sources, declarative steps, SimulationEngine, ProtocolRenderer, evaluateAuthorization and executeDeposit. The latter two describe proposed gate behavior; they do not verify real proofs or execute contracts.

The clock is separate from rendering. A future adapter can deliver a normalized simulation frame:

```js
ProtocolDemo.renderEvent({
  stepId: 'execute', progress: 0.5, totalProgress: 0.8, scenario: 'valid'
});
```

This pauses the clock. A live adapter must use receipt-derived states and per-check evidence, remove time-derived success and retain explicit live/simulation labels. Never include Wallet A or witness material in browser events. Payment acceptance, proof readiness, Arc execution and batch settlement are distinct events.

## Focused checks

```sh
node --check app.js
node test.cjs
```

These cover playback boundaries, rejection stops, proposed authorization conditions, replay, transfer rollback, local resources and evidence consistency. They do not run the project's full test suites or validate Circle/Arc services. Browser QA checks the persistent map, component navigation, rejection behavior and evidence controls.

State changes are shown in large bands inside each component and in an enlarged selected-phase readout. The TEE Prover is explicitly a target deployment (current operation: standard server). An Arc region groups the onchain verifier contract and USDC vault; it does not imply project deployment is complete.

## Audio

Pre-rendered English narration (macOS Samantha) lives in assets/audio. See NARRATION.md for the complete script. Voice and effect volumes are independent. Playback, pause, step changes and hidden-tab pauses synchronize with the simulation. Clips longer than a phase are slightly accelerated to fit the existing 42-second timeline. Negative scenarios use separate narration. Effects are generated locally with Web Audio; no external speech service or API is used. Browser playback begins after the Play gesture.
