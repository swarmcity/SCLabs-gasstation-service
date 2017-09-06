var express = require('express');
var bodyparser = require('body-parser');
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
require('dotenv').config();


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

    web3 = new Web3(web3Provider);

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
app.use(express.static('./frontend'));
app.use(bodyparser.json());

function getprice(token, cb) {

	var cachekey = 'price-' + token;

	var r = cache.get(cachekey);
	if (r) {
		cb(null, r);
	} else {
		request('https://api.coinmarketcap.com/v1/ticker/' + token + '/?convert=ETH', function(error, response, body) {
			if (error && (response || response.statusCode !== 200)) {
				return cb(error);
			}
			var p = JSON.parse(body);
			cache.put(cachekey, [Object.assign({}, p[0], {
				cached_at: new Date()
			})], 60 * 1000);
			cb(null, p);
		});
	}
}

app.get('/price', function(req, res) {

	var tokensymbol;

	switch(req.query.tokenaddress){
		case '0x528bcefc62fab000a82d2360fd20ddcda3e7dd00': // testRPC
			tokensymbol = 'swarm-city';
			break;
		default:
			return res.status(500).json({
				error: 'unknown token address ' + req.query.tokenaddress
			});
			break;
	}

	getprice(tokensymbol, function(error, p) {
		if (error) {
			return res.status(500).json({
				error: error
			});
		}

		web3.eth.getBlockNumber(function(error, blockNumber) {

			var to= process.env.gastankaddress;
			var valid_until = blockNumber + 5;
			var from = req.query.from;
			var price = p[0].price_eth * 1e18;
			var random = Math.floor(Math.random() * 10000000);
			var upfront = 2000;

			const condensed = utility.pack(
				[
					req.query.tokenaddress,
					price,
					from,
					to,
					valid_until,
					random,
					upfront
				], [160,256,160,160, 256, 256, 256]);
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
				token_address : req.query.tokenaddress,
				price: price,
				from: from,
				to: to,
				valid_until: blockNumber,
				random: random,
				upfront: upfront,
				sig: result
			};
			res.status(200).json(resp);
		}.bind(this));
	}.bind(this));
});

app.post('/fillup', function(req, res) {
	console.log('hallo');
	console.log(req.body);


    var decodetx = new EthJStx(req.body.tx1);
    var txGas = web3.toBigNumber('0x' + decodetx.gas.toString('hex'));
    var txGasPrice = web3.toBigNumber('0x' + decodetx.gasPrice.toString('hex'));
    var weiNeeded = txGas.mul(txGasPrice).toNumber(10);

    console.log(decodetx);
    console.log('txGas=',txGas);
    console.log('txGasPrice=',txGasPrice);
    console.log('weiNeeded=',weiNeeded);



    // web3.eth.sendRawTransaction(req.body.tx1,function(err,res){
    // 	console.log('tx sent',err,res);
    // })

	res.status(200).json({
		msg: 'sent for processing - hang in there...'
	});
});