// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IERC20 {
    function transfer(
        address to,
        uint256 amount
    ) external returns (bool);

    function balanceOf(
        address account
    ) external view returns (uint256);
}

contract FEFYPresale is Ownable, Pausable {

    IERC20 public token;

    uint256 public rate = 600000;

    uint256 public totalSold;
    uint256 public totalRaised;

    uint256 public softCap = 100 ether;
    uint256 public hardCap = 500 ether;

    event TokensPurchased(
        address buyer,
        uint256 bnbAmount,
        uint256 tokenAmount
    );

    constructor(
        address tokenAddress
    )
        Ownable(msg.sender)
    {
        token = IERC20(tokenAddress);
    }

    receive() external payable {
        buyTokens();
    }

    function buyTokens()
        public
        payable
        whenNotPaused
    {
        require(
            msg.value > 0,
            "Send BNB"
        );

        require(
            totalRaised + msg.value <= hardCap,
            "Hard cap reached"
        );

        uint256 tokenAmount =
            msg.value * rate;

        require(
            contractTokenBalance() >= tokenAmount,
            "Not enough tokens"
        );

        totalRaised += msg.value;
        totalSold += tokenAmount;

        bool success =
            token.transfer(
                msg.sender,
                tokenAmount
            );

        require(
            success,
            "Transfer failed"
        );

        emit TokensPurchased(
            msg.sender,
            msg.value,
            tokenAmount
        );
    }

    function contractTokenBalance()
        public
        view
        returns(uint256)
    {
        return token.balanceOf(
            address(this)
        );
    }

    function contractETHBalance()
        public
        view
        returns(uint256)
    {
        return address(this).balance;
    }

    function changeRate(
        uint256 newRate
    )
        external
        onlyOwner
    {
        rate = newRate;
    }

    function pauseSale()
        external
        onlyOwner
    {
        _pause();
    }

    function resumeSale()
        external
        onlyOwner
    {
        _unpause();
    }

    function withdrawETH()
        external
        onlyOwner
    {
        payable(owner()).transfer(
            address(this).balance
        );
    }
}