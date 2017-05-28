pragma solidity ^0.4.11;

import './IMiniMeToken.sol';
import '../installed_contracts/zeppelin/contracts/ownership/Ownable.sol';


contract gasStation is Ownable {

	// the ERC20 token that we'll use
	IMiniMeToken token;
	// fixed point arithmetic to calculate token unit / wei ratio
	uint public exchangerate_numerator;
	uint public exchangerate_denominator;

	// the gas cost in Wei to trigger the exchange function (fillMeUp)
	// this amount will be deducted from the gas sent.
	uint public triggercost;

	// a whitelist of pubkeys that can trigger the fillMeUp function
	mapping(address=>bool) whitelist;

	// constructor
	// _tokenAddress = the ERC20 token to be used.
	// _numerator = the numerator of the fraction for the exchange rate
	// _denominator = the denominator of the fraction for the exchange rate
	// _triggerCost = Wei deducted for calling the exchange function
	function gasStation(address _tokenAddress, uint _numerator, uint _denominator, uint _triggerCost){
		token = IMiniMeToken(_tokenAddress);
		addAllowedCaller(msg.sender);
		setExchangeRate(_numerator,_denominator);
		setTriggerCost(_triggerCost);
	}

	// add an address to the list allowed to call the exchange function
	function addAllowedCaller(address _caller) onlyOwner {
		whitelist[_caller] = true;
	}

	// set the exchange rate. 
	// Only the owner of this contract can perform this
	function setExchangeRate(uint _numerator,uint _denominator) onlyOwner {
		exchangerate_numerator = _numerator;
		exchangerate_denominator = _denominator;
	}

	// Update the triggercost
	// Only the owner of this contract can perform this
	function setTriggerCost(uint _triggerCost) onlyOwner{
		triggercost = _triggerCost;
	}

	// empty the cash register.
	// Only the owner of this contract can perform this
	function emptyRegister(address _to) onlyOwner{
		token.transfer(_to,token.balanceOf(this));
	}

	// the actual exchange function.
	// - calculate the amount of Wei we need to send.
	// - do some sanity checks
	// - get _tokens amount of ERC20 tokens
	// - send wei to _receiver
	// 
	function fillMeUp(address _receiver, uint _tokens){
		// only whitelisted addresses can trigger this function
		if (whitelist[msg.sender] != true){
			throw;
		}
		// calculate how much Wei to send
		uint amount = _tokens * exchangerate_numerator / exchangerate_denominator;
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
	
