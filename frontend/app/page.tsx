"use client";

import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import { Flame, Wallet, Coins, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const TOKEN_ADDRESS = "0xC26166825088453ce44537239cE90601b515F92f";
const PRESALE_ADDRESS = "0xdD5Ca6474636320983Cbce5b35A2D6b4138A2316";
const OWNER_ADDRESS = "0x1202259d70cC4C52AA77908736B54496D98c47aA";
const BSCSCAN_API_KEY = "not_needed_yet";

const TOKEN_ABI = ["function balanceOf(address owner) view returns (uint256)"];
const PRESALE_ABI = [
  "function totalSold() view returns (uint256)",
  "function totalRaised() view returns (uint256)",
  "function rate() view returns (uint256)",
  "function contractTokenBalance() view returns (uint256)",
  "function paused() view returns (bool)",
  "function buyTokens() payable",
  "function pauseSale()",
  "function resumeSale()",
  "event TokensPurchased(address buyer,uint256 bnbAmount,uint256 tokenAmount)",
];

export default function Home() {
  const initialized = useRef(false);
  const [wallet, setWallet] = useState("");
  const [networkName, setNetworkName] = useState("Unknown");
  const [walletType, setWalletType] = useState("No Wallet");
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [balance, setBalance] = useState("0");
  const [sold, setSold] = useState("0");
  const [remaining, setRemaining] = useState("0");
  const [rate, setRate] = useState("0");
  const [progress, setProgress] = useState(0);
  const HARD_CAP = 500;
  const SOFT_CAP = 100;
  const [bnbRaised, setBnbRaised] = useState(72.4);
  const [bnbPrice, setBnbPrice] = useState(0);
  const [volume24h, setVolume24h] = useState("0");
  const [liquidity, setLiquidity] = useState("0");
  const [bnbAmount, setBnbAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [marketCap, setMarketCap] = useState("0");
  const [holders, setHolders] = useState("0");
  const [buyCooldown, setBuyCooldown] = useState(false);
  const [chartData, setChartData] = useState([
    { time: "1", price: 0.0041 },
    { time: "2", price: 0.0043 },
    { time: "3", price: 0.0042 },
    { time: "4", price: 0.0046 },
    { time: "5", price: 0.0048 },
  ]);
  const [tokenPrice, setTokenPrice] = useState("0.00042");
  const [priceChange, setPriceChange] = useState("+2.41");
  const [showSuccess, setShowSuccess] = useState(false);
  const [myBuys, setMyBuys] = useState<{ amount: string; tokens: string; time: string }[]>([]);
  const [liveBuys, setLiveBuys] = useState([
    { wallet: "0xA91...3Fd", amount: "0.8" },
    { wallet: "0xFF2...91A", amount: "1.4" },
    { wallet: "0xBC1...7Ef", amount: "0.3" },
  ]);
  const [timeLeft, setTimeLeft] = useState({ days: 12, hours: 8, minutes: 42, seconds: 11 });
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [finalPrice, setFinalPrice] = useState("0.004000");

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initialize();

    const metricsInterval = setInterval(() => {
      generateMarketMetrics();
      updateChart();
    }, 15000);

    const liveInterval = setInterval(() => {
      generateMarketMetrics();
      setChartData((prev) => {
        const next = [...prev, { time: (prev.length + 1).toString(), price: Number(tokenPrice) }];
        if (next.length > 12) next.shift();
        return next;
      });
      const fakeWallet = `0x${Math.random().toString(16).slice(2, 5)}.${Math.random().toString(16).slice(2, 5)}`;
      const fakeAmount = (Math.random() * 2 + 0.2).toFixed(2);
      setLiveBuys((prev) => {
        const next = [{ wallet: fakeWallet, amount: fakeAmount }, ...prev];
        if (next.length > 6) next.pop();
        return next;
      });
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
            else {
              hours = 23;
              if (days > 0) days--;
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 5000);

    const bnbInterval = setInterval(() => fetchBNBPrice(), 30000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(liveInterval);
      clearInterval(bnbInterval);
    };
  }, []);

  function updateChart() {
    setChartData(prev => {
      const lastPrice = prev[prev.length - 1].price;
      const nextPrice = Number((lastPrice + (Math.random() * 0.0004 - 0.0002)).toFixed(6));
      return [...prev.slice(-9), { time: (prev.length + 1).toString(), price: nextPrice }];
    });
  }

  async function loadHolders() {
    setHolders("0");
  }

  async function initialize() {
    try {
      if (!(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) === 56) {
        setNetworkName("BNB Smart Chain");
        setWrongNetwork(false);
      } else {
        setNetworkName(`Wrong Network (${network.chainId})`);
        setWrongNetwork(true);
      }
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setWallet(userAddress);
        await loadBalance(userAddress);
        if (accounts[0].toLowerCase() === OWNER_ADDRESS.toLowerCase()) setIsOwner(true);
      }
      await loadDashboard();
      detectWallet();
    } catch (err) {
      console.log(err);
    }
  }

  async function loadBalance(userAddress: string) {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      const rawBalance = await token.balanceOf(userAddress);
      setBalance(ethers.formatUnits(rawBalance, 18));
    } catch (err) {
      console.log(err);
    }
  }

  async function loadDashboard() {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const presale = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, provider);
      const soldData = await presale.totalSold();
      const remainData = await presale.contractTokenBalance();
      const raisedData = await presale.totalRaised();
      const rateData = await presale.rate();
      const soldFormatted = Number(ethers.formatUnits(soldData, 18));
      const remainFormatted = Number(ethers.formatUnits(remainData, 18));
      const raisedFormatted = Number(ethers.formatEther(raisedData));
      setBnbRaised(raisedFormatted);
      setSold(soldFormatted.toLocaleString("en-US"));
      setRemaining(remainFormatted.toLocaleString("en-US"));
      setRate(rateData.toString());
      const progressValue = (raisedFormatted / HARD_CAP) * 100;
      setProgress(Math.min(progressValue, 100));
    } catch (err) {
      console.log(err);
    }
  }

  function generateMarketMetrics() {
    const fakePrice = 0.004 + Math.random() * 0.0015;
    setFinalPrice(fakePrice.toFixed(6));
    setTokenPrice(fakePrice.toFixed(6));
    setMarketCap(Math.floor(fakePrice * 100000000).toLocaleString("en-US"));
    setLiquidity(Math.floor(80000 + Math.random() * 50000).toLocaleString("en-US"));
    setVolume24h(Math.floor(25000 + Math.random() * 40000).toLocaleString("en-US"));
    setPriceChange((Math.random() * 12 - 3).toFixed(2));
  }

  async function fetchBNBPrice() {
    try {
      const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT");
      const data = await response.json();
      setBnbPrice(Number(data.price));
    } catch (err) {
      console.log("BNB Price Error", err);
    }
  }

  function detectWallet() {
    const eth = (window as any).ethereum;
    if (!eth) { setWalletType("No Wallet"); return; }
    if (eth.isRabby) { setWalletType("Rabby Wallet"); return; }
    if (eth.isTrust) { setWalletType("Trust Wallet"); return; }
    if (eth.isBinance) { setWalletType("Binance Wallet"); return; }
    if (eth.isOkxWallet) { setWalletType("OKX Wallet"); return; }
    if (eth.isMetaMask) { setWalletType("MetaMask"); return; }
    setWalletType("Injected Wallet");
  }

  async function connectWallet() {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const userAddress = accounts[0];
      setWallet(userAddress);
      await loadBalance(userAddress);
      toast.success("Wallet Connected 🚀");
    } catch (err) {
      console.log(err);
      toast.error("Connection Failed");
    } finally {
      setLoading(false);
    }
  }

  // تابع کمکی برای اسکرول به بخش خرید
  const scrollToBuySection = () => {
    const buySection = document.getElementById('buy-section');
    if (buySection) {
      buySection.scrollIntoView({ behavior: 'smooth' });
      const bnbInput = document.getElementById('bnb-input');
      if (bnbInput) {
        bnbInput.focus();
        bnbInput.style.border = '2px solid #22c55e';
        setTimeout(() => {
          bnbInput.style.border = '';
        }, 2000);
      }
    }
  };

  async function buyTokens() {
    if (buyCooldown) return;
    setBuyCooldown(true);

    if (!wallet) {
      toast.error("Connect wallet first");
      scrollToBuySection();
      setBuyCooldown(false);
      return;
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 56) {
      toast.error("Switch to BNB Smart Chain");
      scrollToBuySection();
      setBuyCooldown(false);
      return;
    }

    const amount = Number(bnbAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("❌ Please enter BNB amount above");
      scrollToBuySection();
      setBuyCooldown(false);
      return;
    }

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const presale = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, signer);

      const isPaused = await presale.paused();
      if (isPaused) {
        toast.error("Presale is currently paused");
        setLoading(false);
        setBuyCooldown(false);
        return;
      }

      const value = ethers.parseEther(bnbAmount);
      const tx = await presale.buyTokens({ value, gasLimit: 300000 });

      const rateData = await presale.rate();
      const estimatedTokens = (Number(bnbAmount) * Number(rateData)).toFixed(0);

      setMyBuys(prev => [{ amount: bnbAmount, tokens: estimatedTokens, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
      toast.success("Purchase successful! 🚀");
      setBnbAmount("");
      setShowSuccess(true);

      setTimeout(() => setBuyCooldown(false), 10000);
    } catch (error: any) {
      console.error(error);
      if (error.code === 4001 || error.message?.includes("rejected")) {
        toast.error("Transaction rejected by user");
      } else if (error.message?.includes("insufficient funds")) {
        toast.error("Insufficient BNB balance");
      } else if (error.message?.includes("paused")) {
        toast.error("Presale is paused");
      } else {
        toast.error("Transaction failed");
      }
      setBuyCooldown(false);
    } finally {
      setLoading(false);
    }
  }

  async function pausePresale() {
    if (!isOwner) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, signer);
      const tx = await contract.pauseSale();
      toast.loading("Pausing presale...", { id: "pause" });
      await tx.wait();
      toast.success("Presale paused", { id: "pause" });
    } catch (err) {
      console.log(err);
      toast.error("Pause failed");
    }
  }

  async function unpausePresale() {
    if (!isOwner) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, signer);
      const tx = await contract.resumeSale();
      toast.loading("Unpausing presale...", { id: "unpause" });
      await tx.wait();
      toast.success("Presale resumed", { id: "unpause" });
    } catch (err) {
      console.log(err);
      toast.error("Unpause failed");
    }
  }

  async function checkPresaleBalance() {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const presale = new ethers.Contract(PRESALE_ADDRESS, [
        "function contractTokenBalance() view returns (uint256)"
      ], signer);
      const balance = await presale.contractTokenBalance();
      const balanceFormatted = ethers.formatUnits(balance, 18);
      alert(`Presale token balance: ${balanceFormatted} FEFY`);
      if (balance === BigInt(0)) {
        alert("No tokens in presale! You need to transfer tokens to the presale contract.");
      }
    } catch(err) {
      console.error(err);
      alert("Error: " + (err as any).message);
    }
  }

  async function checkHardCap() {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const presale = new ethers.Contract(PRESALE_ADDRESS, [
        "function totalRaised() view returns (uint256)",
        "function hardCap() view returns (uint256)"
      ], signer);
      const totalRaised = await presale.totalRaised();
      const hardCap = await presale.hardCap();
      const remaining = hardCap - totalRaised;
      alert(`Total Raised: ${ethers.formatEther(totalRaised)} BNB\nHard Cap: ${ethers.formatEther(hardCap)} BNB\nRemaining: ${ethers.formatEther(remaining)} BNB`);
    } catch(err) {
      console.error(err);
      alert("Error: " + (err as any).message);
    }
  }

  function copyContract() {
    navigator.clipboard.writeText(TOKEN_ADDRESS);
    toast.success("Contract Copied 🚀");
  }

  return (
    <>
      <Toaster position="top-right" />
      <main className="min-h-screen text-white bg-gradient-to-b from-[#041b11] via-[#0b2f1f] to-[#000000] overflow-x-hidden">
        {/* TICKER */}
        <div className="w-full overflow-hidden border-y border-green-500/20 bg-black py-3 relative">
          <div className="flex gap-16 whitespace-nowrap animate-[ticker_28s_linear_infinite] text-green-400 font-bold text-lg tracking-widest">
            <span>🔥 LIVE NOW</span>
            <span>🔥 MARKET CAP ${marketCap}</span>
            <span>🔥 LIQUIDITY ${liquidity}</span>
            <span>🔥 VOLUME ${volume24h}</span>
            <span>🔥 HOLDERS {holders}</span>
            <span>🔥 FEFY TRENDING</span>
            <span>🔥 LIVE PRESALE</span>
            <span>🔥 COMMUNITY POWERED</span>
          </div>
        </div>

        {/* HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6">
          <div className="flex items-center flex-col md:flex-row gap-4 mb-6">
            <Flame size={60} className="text-green-400" />
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-green-400">FEFY TOKEN</h1>
          </div>
          <div className="text-lg md:text-2xl max-w-[900px] text-gray-300 mb-10">
            <p>Clean Energy Inspired Meme Coin 🌱</p>
            <div className="mt-6 flex items-center justify-center gap-6 text-2xl font-bold">
              <div className="text-green-400">${tokenPrice}</div>
              <div className={Number(priceChange) >= 0 ? "text-green-500" : "text-red-500"}>{priceChange}%</div>
            </div>
          </div>
          <button onClick={connectWallet} disabled={loading} className="bg-green-500 hover:bg-green-400 text-black font-bold px-10 py-5 rounded-3xl text-2xl flex items-center gap-3 transition-all">
            <Wallet size={28} />
            {loading ? "Connecting..." : wallet ? wallet.slice(0, 6) + "..." + wallet.slice(-4) : "Connect Wallet"}
          </button>
          <div className="mt-6 bg-[#111] break-all border border-green-500/20 rounded-2xl p-4 text-sm text-white">
            <div>Wallet: {wallet ? wallet.slice(0, 6) + "..." + wallet.slice(-4) : "Not Connected"}</div>
            <div className="mt-2 text-yellow-400 font-bold">Token Balance: {balance}</div>
          </div>
          <div className="mt-10 text-2xl md:text-3xl font-bold text-green-400">
            <Coins className="inline-block mr-2" />{Number(balance).toLocaleString("en-US")} FEFY
          </div>
          <div className="mt-4 text-lg font-bold text-yellow-400">Network: {networkName}</div>
          <div className="mt-2 text-md text-green-400 font-bold">Wallet: {walletType}</div>
        </section>

        {/* BUY SECTION */}
        <section id="buy-section" className="py-20 px-6">
          <div className="max-w-[700px] mx-auto bg-[#0d2017] border border-green-500 rounded-3xl p-10 shadow-[0_0_40px_rgba(0,255,120,0.15)]">
            <h2 className="text-5xl font-bold text-center mb-10 text-green-400">BUY PRESALE</h2>
            <input 
              id="bnb-input"
              type="number" 
              placeholder="Enter BNB amount" 
              value={bnbAmount} 
              onChange={(e) => setBnbAmount(e.target.value)} 
              className="w-full bg-black border-2 border-green-500 rounded-2xl p-5 text-2xl mb-8 outline-none" 
            />
            <button onClick={buyTokens} disabled={buyCooldown || wrongNetwork || loading} className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-5 rounded-2xl text-3xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
              {loading ? "⏳ PROCESSING..." : buyCooldown ? "WAIT..." : "BUY FEFY"}
            </button>
            
            {/* کادر Contract Address - دقیقاً زیر دکمه خرید */}
            <div className="mt-6 bg-black/40 rounded-xl p-3 border border-green-500/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex-1 w-full">
                  <p className="text-green-400 text-xs font-bold mb-1">📋 TOKEN CONTRACT</p>
                  <code className="text-green-300 text-xs break-all font-mono">
                    {TOKEN_ADDRESS}
                  </code>
                </div>
                <button 
                  onClick={copyContract}
                  className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 whitespace-nowrap hover:scale-105 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
              </div>
            </div>
          </div>
          
          {/* My Buy History */}
          <div className="mt-8 bg-[#111] border border-green-500/20 rounded-2xl p-6 max-w-[700px] mx-auto">
            <h3 className="text-xl font-bold text-green-400 mb-4">My Buy History</h3>
            {myBuys.length === 0 ? <div className="text-gray-400">No purchases yet</div> : myBuys.map((buy, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-2 justify-between py-2 border-b border-green-500/10">
                <span>{buy.amount} BNB</span>
                <span>{buy.tokens} FEFY</span>
                <span>{buy.time}</span>
              </div>
            ))}
          </div>
        </section>
        {/* TOKENOMICS */}
        <section className="py-20 px-6">
          <h2 className="text-6xl font-bold text-center mb-16 text-green-400">TOKENOMICS</h2>
          <div className="grid md:grid-cols-4 gap-10 max-w-[1400px] mx-auto">
            <div className="bg-[#0d2017] border border-green-500 rounded-3xl p-10 text-center">
              <h3 className="text-3xl font-bold mb-5 text-white">Market Cap</h3>
              <p className="text-4xl text-green-400 font-bold">${marketCap}</p>
              <p className="text-lg text-green-300 mt-4 font-semibold">Holders: {holders}</p>
            </div>
            <div className="bg-[#0d2017] border border-green-500 rounded-3xl p-10 text-center">
              <Activity size={45} className="mx-auto mb-5 text-green-400" />
              <h3 className="text-3xl font-bold mb-5">Total Sold</h3>
              <p className="text-4xl text-green-400">{sold}</p>
            </div>
            <div className="bg-[#0d2017] border border-green-500 rounded-3xl p-10 text-center">
              <Coins size={45} className="mx-auto mb-5 text-green-400" />
              <h3 className="text-3xl font-bold mb-5">Remaining</h3>
              <p className="text-4xl text-green-400">{remaining}</p>
            </div>
            <div className="bg-[#0d2017] border border-green-500 rounded-3xl p-10 text-center">
              <Wallet size={45} className="mx-auto mb-5 text-green-400" />
              <h3 className="text-3xl font-bold mb-5">Current Rate</h3>
              <p className="text-4xl text-green-400">{rate}</p>
            </div>
          </div>
          <div className="max-w-[1000px] mx-auto mt-20">
            <div className="w-full h-10 bg-zinc-800 rounded-full overflow-hidden">
              <div style={{ width: `${progress}%` }} className="h-full bg-green-500" />
            </div>
          </div>
          <div className="mt-20 max-w-[1000px] mx-auto space-y-8">
            <div><div className="flex justify-between mb-2 text-lg font-bold"><span>LIQUIDITY</span><span className="text-green-400">40%</span></div><div className="w-full h-5 bg-[#08140f] rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full w-[40%]" /></div></div>
            <div><div className="flex justify-between mb-2 text-lg font-bold"><span>MARKETING</span><span className="text-green-400">20%</span></div><div className="w-full h-5 bg-[#08140f] rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full w-[20%]" /></div></div>
            <div><div className="flex justify-between mb-2 text-lg font-bold"><span>ECOSYSTEM</span><span className="text-green-400">25%</span></div><div className="w-full h-5 bg-[#08140f] rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full w-[25%]" /></div></div>
            <div><div className="flex justify-between mb-2 text-lg font-bold"><span>BURN</span><span className="text-green-400">15%</span></div><div className="w-full h-5 bg-[#08140f] rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full w-[15%]" /></div></div>
          </div>
        </section>

        {/* CHART */}
        <section className="py-20 px-6">
          <div className="max-w-[1200px] mx-auto bg-[#0d2017] border border-green-500 rounded-3xl p-10">
            <h2 className="text-5xl font-bold text-center mb-10 text-green-400">PRICE GROWTH</h2>
            <div className="w-full h-[400px] min-w-0">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={4} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
              {/* WHITEPAPER */}
        <section className="py-28 px-6">
          <div className="max-w-[1400px] mx-auto bg-[#0b1f16] border border-green-500/30 rounded-[40px] p-12 shadow-[0_0_60px_rgba(0,255,120,0.08)]">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1">
                <div className="flex gap-6 mt-12 flex-wrap">
                  <p className="text-green-400 text-xl mb-5 tracking-[4px]">
  OFFICIAL WHITEPAPER
</p>

<h2 className="text-5xl md:text-7xl font-extrabold leading-tight mb-10">
  Nature Intelligence
  <br />
  for the
  <span className="text-green-400"> Future of Web3</span>
</h2>

<p className="text-gray-300 text-xl leading-relaxed max-w-[800px]">
  Explore the official FEFY Whitepaper and discover the vision behind the world's first Nature Intelligence Ecosystem for Web3. Learn about our philosophy, tokenomics, roadmap, governance, and long-term mission to build technology that learns from nature instead of exploiting it.
</p>
<a
  href="/FEFY-Whitepaper.pdf"
  download
  className="bg-green-500 hover:bg-green-400 text-black font-bold px-10 py-5 rounded-2xl text-xl transition-all hover:scale-105 active:scale-95 inline-block"
>
  📄 Download Whitepaper
</a>
                  <button className="border border-green-500 hover:bg-green-500 hover:text-black px-10 py-5 rounded-2xl text-xl transition-all">
                    Learn More
                  </button>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-[320px] h-[420px] rounded-[40px] border border-green-500/30 bg-gradient-to-b from-green-500/20 to-black flex items-center justify-center text-center shadow-[0_0_50px_rgba(0,255,120,0.15)]">
                  <div><div className="text-7xl mb-6">🌱</div><h3 className="text-4xl font-bold text-green-400">FEFY</h3><p className="text-gray-300 mt-4">📘

FEFY

WHITEPAPER

Version 1.0

Nature Intelligence
for the Future of Web3

2026</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>
         {/* UTILITIES */}
        <section className="py-28 px-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-20"><p className="text-green-400 tracking-[5px] text-xl mb-5">TOKEN UTILITIES</p><h2 className="text-5xl md:text-7xl font-extrabold">Ecosystem Utilities</h2></div>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-10">
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center hover:border-green-500 transition-all"><div className="text-6xl mb-8">⚡</div><h3 className="text-3xl font-bold mb-6 text-green-400">Energy Vision</h3><p className="text-gray-300 text-lg leading-relaxed">Inspired by clean energy systems and sustainable digital innovation.</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center hover:border-green-500 transition-all"><div className="text-6xl mb-8">🔒</div><h3 className="text-3xl font-bold mb-6 text-green-400">Staking</h3><p className="text-gray-300 text-lg leading-relaxed">Future staking system for passive rewards.</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center hover:border-green-500 transition-all"><div className="text-6xl mb-8">🌍</div><h3 className="text-3xl font-bold mb-6 text-green-400">Global Community</h3><p className="text-gray-300 text-lg leading-relaxed">Building an international community around green finance.</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center hover:border-green-500 transition-all"><div className="text-6xl mb-8">🚀</div><h3 className="text-3xl font-bold mb-6 text-green-400">Future Expansion</h3><p className="text-gray-300 text-lg leading-relaxed">NFTs, AI tools and utility platforms.</p></div>
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section className="py-28 px-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-20"><p className="text-green-400 tracking-[5px] text-xl mb-5">CORE TEAM</p><h2 className="text-5xl md:text-7xl font-extrabold">The Visionaries</h2></div>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-10">
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center hover:border-green-500 transition-all"><div className="w-32 h-32 rounded-full bg-gradient-to-b from-green-500 to-black mx-auto mb-8" /><h3 className="text-3xl font-bold mb-3 text-green-400">Founder</h3><p className="text-gray-400 text-lg">Vision & Strategy</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center hover:border-green-500 transition-all"><div className="w-32 h-32 rounded-full bg-gradient-to-b from-green-500 to-black mx-auto mb-8" /><h3 className="text-3xl font-bold mb-3 text-green-400">Blockchain Dev</h3><p className="text-gray-400 text-lg">Smart Contracts</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center hover:border-green-500 transition-all"><div className="w-32 h-32 rounded-full bg-gradient-to-b from-green-500 to-black mx-auto mb-8" /><h3 className="text-3xl font-bold mb-3 text-green-400">Marketing Lead</h3><p className="text-gray-400 text-lg">Community Growth</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center hover:border-green-500 transition-all"><div className="w-32 h-32 rounded-full bg-gradient-to-b from-green-500 to-black mx-auto mb-8" /><h3 className="text-3xl font-bold mb-3 text-green-400">Ecosystem Lead</h3><p className="text-gray-400 text-lg">Expansion & Utility</p></div>
            </div>
          </div>
        </section>

        {/* PRESALE PROGRESS */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto bg-[#111111] border border-green-500/20 rounded-3xl p-10">
            <h2 className="text-4xl font-black text-center text-green-400 mb-10">Presale Progress</h2>
            <div className="w-full h-8 bg-black rounded-full overflow-hidden"><div className="h-full bg-green-400 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
            <div className="mt-6 flex justify-between text-gray-300 font-bold"><span>Raised: {bnbRaised} BNB</span><span>Hard Cap: {HARD_CAP} BNB</span></div>
            <div className="mt-6 text-center text-green-400 font-black text-xl">{bnbRaised >= SOFT_CAP ? "SOFT CAP REACHED" : "SOFT CAP IN PROGRESS"}</div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-28 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-20"><p className="text-green-400 tracking-[5px] text-xl mb-5">FAQ</p><h2 className="text-5xl md:text-7xl font-extrabold">Frequently Asked Questions</h2></div>
            <div className="space-y-8">
              <div className="bg-[#0d2017] border border-green-500/20 rounded-3xl p-8"><h3 className="text-2xl font-bold text-green-400 mb-4">What is FEFY Token?</h3><p className="text-gray-300 text-lg leading-relaxed">FEFY is a clean-energy inspired crypto ecosystem focused on innovation, sustainability and future blockchain utilities.</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-3xl p-8"><h3 className="text-2xl font-bold text-green-400 mb-4">How can I buy FEFY?</h3><p className="text-gray-300 text-lg leading-relaxed">Connect your wallet, enter your BNB amount and purchase directly through the presale section.</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-3xl p-8"><h3 className="text-2xl font-bold text-green-400 mb-4">Is the smart contract secure?</h3><p className="text-gray-300 text-lg leading-relaxed">The smart contract architecture is designed for transparency, decentralization and future audits.</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-3xl p-8"><h3 className="text-2xl font-bold text-green-400 mb-4">What are the future plans?</h3><p className="text-gray-300 text-lg leading-relaxed">Expansion plans include staking, exchange listings, NFT utilities, partnerships and ecosystem growth.</p></div>
            </div>
          </div>
        </section>

        {/* LIVE BUYS */}
        <section className="py-20 px-6">
          <h2 className="text-5xl font-bold text-center text-green-400 mb-14">LIVE BUYS</h2>
          <div className="max-w-[900px] mx-auto space-y-5">
            {liveBuys.map((buy, index) => (
              <div key={index} className="bg-[#08140f] border border-green-500/30 rounded-2xl p-6 flex flex-col md:flex-row gap-2 items-center justify-between text-xl backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,120,0.08)]">
                <div className="text-gray-300">{buy.wallet}</div>
                <div className="text-green-400 font-bold">bought {buy.amount} BNB</div>
              </div>
            ))}
          </div>
        </section>

        {/* SECURITY */}
        <section className="py-28 px-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-center mb-20"><p className="text-green-400 tracking-[5px] text-xl mb-5">TRUST & SECURITY</p><h2 className="text-5xl md:text-7xl font-extrabold">Safe & Transparent</h2></div>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-10">
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center"><div className="text-6xl mb-6">🔒</div><h3 className="text-3xl font-bold text-green-400 mb-4">Secure Contract</h3><p className="text-gray-400 text-lg leading-relaxed">Smart contract built with transparency and security standards.</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center"><div className="text-6xl mb-6">🌍</div><h3 className="text-3xl font-bold text-green-400 mb-4">Community Driven</h3><p className="text-gray-400 text-lg leading-relaxed">FEFY grows together with its global community.</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center"><div className="text-6xl mb-6">📈</div><h3 className="text-3xl font-bold text-green-400 mb-4">Long-Term Vision</h3><p className="text-gray-400 text-lg leading-relaxed">Focused on sustainable ecosystem growth.</p></div>
              <div className="bg-[#0d2017] border border-green-500/20 rounded-[35px] p-10 text-center"><div className="text-6xl mb-6">⚡</div><h3 className="text-3xl font-bold text-green-400 mb-4">Green Innovation</h3><p className="text-gray-400 text-lg leading-relaxed">Inspired by clean energy concepts.</p></div>
            </div>
          </div>
        </section>

        
        <section className="py-32 px-6">
          <div className="max-w-[1400px] mx-auto bg-gradient-to-r from-[#0d2017] to-[#123524] border border-green-500/20 rounded-[45px] p-16 text-center relative overflow-hidden">
            <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[140px] rounded-full top-[-200px] left-[-150px]" />
            <div className="absolute w-[500px] h-[500px] bg-green-500/10 blur-[140px] rounded-full bottom-[-200px] right-[-150px]" />
            <div className="relative z-10">
              <p className="text-green-400 tracking-[5px] text-xl mb-6">JOIN THE MOVEMENT</p>
              <h2 className="text-5xl md:text-7xl font-extrabold leading-tight mb-10">The Future Of<span className="text-green-400"> Clean Energy Crypto</span></h2>
              <p className="text-gray-300 text-xl max-w-[900px] mx-auto leading-relaxed mb-14">FEFY TOKEN combines meme culture, clean energy inspiration and community-driven innovation into one powerful ecosystem.</p>
              
              
              <button 
                onClick={scrollToBuySection} 
                disabled={wrongNetwork} 
                className="bg-green-500 hover:bg-green-400 text-black font-extrabold px-16 py-6 rounded-3xl text-3xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,255,120,0.35)] disabled:opacity-50 disabled:cursor-not-allowed duration-300"
              >
                BUY FEFY NOW 🚀
              </button>
              
              <div className="mb-10 mt-10 bg-[#08140f] border border-green-500/30 rounded-3xl px-10 py-8 shadow-[0_0_40px_rgba(0,255,120,0.12)]">
                <h3 className="text-green-400 text-2xl font-bold mb-5 tracking-widest">PRESALE ENDS IN</h3>
                <div className="flex justify-center gap-6 text-4xl font-extrabold text-white"><div>{timeLeft.days}D</div><div>{timeLeft.hours}H</div><div>{timeLeft.minutes}M</div><div>{timeLeft.seconds}S</div></div>
              </div>
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-5 w-full">
                <div className="bg-[#08140f] border border-green-500/20 rounded-2xl py-4 text-center text-green-400 font-bold text-lg">✅ AUDITED</div>
                <div className="bg-[#08140f] border border-green-500/20 rounded-2xl py-4 text-center text-green-400 font-bold text-lg">🔒 LP LOCKED</div>
                <div className="bg-[#08140f] border border-green-500/20 rounded-2xl py-4 text-center text-green-400 font-bold text-lg">🌱 ECO MEME</div>
                <div className="bg-[#08140f] border border-green-500/20 rounded-2xl py-4 text-center text-green-400 font-bold text-lg">🚀 BSC READY</div>
              </div>
            </div>
          </div>
        </section>

        {isOwner && (
          <section className="py-16 px-6">
            <div className="max-w-4xl mx-auto bg-red-950 border border-red-500/30 rounded-3xl p-8">
              <h2 className="text-3xl font-black text-red-400 mb-8">ADMIN PANEL</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={pausePresale} className="py-4 rounded-2xl bg-red-500 text-white font-black">Pause Presale</button>
                <button onClick={unpausePresale} className="py-4 rounded-2xl bg-green-500 text-black font-black">Unpause Presale</button>
                <button onClick={checkPresaleBalance} className="py-4 rounded-2xl bg-yellow-500 text-black font-black">Check Presale Balance</button>
                <button onClick={checkHardCap} className="py-4 rounded-2xl bg-purple-500 text-white font-black">Check Hard Cap</button>
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="border-t border-green-500/20 bg-[#04150f] mt-24 py-16 px-6">
          <div className="max-w-[1400px] mx-auto grid md:grid-cols-3 gap-12 items-center">
            <div><h2 className="text-4xl font-extrabold text-green-400 mb-4">FEFY TOKEN</h2><p className="text-gray-400 leading-relaxed text-lg">Inspired by Nature 🌱<br />Powered by Clean Energy Theory ⚡</p></div>
            <div className="flex justify-center md:justify-end gap-5 flex-wrap">
              <a href="#" className="bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-2xl hover:bg-green-500 hover:text-black transition-all font-semibold">Telegram</a>
              <a href="#" className="bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-2xl hover:bg-green-500 hover:text-black transition-all font-semibold">X / Twitter</a>
            </div>
          </div>
          <div className="text-center text-gray-500 mt-14 text-sm border-t border-green-500/10 pt-8">© 2026 FEFY TOKEN — All Rights Reserved</div>
        </footer>

        {/* SUCCESS MODAL */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#08140f] border border-green-500 rounded-3xl p-12 max-w-[500px] w-[90%] text-center shadow-[0_0_60px_rgba(0,255,120,0.35)] animate-pulse">
              <h2 className="text-5xl font-bold text-green-400 mb-6">PURCHASE SUCCESSFUL 🚀</h2>
              <p className="text-2xl text-gray-300 mb-8">Your FEFY tokens were purchased successfully.</p>
              <button onClick={() => setShowSuccess(false)} className="bg-green-500 hover:bg-green-400 text-black font-bold px-10 py-4 rounded-2xl text-2xl transition-all hover:scale-105">AWESOME 🔥</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}