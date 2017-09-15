pragma solidity ^0.4.11;

contract IgasStation {

  // inherited
  function owner() public constant returns(address);
  function transferOwnership(address newOwner);

  function fillup(address token_address, uint valid_until,uint random,uint take ,uint give,uint8 v, bytes32 r, bytes32 s);
  function withdrawTokens(address token_address,address to);
  function withdrawETH(address to);
}
