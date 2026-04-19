Chapter 5: Implementation of the Proposed System

5.1 Methodology employed for development 
The development of this project strictly adhered to the Agile Methodology, consisting of iterative two-week sprints. The initial sprints focused on establishing the hard-coded Web3 infrastructure (the EVM bytecode mapping). We employed Test-Driven Development (TDD) using the Hardhat and Chai framework to mathematically prove that our escrow contracts could not suffer from classic blockchain exploits (such as Reentrancy attacks or Arithmetic Overflows). Subsequent sprints deployed the user interfaces and finalized the NLP triage pipeline.

5.2 Algorithms and flowcharts for the respective modules developed
Algorithm 1: Dynamic Escrow Generation
Step 1: Organization authorizes MetaMask digital signature.
Step 2: Frontend Ethers.js initializes a ContractFactory utilizing `BOUNTY_ESCROW_ABI` and bytecode.
Step 3: Frontend bundles physical ETH (value corresponding to Critical reward tier limit) with the deployment transaction.
Step 4: Network confirms block creation; the returned smart contract address is appended to the organizational `bounties` schema in Supabase.

Algorithm 2: TF-IDF and Semantic Duplicate Filtering via GenAI
Step 1: Backend receives incoming incident documentation string.
Step 2: Database queries historical vulnerabilities reported against the specific `bounty_id`.
Step 3: Application maps a secondary array containing historical context strings.
Step 4: Algorithm executes Prompt Engineering, instructing Gemini to evaluate similarity parameters.
Step 5: If the similarity score exceeds > 80%, the system flags a Duplicate Error logic path.
Step 6: If the string is unique, semantic text parsing determines CVSS vector scoring.
Step 7: Extracted variables are converted and saved to standard JSON schema representation.

5.3 Datasets source and utilization
Unlike traditional Machine Learning projects requiring massive static Kaggle datasets for epoch training, our architecture relies on Large Language Model inference (Zero-Shot prompting). 
However, for unit testing the AI accuracy, we synthesized a micro-dataset consisting of 50 classical CVE bug reports (e.g., Log4j descriptions, specific DOM-based XSS payloads) sourced via the Mitre Corporation Database. 
This dataset was utilized repeatedly to adjust and calibrate the temperature and instructional constraints within the Node.js Gemini prompt strings, ensuring the output remained strictly constrained to JSON schemas and generated appropriate Severity mappings corresponding correctly to industry-standard CVSS metrics.
