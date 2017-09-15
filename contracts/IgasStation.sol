pragma solidity ^0.4.11;

contract IgasStation {

  // inherited
  function owner() public constant returns(address);
  function transferOwnership(address newOwner);

  function tokenreceiver() public constant returns(address);
  function pullfill(address _token_address, uint _valid_until,uint _random,uint _take ,uint _give,uint8 _v, bytes32 _r, bytes32 _s);
  function pushfill(address _token_address, uint _valid_until,uint _random,uint _take ,uint _give,address to, uint8 _v, bytes32 _r, bytes32 _s);
  function changeTokenReceiver(address _newTokenReceiver);
  function withdrawETH(address to);
}
