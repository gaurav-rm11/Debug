import { ethers } from 'ethers';

export const connectWallet = async () => {
  if (typeof window.ethereum === 'undefined') {
    alert("Please install MetaMask or another Web3 extension first!");
    return null;
  }
  
  try {
    // A Web3Provider wraps a standard Web3 provider, which
    // is what MetaMask injects as window.ethereum into each page
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // MetaMask requires requesting permission to connect users accounts
    const accounts = await provider.send("eth_requestAccounts", []);
    
    const signer = await provider.getSigner();
    
    return {
      provider,
      signer,
      account: accounts[0]
    };
  } catch (err) {
    console.error("User denied account access or error occurred:", err);
    return null;
  }
};
