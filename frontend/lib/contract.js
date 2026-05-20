import { ethers } from "ethers";

export const CONTRACT_ADDRESS =
  "0xA153361792754f3C868387b5ef3182db71952701";

export const ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

export async function getContract() {

  if (!(window).ethereum) {
    alert("Install Rabby Wallet");
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