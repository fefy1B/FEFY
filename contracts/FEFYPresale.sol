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

    uint256 public rate = 1000;

    uint256 public totalSold;

    constructor(
        address tokenAddress
    )
        Ownable(msg.sender)
    {
        token =
            IERC20(tokenAddress);
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
            "Send ETH"
        );

        uint256 tokenAmount =
            msg.value * rate;

        totalSold += tokenAmount;

        token.transfer(
            msg.sender,
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
        public
        onlyOwner
    {
        rate = newRate;
    }

    function pauseSale()
        public
        onlyOwner
    {
        _pause();
    }

    function resumeSale()
        public
        onlyOwner
    {
        _unpause();
    }

    function withdrawETH()
        public
        onlyOwner
    {
        payable(owner()).transfer(
            address(this).balance
        );
    }
}