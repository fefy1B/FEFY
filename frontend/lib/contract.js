import { ethers } from "ethers";

export const CONTRACT_ADDRESS =
  "0xC26166825088453ce44537239cE90601b515F92f";

export const ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

export async function getContract() {

  if (!(window).ethereum) {
    alert("Install a Web3 Wallet");
    return null;
  }

  const provider = new ethers.BrowserProvider(
    (window).ethereum
  );

  const signer = await provider.getSigner();

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ABI,
    signer
  );

  return contract;
}