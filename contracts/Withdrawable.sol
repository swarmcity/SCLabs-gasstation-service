pragma solidity ^0.4.8;


/*
 * Withdrawable
 *
 * Base contract with an Withdrawer.
 * Provides onlyWithdrawer modifier, which prevents function from running if it is called by anyone other than the Withdrawer.
 */
contract Withdrawable {
  address public withdrawer;

  function Withdrawable() {
    withdrawer = msg.sender;
  }

  modifier onlyWithdrawer() {
    require(msg.sender == Withdrawer);
    _;
  }

  function transferWithdrawership(address newWithdrawer) onlyWithdrawer {
    if (newWithdrawer != address(0)) {
      withdrawer = newWithdrawer;
    }
  }

}
