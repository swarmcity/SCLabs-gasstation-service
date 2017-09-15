pragma solidity ^0.4.11;

import './IMiniMeToken.sol';
import './Ownable.sol';
import './Withdrawable.sol';


contract gasStation is Ownable,Withdrawable {
	
	// track used fillup hashes
	mapping(bytes32=>bool) usedhashes;

	// constructor
	function gasStation(address _owner,address _withdrawer) payable {
		owner = _owner;
		withdrawer = _withdrawer;
	}

	// default function
	function() payable {}

	// exchange by client ( hash signed by gasstation )
	function pullfill(address _token_address, uint _valid_until,uint _random,uint _take ,uint _give,uint8 _v, bytes32 _r, bytes32 _s){
	    bytes32 hash = sha256(_token_address,this,msg.sender,_take,_give,_valid_until,_random);

		require (
			usedhashes[hash] != true
			&& (ecrecover(hash,_v,_r,_s) == owner) 
			&& block.number <= _valid_until
		);

		// claim tokens
		IMiniMeToken token = IMiniMeToken(_token_address);
		require(token.transferFrom(msg.sender,withdrawer,_give));

		// send ETH (gas)
		msg.sender.transfer(_take);

		// invalidate this deal's hash
		usedhashes[hash] = true;
	}

	// exchange by server ( hash signed by client )
	function pushfill(address _token_address, uint _valid_until,uint _random,uint _take ,uint _give,address to, uint8 _v, bytes32 _r, bytes32 _s) onlyOwner {
		bytes32 hash = sha256(_token_address,this,to,_take,_give,_valid_until,_random);
		require (
			usedhashes[hash] != true
			&& (ecrecover(hash,_v,_r,_s) == to) 
			&& block.number <= _valid_until
		);

		// claim tokens
		IMiniMeToken token = IMiniMeToken(_token_address);
		require(token.transferFrom(to,withdrawer,_give));

		// send ETH (gas)
		to.transfer(_take);

		// invalidate this deal's hash
		usedhashes[hash] = true;		
	}

	function withdrawTokens(address _token_address,address to) onlyWithdrawer {
		IMiniMeToken token = IMiniMeToken(_token_address);
		require(token.transfer(to,token.balanceOf(this)));
	}

	function withdrawETH(address to) onlyWithdrawer {
		require(to.send(this.balance));
	}

}
	
