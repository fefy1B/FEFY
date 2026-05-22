"use client";

import { useState } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS =
  "0xF4DBF1a2c4108F2A6ab5aaF2eBF7be23EeC85578";

const ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)"
];

export default function Home() {
  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");

  async function loadBalance(
    contract: ethers.Contract,
    address: string
  ) {
    const tokenBalance = await contract.balanceOf(address);

    setBalance(
      ethers.formatUnits(tokenBalance, 18)
    );
  }

  async function connectWallet() {
    try {
      if (!(window as any).ethereum) {
        alert("MetaMask/Rabby نصب نیست");
        return;
      }

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );

      const accounts = await provider.send(
        "eth_requestAccounts",
        []
      );

      const userAddress = accounts[0];

      setWallet(userAddress);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        provider
      );

      await loadBalance(contract, userAddress);

    } catch (error) {
      console.log(error);
    }
  }

  async function sendToken() {
    try {
      if (!(window as any).ethereum) return;

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );

      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

      const tx = await contract.transfer(
        receiver,
        ethers.parseUnits(amount, 18)
      );

      await tx.wait();

      alert("Transfer Successful");

      // آپدیت لحظه‌ای بالانس
      await loadBalance(contract, wallet);

      // خالی شدن فیلدها
      setReceiver("");
      setAmount("");

    } catch (error) {
      console.log(error);
      alert("Transfer Failed");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-green-600">
      <div className="text-center text-white">

        <h1 className="text-7xl font-bold mb-10">
          FEFY TOKEN
        </h1>

        <button
          onClick={connectWallet}
          className="bg-black px-10 py-4 rounded-2xl text-3xl mb-8"
        >
          {wallet
            ? wallet.slice(0, 6) +
              "..." +
              wallet.slice(-4)
            : "Connect Wallet"}
        </button>

        <div className="text-5xl mb-10">
          Balance:
          <br />
          {balance} FEFY
        </div>

        <div className="flex flex-col gap-4 items-center">

          <input
            type="text"
            placeholder="Receiver Address"
            value={receiver}
            onChange={(e) =>
              setReceiver(e.target.value)
            }
            className="w-[500px] p-4 rounded-xl text-black text-2xl"
          />

          <input
            type="text"
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            className="w-[500px] p-4 rounded-xl text-black text-2xl"
          />

          <button
            onClick={sendToken}
            className="bg-blue-700 px-10 py-4 rounded-2xl text-3xl"
          >
            Send FEFY
          </button>

        </div>
      </div>
    </main>
  );
}