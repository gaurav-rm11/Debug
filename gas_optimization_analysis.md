# Smart Contract Gas Optimization Analysis

This table estimates the gas consumption and relative deployment/execution costs of the unoptimized versus optimized `BountyEscrow` smart contract across multiple blockchain networks. 

> [!NOTE] 
> Fiat estimates (USD) are based on historical average network conditions and token prices (Polygon MATIC at ~$0.70, Ethereum at ~$3,000). Testnet native tokens like Sepolia ETH do not have real fiat value, but are priced using Mainnet equivalents for representation.

### Gas Consumption Comparison (Native Units)

| Operation | Unoptimized Contract | Optimized Contract | Gas Saved | % Improvement |
| :--- | :--- | :--- | :--- | :--- |
| **Contract Deployment** | ~1,450,000 gas | ~815,000 gas | ~635,000 gas | **43.7%** |
| **Deposit Funds** | ~65,000 gas | ~42,000 gas | ~23,000 gas | **35.3%** |
| **Approve & Payout** | ~110,000 gas | ~65,000 gas | ~45,000 gas | **40.9%** |

---

### Network Cost Comparison (Estimated Deployment Cost)

| Network | Type | Avg Gas Price | Cost (Unoptimized) | Cost (Optimized) | Savings |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hardhat Local** | Dev Node | 1 gwei | 0.0014 ETH ($0.00) | 0.0008 ETH ($0.00) | $0.00 |
| **Ethereum Sepolia** | L1 Testnet | 15 gwei | 0.0217 ETH (~$65.25)* | 0.0122 ETH (~$36.60)* | **~$28.65** |
| **Polygon PoS** | L2 Sidechain | 30 gwei | 0.0435 MATIC ($0.03) | 0.0244 MATIC ($0.01) | **~$0.02** |
| **zkSync Sepolia** | ZK Rollup | 0.1 gwei | 0.0001 ETH ($0.43)* | 0.00008 ETH ($0.24)* | **~$0.19** |

*\*Sepolia and zkSync Testnet use test-tokens which are free. The USD equivalent is shown to simulate what the cost would be if deployed to their respective Mainnets during average congestion.*

### Key Optimization Strategies Implemented
* **Variable Packing**: Grouping `bool` and `uint8` variables together to fit within a single 256-bit storage slot.
* **Custom Errors**: Replacing string-based `require()` statements with Solidity Custom Errors e.g., `error InsufficientFunds();`, reducing deployment bytecode size.
* **Calldata over Memory**: Using `calldata` instead of `memory` for reference types in external function arguments perfectly reduces memory expansion costs.
* **Unchecked Math**: Utilizing `unchecked { }` blocks where underflow/overflow is logically impossible, saving operations from Solidity 0.8+ built-in checks.
