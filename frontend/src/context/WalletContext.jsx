import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { api } from "../services/api";

const WalletContext = createContext(null);

const HARDHAT_CHAIN_ID = "0x7a69"; // 31337 in hex
const HARDHAT_CHAIN_DECIMAL = 31337;

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [isContractOwner, setIsContractOwner] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Load contract ABI & deployment address from backend or local static file
  const fetchContractInfo = useCallback(async () => {
    try {
      const res = await api.blockchain.getAbi();
      if (res.success) {
        setContractData({
          address: res.contractAddress,
          ownerAddress: res.ownerAddress,
          abi: res.abi,
          chainId: res.chainId,
        });
      }
    } catch (err) {
      console.warn("Could not fetch contract info from backend:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchContractInfo();
  }, [fetchContractInfo]);

  // Check if current connected account is contract owner
  useEffect(() => {
    if (account && contractData?.ownerAddress) {
      const isOwner = account.toLowerCase() === contractData.ownerAddress.toLowerCase();
      setIsContractOwner(isOwner);
    } else {
      setIsContractOwner(false);
    }
  }, [account, contractData]);

  // Handle chain and account changes from MetaMask
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0].toLowerCase());
          setError(null);
        } else {
          setAccount(null);
          setIsContractOwner(false);
        }
      };

      const handleChainChanged = (newChainId) => {
        setChainId(parseInt(newChainId, 16));
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // Check if already connected
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0].toLowerCase());
          }
        })
        .catch(console.error);

      window.ethereum
        .request({ method: "eth_chainId" })
        .then((cId) => {
          setChainId(parseInt(cId, 16));
        })
        .catch(console.error);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask to interact with the blockchain.");
      return null;
    }

    setConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const currentChain = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(parseInt(currentChain, 16));

      if (accounts.length > 0) {
        const selected = accounts[0].toLowerCase();
        setAccount(selected);
        setConnecting(false);
        return selected;
      }
      setConnecting(false);
      return null;
    } catch (err) {
      setConnecting(false);
      if (err.code === 4001) {
        setError("Connection request was rejected in MetaMask.");
      } else {
        setError(err.message || "Failed to connect MetaMask wallet.");
      }
      return null;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsContractOwner(false);
  };

  // Helper to switch to Hardhat Local Network
  const switchToHardhatNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });
    } catch (switchError) {
      // 4902 means the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: HARDHAT_CHAIN_ID,
                chainName: "Hardhat Localhost (CertiVerify)",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["http://127.0.0.1:8545/"],
              },
            ],
          });
        } catch (addError) {
          setError("Failed to add Hardhat local network to MetaMask.");
        }
      } else {
        setError("Failed to switch network: " + switchError.message);
      }
    }
  };

  // Execute smart contract transaction to register certificate
  const registerCertificateOnChain = async (certificateId, certificateHash) => {
    if (!window.ethereum) {
      throw new Error("MetaMask is required to sign blockchain transactions.");
    }

    if (!account) {
      throw new Error("Please connect your authorized administrator wallet first.");
    }

    if (!contractData?.address || !contractData?.abi) {
      throw new Error("Smart contract data not loaded. Please ensure contract is deployed.");
    }

    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    const contract = new ethers.Contract(contractData.address, contractData.abi, signer);

    // Call registerCertificate on the smart contract
    const tx = await contract.registerCertificate(certificateId, certificateHash);
    const receipt = await tx.wait(); // Wait for 1 confirmation

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: receipt.from,
    };
  };

  // Execute smart contract transaction to revoke certificate
  const revokeCertificateOnChain = async (certificateHash, reason) => {
    if (!window.ethereum) {
      throw new Error("MetaMask is required to sign blockchain transactions.");
    }

    if (!account) {
      throw new Error("Please connect your authorized administrator wallet first.");
    }

    if (!contractData?.address || !contractData?.abi) {
      throw new Error("Smart contract data not loaded.");
    }

    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    const contract = new ethers.Contract(contractData.address, contractData.abi, signer);

    const tx = await contract.revokeCertificate(certificateHash, reason || "Revoked by issuer");
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isHardhatNetwork: chainId === HARDHAT_CHAIN_DECIMAL,
        contractData,
        isContractOwner,
        connecting,
        error,
        connectWallet,
        disconnectWallet,
        switchToHardhatNetwork,
        registerCertificateOnChain,
        revokeCertificateOnChain,
        fetchContractInfo,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

