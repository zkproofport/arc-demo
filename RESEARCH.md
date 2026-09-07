# ZKProofport on Arc: integration research

Reviewed 7 September 2026. **Proposed integration, not a live Arc MVP.** No account was created, funds moved, prover registered or contract deployed. Official capability is distinct from project implementation.

## Product and award fit

An agent receives a mandate to deposit 10 USDC into an Arc service that requires Coinbase KYC. It discovers ZKProofport, checks the quote, pays for a proof with USDC and executes only when proof and authorization pass. The public payload omits the credential source Wallet A. Source-wallet unlinkability still needs the hardening below.

The [ETHOnline 2026 Arc prize page](https://ethglobal.com/events/ethonline2026/prizes/arc) was reviewed. This is the researched event assumption; the user's registration has not been confirmed. Published priorities include real-signal agent decisions, autonomous USDC actions, Agent Stack, relevant Nanopayments/App Kits, meaningful Arc use and conditional settlement. A working frontend **and backend**, architecture diagram, concise demo/presentation and repository are required. A visualizer alone does not meet the functional-MVP requirement.

| Category | Published award | Fit |
| --- | ---: | --- |
| Best Agentic Economy Application with Circle Agent Stack | $1,667 | Closest product fit if category eligibility is met |
| Best DeFi or Agentic Application — Continuity | $1,666 | Existing ZKProofport makes this worth checking first |
| Launch on Arc Testnet & Push to Mainnet — Continuity | $1,500 | Working extension of an existing product; mainnet deployment/readiness by September 30 required |
| Launch on Arc Testnet & Push to Mainnet | $3,500 pool | Separate category; confirm eligibility and prize stacking |

Declare pre-event work and event-period changes. Previously shipped circuits, TEE support and Base registration must not be represented as newly built hackathon work. No official evidence that AI agents will judge this track was found. Machine-readable evidence is useful for reproducibility regardless; it should contain facts, not evaluator-targeted instructions.

## Proposed flow and location

| Phase | Operation | Where | Integration | Real evidence required |
| --- | --- | --- | --- | --- |
| Mandate | Read vault policy; bind B, action, quote cap and gas budget | Offchain agent | Circle Agent Stack + Agent Wallets | User mandate, actual policy/quote and decision record |
| Discover | Resolve capability; check owner, metadata and endpoint | Arc registry + offchain metadata | ERC-8004 | New Arc agent ID, registration receipt, tokenURI |
| Fund | Spend a prefunded public Unified Balance to B; fund B's Arc Gateway balance | Source chain + Gateway + Arc | App Kit Unified Balance; Circle CLI | Source/destination receipts and available balance |
| Pay | 402 → price check → EOA signature → Gateway acceptance | Agent/prover/Gateway API | Agent Nanopayments; x402-batching | Authorization identifier and acceptance; later batch receipt |
| Prove | A signs action-bound challenge; generate ZK proof | Offchain ZKProofport | Noir/Barretenberg | Real proof/public inputs, verification result, host mode |
| Execute | Exact allowance, then verify + consume nonce + deposit atomically | Arc | Circle wallet execute; custom gate/verifier | Deployed code, success receipt and negative-path reverts |
| Receipt | Public outcome; distinguish pending proof-payment settlement | Arc + Gateway status | Explorer/API | Verifiable receipts; no fabricated hashes |

### Four wallet roles

- **A:** Coinbase credential source. No raw address, signature, attestation or identity in public metadata, receipts, browser events or logs.
- **B:** an **EOA Circle Agent Wallet** on `ARC-TESTNET`, acting under the user's mandate. Agent Wallets are user-controlled; they are not developer-controlled wallets.
- **Public funding wallet:** App Kit treasury/source, explicitly not A. Its funding links can be public. Use its matching signer adapter.
- **Prover wallet:** registration owner and proof-revenue recipient, distinct from B. It must not self-submit reputation feedback.

[Nanopayments require EOA signatures](https://developers.circle.com/gateway/nanopayments/quickstarts/buyer), with no ERC-1271/SCA support. The ERC-8004 tutorial's SCA example is therefore not the account type to copy into the nanopayment buyer role. Use compatible EOAs or keep roles separate.

## How to use the kits meaningfully

1. **[Agent Stack starter kits](https://github.com/circlefin/agent-stack-starter-kits):** choose the framework matching the existing agent. The kits give the agent shell access to Circle CLI and skills, and include command approval gates; they are not typed SDK tool catalogs. Preserve approval behavior or implement an explicitly authorized, constrained mandate executor.
2. **[Circle Agent Wallets](https://developers.circle.com/agent-stack/agent-wallets):** select an EOA on Arc, inspect balances, authorize payment and execute custom contracts. [Arc is supported](https://developers.circle.com/agent-stack/agent-wallets/supported-blockchains). Drive live UI state from returned transaction states/receipts, not time.
3. **[App Kit Unified Balance](https://docs.arc.io/app-kit/quickstarts/unified-balance-deposit-and-spend):** `kit.unifiedBalance.spend` sends to `Arc_Testnet`, `recipientAddress: walletB`. The scenario starts from an already funded source balance: source-chain waiting is outside the 42-second explanation. Use a compatible public funding-wallet adapter, e.g. Viem. Do not assume the developer-controlled Circle adapter operates B's user-controlled Agent Wallet. Send to B first; do not bypass the eligibility gate by sending directly to the vault. Reserve source/destination fees.
4. **[Agent Nanopayments CLI](https://developers.circle.com/agent-stack/agent-nanopayments/quickstart):** adapt `gateway deposit`, `services inspect`, `services pay --max-amount` and `gateway balance` to `ARC-TESTNET`. Select the matching `eip155:5042002` payment option, not the first chain advertised.
5. **[x402-batching seller middleware](https://developers.circle.com/gateway/nanopayments/quickstarts/seller):** use `createGatewayMiddleware` / `gateway.require` on the proof endpoint. Start expensive computation only after acceptance. Handle idempotency and retries; do not create duplicate proof jobs or charge twice.
6. **[ERC-8004 on Arc](https://docs.arc.io/arc/tutorials/register-your-first-ai-agent):** publish a new Arc identity with capability and A2A/MCP endpoints. Discovery uses registry logs/indexing plus tokenURI metadata. The registry is not a general search engine, and an identity registration does not itself certify quality/trust.

Optional extensions: a real Circle Agent Marketplace listing improves discoverability; no listing is claimed here. Bridge Kit/CCTP is an alternative funding route, not a requirement to stack on Unified Balance. ERC-8183 suits escrowed asynchronous jobs but is a separate payment design. Coinbase KYC does not confer USYC entitlements; USYC requires its own onboarding.

### Payment acceptance ≠ settlement

[Gateway's lifecycle](https://developers.circle.com/gateway/nanopayments/concepts/batched-settlement) locks buyer funds on acceptance. The seller can serve before batching; available seller funds update after batch confirmation. Track:

`quoted → signed → accepted/funds locked → proof served → batch settled`

The visualizer ends with **batch pending**. Do not invent a transaction for each nanopayment or conflate Arc finality with Gateway batch delay. Gateway's Nitro enclave protects its payment batching, not ZKProofport's witness. Payment nonce, vault authorization nonce and ZK nullifier are distinct concepts.

## Verified network configuration

| Field | Value | Official source |
| --- | --- | --- |
| Chain / CAIP-2 | `5042002` / `eip155:5042002` | [Connect](https://docs.arc.io/arc/references/connect-to-arc) |
| Wallet chain | `ARC-TESTNET` | [Wallet chains](https://developers.circle.com/agent-stack/agent-wallets/supported-blockchains) |
| App Kit chain | `Arc_Testnet` | [App Kit](https://docs.arc.io/app-kit/quickstarts/unified-balance-deposit-and-spend) |
| Gateway domain / SDK | `26` / `arcTestnet` | [Gateway chains](https://developers.circle.com/gateway/references/supported-blockchains) |
| IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | [ERC-8004](https://docs.arc.io/arc/tutorials/register-your-first-ai-agent) |
| GatewayWallet | `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` | [Addresses](https://docs.arc.io/arc/references/contract-addresses) |
| USDC ERC-20 | `0x3600000000000000000000000000000000000000` | [Addresses](https://docs.arc.io/arc/references/contract-addresses) |
| Decimals | ERC-20: 6; native/gas: 18 | [EVM differences](https://docs.arc.io/arc/references/evm-differences) |

Native USDC and its ERC-20 interface share one balance. Do not double-count or create a WETH-like wrapper. Keep USDC gas reserved. Documentation addresses are not project deployment evidence. The custom Arc verifier/vault, prover agent ID and transaction hashes remain unknown/null.

## Current code and required changes

Paths are relative to the `zkproofport` workspace. No backend/circuit files were changed in this task.

| Component | Evidence in current code | Required Arc work |
| --- | --- | --- |
| Payment | `proofport-ai/src/payment/freeTier.ts`: Base / Base Sepolia | Arc network and Gateway batching acceptance/status |
| Identity | `proofport-ai/src/config/index.ts`, `identity/autoRegister.ts`, `identity/agentAuth.ts` | Arc registration, new ID, chain-aware auth and metadata |
| Verifier | `proofport-ai/src/config/contracts.ts`, `config/deployments.ts` | Arc deployment, correct public-input layout, actual RPC gas/code-size checks |
| Coinbase proof | `circuits/coinbase-attestation/src/main.nr` | Reuse ownership/attester verification; pin trusted root and add action/privacy profile |
| Signal | `proofport-ai/src/input/inputBuilder.ts`: address/scope/circuit hash | Canonical action-bound challenge; update SDK/MCP/A2A instructions |
| Nullifier | `circuits/coinbase-libs/src/nullifier.nr` | Private entropy, constraints, explicit replay/Sybil scope, regenerate verifier |
| TEE | `proofport-ai/src/tee`, nullable attestation in `src/proof/types.ts` | Ordinary server currently in use per owner; re-enable verified enclave for host confidentiality |
| Final action | No Arc EligibleUSDCVault deployment identified | Atomic proof/authorization/USDC gate and adversarial tests |

### Action binding

The current circuit checks A's signature over public `signal_hash`. A proposed challenge is:

`keccak256(abi.encode(domain, version, chainId, gateAddress, walletB, actionHash, amount, nonce, expiry))`

The Arc gate recomputes this from the actual call, compares it with proof public inputs, checks caller B (or an explicitly authenticated relayer design), pins the approved issuer root, validates expiry/scope and consumes replay state atomically. Checking `msg.sender == B` alone is insufficient if the proof never committed to B. Update input-builder and all SDK/MCP/A2A callers together. A raw calldata hash must exclude self-referential proof bytes; hash the canonical authorized action parameters.

### Privacy finding: candidate-testable nullifier

The current circuit computes `keccak256(keccak256(walletA || signal_hash) || scope)`. Signal and scope are public. An observer with candidate Coinbase-attested addresses can compute and compare candidate nullifiers. The current signal also deterministically includes A. This is a privacy limitation, not a break of hash preimage resistance.

Add private high-entropy witness material to nullifier derivation, constrain it in-circuit and define its consistency for the intended replay/Sybil policy. Merely putting a salt in a public signal does not fix a nullifier whose inputs are all public except candidate A. Protocol/cryptographic review and candidate-matching tests are needed before an unlinkability claim. The UI therefore says identity is omitted, not that every link is hidden.

### Other trust boundaries

- A signed attestation transaction is not by itself a fresh non-revocation or canonical chain-inclusion proof. Define the source/freshness policy. An arbitrary requester-selected signer root is not trustworthy.
- Current ordinary-server operation does not hide witness material from the prover host. Existing TEE support is a reusable implementation asset, not evidence that it is currently enabled.
- [Agent Wallet spending policies](https://developers.circle.com/agent-stack/agent-wallets/wallet-operations/custom-policies) are documented as mainnet-only. The Arc Testnet budget shown is an application rule and quote ceiling, not Circle wallet-level enforcement.
- The 0.001 USDC proof price is illustrative. Benchmark proof/TEE cost and latency before using it as a production tariff.

## Recommended implementation order

Inferred from the official criteria, not a guarantee of an award:

1. Feed actual vault policy and 402 quote into the agent. Demonstrate accepting the permitted quote and refusing an excessive quote before signing.
2. Register the prover on Arc and operate a real Circle EOA wallet. Retain registration/funding receipts.
3. Add Gateway Nanopayments to the proof endpoint. Show acceptance separately from delayed settlement and safe retries.
4. Deploy the verifier and atomic gate. Demonstrate a real proof + deposit, and wrong-caller/replay/expiry reverts. Measure latency/gas from actual execution.
5. Make the A2A/MCP/API discoverable and reproducible by a second independent agent. Include clear failures and machine-readable schemas.
6. Submit a review bundle: source/contract addresses, receipts, test commands/results, assumptions, baseline commits and event-period diff.

The local visualizer explains this in 42 seconds. Its gate tests are an executable specification, not Solidity tests or proof verification. `review.json` and `llms.txt` expose the same facts to human and automated readers.

## Visual presentation revision

The visualizer now keeps a connected full-flow diagram on screen. Phase and component selection highlight paths without removing other components. Detailed SDK calls, addresses and implementation caveats remain in Evidence; core wallet, identity, funding, payment, proof and atomic execution relationships remain visible.
