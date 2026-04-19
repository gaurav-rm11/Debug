Chapter 4: Proposed Design

4.1 Block diagram of the system 
The system operates on an isolated node architecture connecting a centralized database with decentralized ledger systems.
- Client Node: Displays the User Interface, rendering dynamic Markdown editors and WebGL backgrounds. Ethers.js is utilized locally here to proxy user interactions to the wallet.
- Logic Node (Backend): Hosts the Express.js endpoints. This node acts as an invisible bridge connecting user payload strings directly to Google's Gemini LLM endpoints for contextual parsing. 
- Storage Node: Utilizes Supabase (Postgres) handling user metadata, role assignments (Researcher vs Organization), Notification logs, and off-chain report data caches.
- Execution Node: The Hardhat/Ethereum blockchain layer executing bytecode instructions via the `BountyEscrow.sol` file logic.

4.2 Modular design of the system 
1. Authentication Module: Instead of standard JWT/Password loops, this module validates the user's cryptographically signed address. It pairs the 0x-Address directly to the Supabase identity logic.
2. Mission Control (Bounty Creation) Module: Interfaces exclusively for organizational roles to mint new Bounty Escrow smart contracts. The user specifies target domains, in-scope rules, and executes the `deploy()` transaction.
3. Researcher Dashboard Module: Displays the active timeline of programs, tracks CVSS severities, and visualizes an aggregate "Level" and "XP" reputation system.
4. AI Intermediary Module: The core logic block that processes text payloads, applies JSON extraction regular expressions, and computes a duplicate-confidence percentage against arrays of historical incident reports.

4.3 Detailed Design
The Smart Contract is strictly designed as a highly optimized state machine containing the following properties:
- `address public organization;` (Deployer)
- `uint public bountyAmount;`
- `bool public isActive;`
The contract implements restrictive Modifiers (e.g., `onlyOrganization`) ensuring exclusively the fund depositor can release the ETH capital via the target `approveAndPay` function. 

On the Backend Database side, the schema utilizes robust relations, primarily linking `reports` directly to an overarching `bounties` ID. Real-time updates push `notifications` when the status enum pivots from "submitted" to "accepted" or "rejected".

4.4 Project Scheduling & Tracking using Timeline / Gantt Chart 
(Note: Replace internal timeline dates below per your university academic schedule)
* Phase 1 (August 15 - September 15): Problem Definition, Literature Survey, and Basic Blockchain Architectural Planning.
* Phase 2 (September 16 - November 10): Requirement Engineering, Setup of Hardhat testing environments, Drafting the `BountyEscrow` smart contract.
* Phase 3 (January 5 - February 20): API integration (Google Gemini/NLP setup), Supabase database structuring, Backend endpoints.
* Phase 4 (February 21 - March 15): Developing the React frontend, mapping the UI/UX components (Glassmorphism layout).
* Phase 5 (March 16 - April 10): System testing, connecting Ethers.js to the frontend, optimizing Smart Contract Gas.
* Phase 6 (April 11 - April 30): Research paper documentation, Plagiarism checks, Final deployment to testnets (Sepolia/Polygon).
