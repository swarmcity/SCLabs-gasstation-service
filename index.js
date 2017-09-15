var express = require('express');
var bodyparser = require('body-parser');
var app = express();
var cors = require('cors');
var Web3 = require('web3');
var HookedWeb3Provider = require("hooked-web3-provider");
var EthJStx = require("ethereumjs-tx");
var ethUtil = require("ethereumjs-util");
var lightwallet = require("eth-lightwallet");
//var config = require('./config.json');
const sha256 = require('js-sha256').sha256;
var cache = require('memory-cache');
var request = require('request');
// contracts
var gasStation = require('./build/contracts/gasStation.json');
var IMiniMeToken = require('./build/contracts/IMiniMeToken.json');

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

var gastankAccount;
var web3;

password = '1234';

lightwallet.keystore.deriveKeyFromPassword(password, function(err, pwDerivedKey) {

	var seed = 'unhappy nerve cancel reject october fix vital pulse cash behind curious bicycle';
	var ks = new lightwallet.keystore(seed, pwDerivedKey);

	console.log('importing pk ', process.env.privatekey);
	ks.importPrivateKey(process.env.privatekey, pwDerivedKey);

	gastankAccount = ethUtil.addHexPrefix(ks.getAddresses()[0]);
	console.log(gastankAccount);

	var web3Provider = new HookedWeb3Provider({
		host: process.env.web3host,
		transaction_signer: ks
	});

	ks.passwordProvider = function(callback) {
		callback(null, password);
	};

	console.log("Wallet initted addr=" + ks.getAddresses()[0]);

	web3 = new Web3(web3Provider);

	web3.eth.getBalance(gastankAccount, function(err, res) {
		if (err) {
			return console.log(err);
		}
		console.log('gastank-server (', gastankAccount, ') has', res.toString(10), 'wei / ', web3.fromWei(res, "ether").toString(10), 'ETH');
	});

	// start webserver...
	app.listen(process.env.PORT, function() {
		console.log('server listening on port ', process.env.PORT);
	});
});

var allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

	// intercept OPTIONS method
	if ('OPTIONS' == req.method) {
		res.sendStatus(200);
	} else {
		next();
	}
};
app.use(allowCrossDomain);
//app.use(cors());
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

function getgasprice(cb) {
	request('http://ethgasstation.info/json/ethgasAPI.json', function(error, response, body) {
		if (error && (response || response.statusCode !== 200)) {
			return cb(error);
		}
		var p = JSON.parse(body);
		cb(null, Math.ceil(p.safeLow * 1e9));
	});
}

app.get('/tokens', function(req, res) {
	res.status(200).json({
		"swarm-city": process.env.erc20token
	});
});

app.get('/abi', function(req, res) {
	res.status(200).json({
		erc20: IMiniMeToken.abi,
		gasstation: gasStation.abi,
	});
});

// this is an estimate....
upfrontgas = 100000 + 200000;

app.get('/price', function(req, res) {

	var tokensymbol;

	switch (req.query.tokenaddress) {
		case process.env.erc20token: // testRPC
			tokensymbol = 'swarm-city';
			break;
		default:
			var err = 'unknown token address ' + req.query.tokenaddress + ' - I only know ' + process.env.erc20token
			return res.status(500).json({
				error: err
			});
			break;
	}

	getgasprice(function(error, gasPrice) {

		getprice(tokensymbol, function(error, p) {
			if (error) {
				return res.status(500).json({
					error: error
				});
			}

			web3.eth.getBlockNumber(function(error, blockNumber) {

				var valid_until = blockNumber + 5;
				var price = Math.floor(p[0].price_eth * 1e18);

				var resp = {
					token_address: req.query.tokenaddress,
					gasprice: gasPrice,
					price: price,
					valid_until: valid_until,
				};

				console.log('requested price');
				console.log(resp);
				res.status(200).json(resp);
			}.bind(this));
		}.bind(this));
	}.bind(this));
});


app.post('/sign', function(req, res) {

	var tokensymbol;

	console.log(req.body);

	switch (req.body.tokenaddress) {
		case process.env.erc20token: // testRPC
			tokensymbol = 'swarm-city';
			break;
		default:
			var err = 'unknown token address ' + req.body.tokenaddress + ' - I only know ' + process.env.erc20token
			console.log(err);
			return res.status(500).json({
				error: err
			});
			break;
	}

	getgasprice(function(error, gasPrice) {

		getprice(tokensymbol, function(error, p) {
			if (error) {
				return res.status(500).json({
					error: error
				});
			}

			web3.eth.getBlockNumber(function(error, blockNumber) {

				var to = process.env.gastankaddress;
				var valid_until = blockNumber + 5;
				var from = req.body.from;
				var give = Math.floor(req.body.take * parseFloat(process.env.pricemargin) / p[0].price_eth) - upfrontgas * gasPrice;
				var random = Math.floor(Math.random() * 100000000000);

				//token_address,this,msg.sender,take,give,valid_until,random
				const condensed = utility.pack(
					[
						req.body.tokenaddress,
						to,
						from,
						req.body.take,
						give,
						valid_until,
						random,
					], [160, 160, 160, 256, 256, 256, 256]);
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
					token_address: req.body.tokenaddress,
					gasprice: gasPrice,
					take: req.body.take,
					give: give,
					to: to,
					valid_until: valid_until,
					random: random,
					sig: result
				};

				console.log('requested signing');
				console.log(resp);
				res.status(200).json(resp);
			}.bind(this));
		}.bind(this));
	}.bind(this));
});


app.post('/fillup', function(req, res) {
	console.log('hallo');
	console.log(req.body);

	var decodetx = new EthJStx(req.body.tx1);

	console.log('tx=', decodetx);
	console.log('gas tostring=', decodetx.gas.toString('hex'));


	var txGas = web3.toBigNumber(ethUtil.addHexPrefix(decodetx.gas.toString('hex')));
	//var txGasPrice = web3.toBigNumber(ethUtil.addHexPrefix(decodetx.gasPrice.toString('hex')));

	//	var weiNeeded = txGas.add(1000000).mul(txGasPrice).toNumber(10);
	var gasTankClientAddress = ethUtil.addHexPrefix(decodetx.from.toString('hex'));


	console.log('txGas=', txGas);
	//console.log('txGasPrice=', txGasPrice);
	//console.log('weiNeeded=', weiNeeded);
	console.log('from=', gasTankClientAddress);

	console.log('gastank account=', gastankAccount);
	console.log('sending', upfrontgas * 2 * 1e9, 'Wei / ', web3.fromWei(upfrontgas * 2 * 1e9, "ether").toString(10), 'ETH from ', gastankAccount, 'to', gasTankClientAddress);

	getgasprice(function(error, gasPrice) {
		web3.eth.sendTransaction({
			from: gastankAccount,
			to: gasTankClientAddress,
			value: upfrontgas * 2 * 1e9,
			gasPrice: gasPrice,
			gas: 50000,
		}, function(err, txhash) {
			console.log('sent gas - txhash = ', err, txhash);

			web3.eth.getBalance(gastankAccount, function(err, balance) {
				console.log('ETH balance of gastank (', gastankAccount, ') is', balance.toString(10) / 1e18);
				web3.eth.getBalance(gasTankClientAddress, function(err, balance) {
					console.log('ETH balance of gasTankClientAddress (', gasTankClientAddress, ') is', balance.toString(10) / 1e18);
					console.log('-----++++++-----++++++-----++++++-----++++++-----++++++-----');
					//inject allowance TX
					console.log('-----ALLOW TX-----');
					web3.eth.sendRawTransaction(req.body.tx1, function(err, res) {
						console.log('create allowance - tx sent', err, res);
					})

					console.log('-----/ALLOW TX-----');
					console.log('-----FILL TX-----');

					decodetx = new EthJStx(req.body.tx2);
					//console.log(decodetx);
					var txTo = ethUtil.addHexPrefix(decodetx.to.toString('hex'));
					//txGas = web3.toBigNumber('0x' + decodetx.gas.toString('hex'));
					//txGasPrice = web3.toBigNumber('0x' + decodetx.gasPrice.toString('hex'));
					//weiNeeded = txGas.add(1000000).mul(txGasPrice).toNumber(10);
					gasTankClientAddress = ethUtil.addHexPrefix(decodetx.from.toString('hex'));


					console.log('txTo=', txTo);
					//console.log('txGas=', txGas);
					//console.log('txGasPrice=', txGasPrice);
					//console.log('weiNeeded=', weiNeeded);
					console.log('from=', gasTankClientAddress);


					// inject purchase TX
					web3.eth.sendRawTransaction(req.body.tx2, function(err, res) {
						web3.eth.getBalance(gastankAccount, function(err, balance) {
							console.log('ETH balance of gastank (', gastankAccount, ') is', balance.toString(10) / 1e18);
							web3.eth.getBalance(gasTankClientAddress, function(err, balance) {
								console.log('ETH balance of gasTankClientAddress (', gasTankClientAddress, ') is', balance.toString(10) / 1e18);
								console.log('-----++++++-----++++++-----++++++-----++++++-----++++++-----');
							});
						});
					})
					console.log('-----/FILL TX-----');


					res.status(200).json({
						msg: 'sent for processing - hang in there...',
						txhash: txhash
					});



				});
			});


		});
	});



});