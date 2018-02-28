pragma solidity ^0.4.11;

import './IMiniMeToken.sol';
import './Ownable.sol';

contract gasStation is Ownable {

	// track used fillup hashes
	mapping(bytes32=>bool) usedhashes;

	address public tokenreceiver;
	address public franchisee;

	event NewHash(bytes32 h,address token_address, address gastankaddress, uint take, uint give, uint valid, uint random);

	// constructor
	function gasStation(address _tokenreceiver, address _franchisee) payable {

		tokenreceiver = _tokenreceiver;
		franchisee = _franchisee;

	}

	// default function
	function() payable {}

	// exchange by client ( hash signed by gasstation )
	function pullFill(address _token_address, uint _valid_until, uint _random, uint _take, uint _give, uint8 _v, bytes32 _r, bytes32 _s, address gastankclient){

	  bytes32 hash = sha256(_token_address, this, gastankclient, _take,_give, _valid_until, _random);

		NewHash(hash, _token_address, this, _take, _give, _valid_until, _random);

		require (
			usedhashes[hash] != true
			&& (ecrecover(hash, _v, _r, _s) == owner)
			&& block.number <= _valid_until
		);

		// claim tokens
		IMiniMeToken token = IMiniMeToken(_token_address);

		require(token.transferFrom(gastankclient,tokenreceiver,_give));

		// send ETH (gas)
		gastankclient.transfer(_take);

		// invalidate this deal's hash
		usedhashes[hash] = true;

	}

	// exchange by server ( hash signed by client )
	function pushFill(address _token_address, uint _valid_until, uint _random, uint _take, uint _give, address gastankclient, uint8 _v, bytes32 _r, bytes32 _s) onlyOwner {

		bytes32 hash = sha256(_token_address, this, gastankclient, _take, _give, _valid_until, _random);

		NewHash(hash, _token_address, this, _take, _give, _valid_until, _random);

		require (
			usedhashes[hash] != true
			&&
			(ecrecover(hash, _v, _r, _s) == gastankclient)
			&& block.number <= _valid_until
		);

		// claim tokens
		IMiniMeToken token = IMiniMeToken(_token_address);

		require(token.transferFrom(gastankclient, tokenreceiver, _give));

		// send ETH (gas)
		gastankclient.transfer(_take);

		// invalidate this deal's hash
		usedhashes[hash] = true;

	}

	function changeTokenReceiver(address _newTokenReceiver) onlyOwner {
		tokenreceiver = _newTokenReceiver;
	}

	function changeFranchisee(address _franchisee) onlyOwner {
		franchisee = _franchisee;
	}

	function withdrawETH() {
		require(msg.sender == franchisee);
		require(franchisee.send(this.balance));
	}

}
