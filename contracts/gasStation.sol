pragma solidity ^0.4.11;

import './IMiniMeToken.sol';
import '../installed_contracts/zeppelin/contracts/ownership/Ownable.sol';


contract gasStation is Ownable {

	IMiniMeToken token;
	uint public exchangerate_mul;
	uint public exchangerate_div;
	uint public triggercost;

	mapping(address=>bool) whitelist;

	// constructor
	// declare the ERC20 token to be used.
	function gasStation(address _tokenAddress, uint _mul, uint _div, uint _triggerCost){
		token = IMiniMeToken(_tokenAddress);
		addAllowedCaller(msg.sender);
		setExchangeRate(_mul,_div);
		setTriggerCost(_triggerCost);
	}

	function addAllowedCaller(address _caller) onlyOwner {
		whitelist[_caller] = true;
	}

	function setExchangeRate(uint _mul,uint _div) onlyOwner {
		exchangerate_mul = _mul;
		exchangerate_div = _div;
	}

	// triggercost is the 
	function setTriggerCost(uint _triggerCost) onlyOwner{
		triggercost = _triggerCost;
	}

	function fillMeUp(address _receiver, uint _tokens){
		// only whitelisted addresses can trigger this function
		if (whitelist[msg.sender] != true){
			throw;
		}
		// calculate how much Wei to send
		uint amount = _tokens * exchangerate_mul / exchangerate_div;
		if (amount < triggercost) { throw; }
		if (this.balance < amount) {
			// gas tank is empty
			throw;
		}

		// get the tokens from the receiver
		if (!token.transferFrom(_receiver,this,_tokens)){
			throw;
		}

		// send equivalent in gas - minus the cost for executing this function
		_receiver.transfer(amount - triggercost);

	}

}
	
