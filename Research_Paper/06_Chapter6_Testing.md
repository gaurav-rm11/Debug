Chapter 6: Testing of the Proposed System

6.1 Introduction to testing 
A multi-layered testing paradigm was conducted to ensure system robustness. Given the immutable nature of Web3 systems, logical flaws within a smart contract can result in irrevocable loss of funds. Testing thus prioritized vulnerability elimination in the Solidity layer, followed by rigorous endpoint stress testing on the backend.

6.2 Types of tests Considered
1. Unit Testing: Hardhat and Chai components verified individual Ethereum functional boundaries.
2. Integration Testing: Assessing the Web3 Provider payload bridging between the localized DOM structure and the underlying node.
3. Penetration Testing (Black Box): Simulation of external inputs to verify the NLP payload resistance to prompt injection.
4. Acceptance Testing: Verification of UI/UX mechanics and Metamask wallet transition states by beta users.

6.3 Various test case scenarios considered 
Test Case 1: Unauthorized Withdrawal
- Description: Assess if a third-party wallet or an unassigned researcher can call the `approveAndPay` function.
- Expected Result: EVM throws Custom Error `UnauthorizedAccess()`.
- Result: Pass, code coverage correctly intercepted the restricted Modifier.

Test Case 2: Escrow Insufficient Liquidity 
- Description: Validate system reaction if the Organization tries to payout an amount exceeding their deposited collateral.
- Expected Result: Sub-call reversal. Contract rejects transaction, preventing arithmetic underflows.
- Result: Pass. The mathematical constraint strictly verified collateral > payout limit.

Test Case 3: Zero-Day Report Duplication 
- Description: Submit identically worded Proof of Concept documentation via two different user sessions consecutively.
- Expected Result: Backend Gemini API interrupts insertion, flags 98% semantic similarity.
- Result: Pass. The Secondary report is strictly categorized as "Duplicate," mitigating reward overlap.

6.4 Inference drawn from the test cases
The tests decisively isolated our failure surfaces. We deduced that smart contract states operated entirely accurately on local Hardhat environments. The GenAI duplicate validation, though computationally heavier and marginally slower initially, produced extremely precise boundary constraints, effectively solving the organizational overhead issue when subjected to high-volume theoretical report uploads.
