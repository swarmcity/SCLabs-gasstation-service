var express = require('express');
var app = express();
var cors = require('cors');
var Web3 = require('web3');
var HookedWeb3Provider = require("hooked-web3-provider");
var EthJStx = require("ethereumjs-tx");
var lightwallet = require("eth-lightwallet");
var config = require('./config.json');

var keystore = JSON.stringify(require("./wallet.json"));

var secretSeed = lightwallet.keystore.generateRandomSeed();

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
var web3;

var nextdrip;



lightwallet.keystore.deriveKeyFromPassword("test", function(err, pwDerivedKey) {

	lightwallet.upgrade.upgradeOldSerialized(keystore, "testing", function(err, b) {

		var keystore = new lightwallet.keystore.deserialize(b);

		console.log('connecting to ETH node: ', config.web3.host);

		var web3Provider = new HookedWeb3Provider({
			host: config.web3.host,
			transaction_signer: keystore
		});

		web3 = new Web3();
		web3.setProvider(web3Provider);

		keystore.passwordProvider = function(callback) {
			callback(null, "testing");
		};

		console.log("Wallet initted addr=" + keystore.getAddresses()[0]);

		account = fixaddress(keystore.getAddresses()[0]);

		// start webserver...
		app.listen(config.httpport, function() {
			console.log('Fawcet listening on port ', config.httpport);
		});
	});
});


function getTimeStamp() {
	return Math.floor(new Date().getTime() / 1000);
}

// Get faucet balance in ether ( or other denomination if given )
function getFaucetBalance(denomination) {
	return parseFloat(web3.fromWei(web3.eth.getBalance(account).toNumber(), denomination || 'ether'));
}

app.use(cors());

// // polymer app is served from here
// app.use(express.static('static/locals-faucet/dist'));

// get current faucet info
app.get('/price', function(req, res) {
	res.status(200).json({
		exchangerate: 100
	});
});

app.get('/fill', function(req, res) {

	var tx = "{"type":"Buffer","data":[248,168,1,131,15,66,64,131,3,208,144,148,185,231,248,86,142,8,213,101,159,93,41,196,153,113,115,216,76,223,38,7,128,184,68,9,94,167,179,0,0,0,0,0,0,0,0,0,0,0,0,246,147,221,142,45,98,58,201,109,142,103,107,114,175,249,67,73,44,214,204,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,27,160,131,187,47,19,233,152,250,29,99,116,55,238,205,94,221,231,241,114,215,226,104,104,183,189,84,172,49,48,189,179,239,49,160,9,145,23,106,128,190,199,196,34,92,187,143,19,86,75,155,45,116,161,149,216,14,17,10,212,81,239,103,219,254,122,40]}";

	tx = JSON.parse(tx);

	EthJStx

	console.log('hallo');
	console.log(req);
		res.status(200).json({
			msg: 'address added to blacklist'
		});
});

// // add our address to the donation queue
// app.get('/donate/:address', function(req, res) {
// 	console.log('push');

// 	var address = fixaddress(req.params.address);
// 	if (isAddress(address)) {
// 		blacklist.child(address).once('value', function(snapshot) {
// 			// blacklisted ?
// 			var exists = (snapshot.val() !== null);
// 			if (exists) {
// 				return res.status(200).json({
// 					paydate: 0,
// 					address: address,
// 					amount: 0
// 				});
// 			}


// 			var queuetasks = queueRef.child('tasks');
// 			queuetasks.once('value', function(snap) {

// 				// first time
// 				if (!nextdrip) {
// 					nextdrip = getTimeStamp();
// 				}

// 				var queueitem = {
// 					paydate: nextdrip,
// 					address: address,
// 					amount: 1 * 1e18
// 				};

// 				var list = snap.val();

// 				if (list) {

// 					var length = Object.keys(list).length;

// 					if (length >= config.queuesize) {
// 						// queue is full - reject request
// 						return res.status(403).json({
// 							msg: 'queue is full'
// 						});
// 					}
// 				}

// 				queuetasks.push(queueitem);
// 				nextdrip += config.payoutfrequencyinsec;
// 				return res.status(200).json(queueitem);

// 			});

// 		});



// 	} else {
// 		return res.status(400).json({
// 			message: 'the address is invalid'
// 		});

// 	}



// });

// function donate(to, cb) {

// 	web3.eth.getGasPrice(function(err, result) {

// 		var gasPrice = result.toNumber(10);
// 		console.log('gasprice is ', gasPrice);

// 		var amount = config.payoutamountinether * 1e18;
// 		console.log("Transferring ", amount, "wei from", account, 'to', to);

// 		var options = {
// 			from: account,
// 			to: to,
// 			value: amount,
// 			gas: 314150,
// 			gasPrice: gasPrice,
// 		};
// 		console.log(options);
// 		web3.eth.sendTransaction(options, function(err, result) {

// 			if (err != null) {
// 				console.log(err);
// 				console.log("ERROR: Transaction didn't go through. See console.");
// 			} else {
// 				console.log("Transaction Successful!");
// 				console.log(result);
// 			}

// 			return cb(err, result);


// 		});
// 	});
// }