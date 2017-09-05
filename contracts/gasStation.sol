pragma solidity ^0.4.11;

import './IMiniMeToken.sol';
import '../installed_contracts/zeppelin/contracts/ownership/Ownable.sol';


contract gasStation is Ownable {

	// the ERC20 token that we'll use
	IMiniMeToken token;
	
	// track used fillup hashes
	mapping(bytes32=>bool) usedhashes;

	// constructor
	// _tokenAddress = the ERC20 token to be used.
	function gasStation(address _tokenAddress) payable {
		token = IMiniMeToken(_tokenAddress);
	}

	function fillup(uint price,uint valid_until,uint random,uint upfront,uint amount,uint8 v, bytes32 r, bytes32 s){
		require(token.transferFrom(msg.sender,this,amount));

	    bytes32 hash = sha256(price,msg.sender,this, valid_until,random,upfront);
	    require (
			!usedhashes[hash] 
			&& (ecrecover(hash,v,r,s) == owner) 
			&& block.number <= valid_until
	    );

		msg.sender.transfer(amount * price - upfront);

		// invalidate this hash
		usedhashes[hash] = true;
	}

	function withdraw()

}
	
