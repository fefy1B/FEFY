"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../lib/contract";

export default function Home() {

  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState("");
  const [connected, setConnected] = useState(false);

  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");

  const [txHash, setTxHash] = useState("");

  async function connectWallet() {

    try {

      if (!(window as any).ethereum) {
        alert("Install Rabby Wallet");
        return;
      }

      await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );

      const signer = await provider.getSigner();

      const address = await signer.getAddress();

      setWallet(address);

      const contract = await getContract();

      if (!contract) return;

      const rawBalance =
        await contract.balanceOf(address);

      const decimals =
        await contract.decimals();

      const formatted =
        ethers.formatUnits(
          rawBalance,
          decimals
        );

      setBalance(formatted);

      setConnected(true);

    } catch (err) {

      console.log(err);

    }
  }

  async function sendToken() {

    try {

      if (!toAddress || !amount) {
        alert("Fill all fields");
        return;
      }

      const contract = await getContract();

      if (!contract) return;

      const decimals =
        await contract.decimals();

      const parsedAmount =
        ethers.parseUnits(
          amount,
          decimals
        );

      const tx = await contract.transfer(
        toAddress,
        parsedAmount
      );

      setTxHash(tx.hash);

      await tx.wait();

      alert("Transaction Success");

      const rawBalance =
        await contract.balanceOf(wallet);

      const formatted =
        ethers.formatUnits(
          rawBalance,
          decimals
        );

      setBalance(formatted);

    } catch (err) {

      console.log(err);

      alert("Transaction Failed");

    }
  }

  return (

    <main
      className="
        min-h-screen
        flex
        flex-col
        items-center
        justify-center
        gap-6
        bg-green-500
        text-black
        p-10
      "
    >

      <h1 className="text-7xl font-bold">
        FEFY TOKEN
      </h1>

      <button
        onClick={connectWallet}
        className="
          bg-blue-700
          hover:bg-blue-800
          text-white
          px-10
          py-5
          rounded-3xl
          text-3xl
        "
      >
        {
          connected
            ? "Connected"
            : "Connect Wallet"
        }
      </button>

      {wallet && (
        <>

          <p className="text-2xl break-all">
            {wallet}
          </p>

          <p className="text-6xl font-bold">
            {balance} FEFY
          </p>

          <input
            type="text"
            placeholder="Receiver Address"
            value={toAddress}
            onChange={(e) =>
              setToAddress(e.target.value)
            }
            className="
              w-full
              max-w-4xl
              p-5
              rounded-2xl
              text-2xl
              bg-white
              border-4
              border-black
              outline-none
            "
          />

          <input
            type="text"
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            className="
              w-full
              max-w-4xl
              p-5
              rounded-2xl
              text-2xl
              bg-white
              border-4
              border-black
              outline-none
            "
          />

          <button
            onClick={sendToken}
            className="
              bg-green-900
              hover:bg-green-950
              text-white
              px-16
              py-6
              rounded-3xl
              text-4xl
            "
          >
            Send FEFY
          </button>

          {txHash && (

            <div className="text-center">

              <p className="text-2xl font-bold">
                Transaction Hash
              </p>

              <p className="break-all">
                {txHash}
              </p>

              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                className="
                  text-blue-900
                  underline
                  text-2xl
                "
              >
                View On Etherscan
              </a>

            </div>

          )}

        </>
      )}

    </main>

  );
}