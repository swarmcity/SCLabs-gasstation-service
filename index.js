var express = require('express');
var app = express();
var cors = require('cors');
var Web3 = require('web3');
var HookedWeb3Provider = require("hooked-web3-provider");
var EthJStx = require("ethereumjs-tx");
var lightwallet = require("eth-lightwallet");
var config = require('./config.json');
const sha256 = require('js-sha256').sha256;

var keystore = JSON.stringify(require("./wallet.json"));

var secretSeed = lightwallet.keystore.generateRandomSeed();

var utility = require('./utility.js')();

// check for valid Eth address
function isAddress(address) {
	return /^(0x)?[0-9a-f]{40}$/i.test(address);
};

// Add 0x to address 
function fixaddress(address) {
	// Strip all spaces
	address = address.replace(' ', '');

	//console.log("Fix address", address);
	if (!strStartsWith(address, '0x')) {
		return ('0x' + address);
	}
	return address;
}

function strStartsWith(str, prefix) {
	return str.indexOf(prefix) === 0;
}

var account;
var account_privatekey;
var pwderivedkey;
var web3;

lightwallet.keystore.deriveKeyFromPassword("testing", function(err, pwDerivedKey) {
	pwderivedkey = pwDerivedKey;
	lightwallet.upgrade.upgradeOldSerialized(keystore, "testing", function(err, b) {

		var keystore = new lightwallet.keystore.deserialize(b);

		console.log('connecting to ETH node: ', config.web3.host);

		var web3Provider = new HookedWeb3Provider({
			host: config.web3.host,
			transaction_signer: keystore
		});

		//var web3Provider = new Web3.providers.HttpProvider(config.web3.host);

		web3 = new Web3();
		web3.setProvider(web3Provider);

		keystore.passwordProvider = function(callback) {
			callback(null, "testing");
		};

		console.log("Wallet initted addr=" + keystore.getAddresses()[0]);

		account = fixaddress(keystore.getAddresses()[0]);
        account_privatekey = keystore.exportPrivateKey(account, pwderivedkey);

 		const condensed = utility.pack(
          [
            account, //'this.config.contractEtherDeltaAddr,
            0, //tokenGet,
            1, //amountGet,
            0, //tokenGive,
            1, //amountGive,
            100, //expires,
            1// orderNonce,
          ],
          [160, 160, 256, 160, 256, 256, 256]);
        const hash = sha256(new Buffer(condensed, 'hex'));


		utility.sign(web3,account,hash,account_privatekey,function(err,signature){
			if (err){
				return console.log(err);
			}
			//console.log('OKAY=',a);

			utility.verify(web3, account, signature.v, signature.r, signature.s, hash, function(err, res) {
				console.log('verify result=', res);
				//done();
			});

		});

//web3, address, msgToSignIn, privateKeyIn, callback


		// start webserver...
		app.listen(config.httpport, function() {
			console.log('Fawcet listening on port ', config.httpport);
		});
	}.bind(this));
});


function getTimeStamp() {
	return Math.floor(new Date().getTime() / 1000);
}

// Get faucet balance in ether ( or other denomination if given )
function getFaucetBalance(denomination) {
	return parseFloat(web3.fromWei(web3.eth.getBalance(account).toNumber(), denomination || 'ether'));
}

app.use(cors());

app.get('/price', function(req, res) {
	res.status(200).json({
		exchangerate: 100
	});
});

app.get('/fill', function(req, res) {

	var tx = [248,168,1,131,15,66,64,131,3,208,144,148,185,231,248,86,142,8,213,101,159,93,41,196,153,113,115,216,76,223,38,7,128,184,68,9,94,167,179,0,0,0,0,0,0,0,0,0,0,0,0,246,147,221,142,45,98,58,201,109,142,103,107,114,175,249,67,73,44,214,204,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,27,160,131,187,47,19,233,152,250,29,99,116,55,238,205,94,221,231,241,114,215,226,104,104,183,189,84,172,49,48,189,179,239,49,160,9,145,23,106,128,190,199,196,34,92,187,143,19,86,75,155,45,116,161,149,216,14,17,10,212,81,239,103,219,254,122,40];

//	tx = JSON.parse(tx);

	//EthJStx

	console.log('hallo');
	console.log(req);
		res.status(200).json({
			msg: 'address added to blacklist'
		});
});
