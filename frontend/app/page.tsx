"use client";

import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";

import toast, {
  Toaster,
} from "react-hot-toast";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TOKEN_ADDRESS =
  "0xF4DBF1a2c4108F2A6ab5aaF2eBF7be23EeC85578";

const PRESALE_ADDRESS =
  "0x9f405241111aFb183eDC90EdB9153982BB75679B";

const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

const PRESALE_ABI = [
  "function totalSold() view returns (uint256)",
  "function rate() view returns (uint256)",
  "function contractTokenBalance() view returns (uint256)",
];

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Home() {
  const initialized = useRef(false);

  const [wallet, setWallet] = useState("");
  const [balance, setBalance] = useState("0");
  const [sold, setSold] = useState("0");
  const [remaining, setRemaining] = useState("0");
  const [rate, setRate] = useState("0");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const chartData = [
    { day: "Mon", price: 0.0001 },
    { day: "Tue", price: 0.00015 },
    { day: "Wed", price: 0.00018 },
    { day: "Thu", price: 0.00022 },
    { day: "Fri", price: 0.0003 },
    { day: "Sat", price: 0.00038 },
    { day: "Sun", price: 0.00042 },
  ];

  useEffect(() => {
    if (initialized.current) return;

    initialized.current = true;

    initialize();
  }, []);

  async function initialize() {
    try {
      if (!window.ethereum) {
        toast.error("Please install MetaMask");
        return;
      }

      const provider = new ethers.BrowserProvider(
        window.ethereum
      );

      const accounts = await provider.send(
        "eth_accounts",
        []
      );

      if (accounts.length > 0) {
        const userAddress = accounts[0];

        setWallet(userAddress);

        await loadBalance(userAddress);
      }

      await loadDashboard();

      window.ethereum.on(
        "accountsChanged",
        async (accounts: string[]) => {
          if (accounts.length > 0) {
            setWallet(accounts[0]);

            await loadBalance(accounts[0]);
          } else {
            setWallet("");
            setBalance("0");
          }
        }
      );
    } catch (err) {
      console.log(err);
    }
  }

  async function loadBalance(
    userAddress: string
  ) {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(
        window.ethereum
      );

      const token = new ethers.Contract(
        TOKEN_ADDRESS,
        TOKEN_ABI,
        provider
      );

      const rawBalance =
        await token.balanceOf(userAddress);

      const formatted = ethers.formatUnits(
        rawBalance,
        18
      );

      setBalance(
        Number(formatted).toLocaleString()
      );
    } catch (err) {
      console.log(err);

      setBalance("0");
    }
  }

  async function loadDashboard() {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(
        window.ethereum
      );

      const presale = new ethers.Contract(
        PRESALE_ADDRESS,
        PRESALE_ABI,
        provider
      );

      const soldData =
        await presale.totalSold();

      const remainData =
        await presale.contractTokenBalance();

      const rateData =
        await presale.rate();

      const soldFormatted = Number(
        ethers.formatUnits(
          soldData,
          18
        )
      );

      const remainFormatted = Number(
        ethers.formatUnits(
          remainData,
          18
        )
      );

      setSold(
        soldFormatted.toLocaleString()
      );

      setRemaining(
        remainFormatted.toLocaleString()
      );

      setRate(rateData.toString());

      const total =
        soldFormatted +
        remainFormatted;

      const progressValue =
        total > 0
          ? (soldFormatted / total) * 100
          : 0;

      setProgress(progressValue);
    } catch (err) {
      console.log(err);
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        toast.error(
          "Please install MetaMask"
        );
        return;
      }

      setLoading(true);

      toast.loading(
        "Connecting Wallet...",
        {
          id: "wallet",
        }
      );

      const provider = new ethers.BrowserProvider(
        window.ethereum
      );

      const accounts = await provider.send(
        "eth_requestAccounts",
        []
      );

      const userAddress = accounts[0];

      setWallet(userAddress);

      await loadBalance(userAddress);

      await loadDashboard();

      toast.success(
        "Wallet Connected 🚀",
        {
          id: "wallet",
        }
      );
    } catch (err) {
      console.log(err);

      toast.error(
        "Wallet Connection Failed",
        {
          id: "wallet",
        }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toaster position="top-right" />

      <main
        className="
          min-h-screen
          bg-gradient-to-b
          from-black
          via-green-900
          to-black
          text-white
        "
      >

        {/* HERO */}

        <section
          className="
            flex
            flex-col
            items-center
            justify-center
            text-center
            min-h-screen
            px-6
          "
        >

          <h1
            className="
              text-7xl
              md:text-8xl
              font-extrabold
              mb-6
              text-green-400
            "
          >
            FEFY TOKEN
          </h1>

          <p
            className="
              text-2xl
              md:text-3xl
              max-w-[900px]
              leading-relaxed
              mb-10
            "
          >
            The Next Generation Web3 Meme Coin 🚀🔥
          </p>

          <button
            onClick={connectWallet}
            disabled={loading}
            className="
              bg-green-500
              hover:bg-green-400
              text-black
              font-bold
              px-10
              py-5
              rounded-3xl
              text-2xl
              md:text-3xl
              transition-all
              shadow-2xl
            "
          >

            {loading
              ? "Connecting..."
              : wallet
              ? `${wallet.slice(
                  0,
                  6
                )}...${wallet.slice(-4)}`
              : "Connect Wallet"}

          </button>

          <div
            className="
              mt-10
              text-2xl
              md:text-3xl
              font-bold
              bg-black/40
              border
              border-green-500
              px-8
              py-6
              rounded-3xl
            "
          >

            Your Balance:
            <br />

            <span className="text-green-400">
              {balance} FEFY
            </span>

          </div>

        </section>

        {/* TOKENOMICS */}

        <section className="py-24 px-8">

          <h2
            className="
              text-5xl
              md:text-6xl
              font-bold
              text-center
              mb-16
              text-green-400
            "
          >
            TOKENOMICS
          </h2>

          <div
            className="
              grid
              md:grid-cols-3
              gap-10
              max-w-[1400px]
              mx-auto
            "
          >

            {/* SOLD */}

            <div
              className="
                bg-black/40
                border
                border-green-500
                p-10
                rounded-3xl
                text-center
              "
            >

              <h3 className="text-3xl font-bold mb-5">
                Total Sold
              </h3>

              <p className="text-4xl text-green-400">
                {sold}
              </p>

            </div>

            {/* REMAINING */}

            <div
              className="
                bg-black/40
                border
                border-green-500
                p-10
                rounded-3xl
                text-center
              "
            >

              <h3 className="text-3xl font-bold mb-5">
                Remaining
              </h3>

              <p className="text-4xl text-green-400">
                {remaining}
              </p>

            </div>

            {/* RATE */}

            <div
              className="
                bg-black/40
                border
                border-green-500
                p-10
                rounded-3xl
                text-center
              "
            >

              <h3 className="text-3xl font-bold mb-5">
                Current Rate
              </h3>

              <p className="text-4xl text-green-400">
                {rate}
              </p>

            </div>

          </div>

          {/* PROGRESS */}

          <div
            className="
              max-w-[1400px]
              mx-auto
              mt-16
            "
          >

            <div
              className="
                w-full
                h-8
                bg-black/50
                rounded-full
                overflow-hidden
                border
                border-green-500
              "
            >

              <div
                className="
                  h-full
                  bg-green-500
                  transition-all
                  duration-1000
                "
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

            <p className="text-center mt-4 text-2xl">
              {progress.toFixed(2)}% Sold
            </p>

          </div>

        </section>

        {/* CHART */}

        <section className="py-24 px-8">

          <h2
            className="
              text-5xl
              md:text-6xl
              font-bold
              text-center
              mb-16
              text-green-400
            "
          >
            LIVE PRICE CHART
          </h2>

          <div
            className="
              max-w-[1400px]
              mx-auto
              bg-black/40
              border
              border-green-500
              rounded-3xl
              p-10
            "
          >

            <div
              className="
                w-full
                h-[500px]
                min-w-0
              "
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart data={chartData}>

                  <XAxis
                    dataKey="day"
                    stroke="#22c55e"
                  />

                  <YAxis
                    stroke="#22c55e"
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#22c55e"
                    strokeWidth={5}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        </section>

      </main>
    </>
  );
}