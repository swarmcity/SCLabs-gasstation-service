var express = require('express');
var app = express();
var cors = require('cors');
var Web3 = require('web3');
var HookedWeb3Provider = require("hooked-web3-provider");
var EthJStx = require("ethereumjs-tx");
var ethUtil = require('ethereumjs-util');
var lightwallet = require("eth-lightwallet");
var config = require('./config.json');
const sha256 = require('js-sha256').sha256;
var cache = require('memory-cache');
var request = require('request');

//var keystore = JSON.stringify(require("./wallet.json"));


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

password = '1234';

// process.env.privatekey
// process.env.markup
// process.env.blockvalidity


lightwallet.keystore.deriveKeyFromPassword(password, function(err, pwDerivedKey) {

	var seed = 'unhappy nerve cancel reject october fix vital pulse cash behind curious bicycle';
	var ks = new lightwallet.keystore(seed, pwDerivedKey);

	ks.importPrivateKey(process.env.privatekey, pwDerivedKey);

	var addr = ks.getAddresses();

	console.log(addr);

	var web3Provider = new HookedWeb3Provider({
		host: config.web3.host,
		transaction_signer: ks
	});

	ks.passwordProvider = function(callback) {
		callback(null, password);
	};

	console.log("Wallet initted addr=" + ks.getAddresses()[0]);

	// start webserver...
	app.listen(config.httpport, function() {
		console.log('server listening on port ', config.httpport);
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

function getprice(token, cb) {

	var cachekey = 'price-' + token;

	var r = cache.get(cachekey);
	if (r) {
		cb(null, r);
		//		res.status(200).json(r);
	} else {
		request('https://api.coinmarketcap.com/v1/ticker/'+token+'/?convert=ETH', function(error, response, body) {

			if (error && (response || response.statusCode !== 200)) {
				return cb(error);
			}

			var p = JSON.parse(body);

			cache.put(cachekey, [Object.assign({}, p[0], {
				cached_at: new Date()
			})], 60 * 1000);

			cb(null,p);
		});
	}



}

app.get('/price', function(req, res) {


	getprice('swarm-city', function(error, p) {

		if (error) {
			return res.status(500).json({
				error: error
			});
		}

		var random = Math.floor(Math.random() * 10000);

		const condensed = utility.pack(
			[
				random
			], [256]);
		const hash = sha256(new Buffer(condensed, 'hex'));



		const sig = ethUtil.ecsign(
			new Buffer(hash, 'hex'),
			new Buffer(process.env.privatekey, 'hex'));
		const r = `0x${sig.r.toString('hex')}`;
		const s = `0x${sig.s.toString('hex')}`;
		const v = sig.v;
		const result = {
			r,
			s,
			v
		};


		var resp = {
			price: p[0].price_eth * 1e18,
			input: random,
			sig: result
		};
		//EthJStx


		res.status(200).json(resp);


	});


});


function pack(dataIn, lengths) {
	let packed = '';
	const data = dataIn.map(x => x);
	for (let i = 0; i < lengths.length; i += 1) {
		if (typeof(data[i]) === 'string' && data[i].substring(0, 2) === '0x') {
			if (data[i].substring(0, 2) === '0x') data[i] = data[i].substring(2);
			packed += utility.zeroPad(data[i], lengths[i] / 4);
		} else if (typeof(data[i]) !== 'number' && /[a-f]/.test(data[i])) {
			if (data[i].substring(0, 2) === '0x') data[i] = data[i].substring(2);
			packed += utility.zeroPad(data[i], lengths[i] / 4);
		} else {
			// packed += zeroPad(new BigNumber(data[i]).toString(16), lengths[i]/4);
			packed += utility.zeroPad(utility.decToHex(data[i], lengths[i]), lengths[i] / 4);
		}
	}
	return packed;
}

app.get('/fill', function(req, res) {

	//	var tx = [248,168,1,131,15,66,64,131,3,208,144,148,185,231,248,86,142,8,213,101,159,93,41,196,153,113,115,216,76,223,38,7,128,184,68,9,94,167,179,0,0,0,0,0,0,0,0,0,0,0,0,246,147,221,142,45,98,58,201,109,142,103,107,114,175,249,67,73,44,214,204,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,27,160,131,187,47,19,233,152,250,29,99,116,55,238,205,94,221,231,241,114,215,226,104,104,183,189,84,172,49,48,189,179,239,49,160,9,145,23,106,128,190,199,196,34,92,187,143,19,86,75,155,45,116,161,149,216,14,17,10,212,81,239,103,219,254,122,40];

	//	tx = JSON.parse(tx);

	//EthJStx

	console.log('hallo');
	console.log(req);
	res.status(200).json({
		msg: 'address added to blacklist'
	});
});