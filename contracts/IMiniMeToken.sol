pragma solidity ^0.4.8;

contract IMiniMeToken {
	function transfer(address _to, uint256 _amount) returns (bool success);
	function transferFrom(address _from, address _to, uint256 _amount) returns (bool success);
	function balanceOf(address _owner) constant returns (uint256 balance);
	function approve(address _spender, uint256 _amount) returns (bool success);
	function allowance(address _owner, address _spender) returns (uint256 remaining);
}