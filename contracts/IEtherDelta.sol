pragma solidity ^0.4.9;

contract IEtherDelta {
  function admin() public constant returns(address);
  function feeAccount() public constant returns(address);
  function accountLevelsAddr() public constant returns(address);
  function feeMake() public constant returns(uint);
  function feeTake() public constant returns(uint);
  function feeRebate() public constant returns(uint);
//  function tokens() public constant returns([object Object]);
//  function orders() public constant returns([object Object]);
//  function orderFills() public constant returns([object Object]);
  function changeAdmin(address admin_);
  function changeAccountLevelsAddr(address accountLevelsAddr_);
  function changeFeeAccount(address feeAccount_);
  function changeFeeMake(uint feeMake_);
  function changeFeeTake(uint feeTake_);
  function changeFeeRebate(uint feeRebate_);
  function deposit() payable;
  function withdraw(uint amount);
  function depositToken(address token, uint amount);
  function withdrawToken(address token, uint amount);
  function balanceOf(address token, address user) constant returns (uint);
  function order(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce);
  function trade(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s, uint amount);
  function testTrade(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s, uint amount, address sender) constant returns(bool);
  function availableVolume(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s) constant returns(uint);
  function amountFilled(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s) constant returns(uint);
  function cancelOrder(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, uint8 v, bytes32 r, bytes32 s);
}
