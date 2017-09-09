var express = require('express');
var bodyparser = require('body-parser');
var app = express();
var cors = require('cors');
var Web3 = require('web3');
var HookedWeb3Provider = require("hooked-web3-provider");
var EthJStx = require("ethereumjs-tx");
var ethUtil = require("ethereumjs-util");
var lightwallet = require("eth-lightwallet");
var config = require('./config.json');
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

	console.log('importing pk ',process.env.privatekey);
	ks.importPrivateKey(process.env.privatekey, pwDerivedKey);

	gastankAccount = ethUtil.addHexPrefix(ks.getAddresses()[0]);
	console.log(gastankAccount);

	var web3Provider = new HookedWeb3Provider({
		host: config.web3.host,
		transaction_signer: ks
	});

	ks.passwordProvider = function(callback) {
		callback(null, password);
	};

	console.log("Wallet initted addr=" + ks.getAddresses()[0]);

    web3 = new Web3(web3Provider);

	web3.eth.getBalance(gastankAccount, function(err, res) {
		//console.log('gastank-server (',gastankAccount,') has',res.toString(10),'wei / ',web3.fromWei(res, "ether").toString(10),'ETH');

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
      res.send(200);
    }
    else {
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



app.get('/price', function(req, res) {

	var tokensymbol;

	switch(req.query.tokenaddress){
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

			const condensed = utility.pack(
				[
					req.query.tokenaddress,
					price,
					from,
					to,
					valid_until,
					random,
					config.upfrontgas * 2 * 1e9
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
				upfront: config.upfrontgas * 2 * 1e9,
				sig: result
			};
			console.log('requested price');
			console.log(resp);
			res.status(200).json(resp);
		}.bind(this));
	}.bind(this));
});

app.post('/fillup', function(req, res) {
	console.log('hallo');
	console.log(req.body);

    var decodetx = new EthJStx(req.body.tx1);
    console.log('gas=',decodetx.gas);

    var txGas = web3.toBigNumber(ethUtil.addHexPrefix(decodetx.gas.toString('hex')));
    var txGasPrice = web3.toBigNumber(ethUtil.addHexPrefix(decodetx.gasPrice.toString('hex')));
    var weiNeeded = txGas.add(1000000).mul(txGasPrice).toNumber(10);
    var gasTankClientAddress = ethUtil.addHexPrefix(decodetx.from.toString('hex'));

    
    console.log('txGas=',txGas);
    console.log('txGasPrice=',txGasPrice);
    console.log('weiNeeded=',weiNeeded);
    console.log('from=',gasTankClientAddress);

    console.log('gastank account=',gastankAccount);
    console.log('sending',weiNeeded,'Wei / ',web3.fromWei(weiNeeded, "ether").toString(10),'ETH from ',gastankAccount,'to',gasTankClientAddress);

 	web3.eth.sendTransaction({
        from: gastankAccount,
        to: gasTankClientAddress,
        value: weiNeeded,
        gasPrice: 2 * 1e9,
         gas: 50000,
      },function(err,txhash){
      	console.log('sent gas - txhash = ',err,txhash);

      	//inject allowance TX
		web3.eth.sendRawTransaction(req.body.tx1,function(err,res){
			console.log('create allowance - tx sent',err,res);
		})

		console.log('-----FILL TX-----');

 	decodetx = new EthJStx(req.body.tx2);
	console.log(decodetx);
	var txTo = ethUtil.addHexPrefix(decodetx.to.toString('hex'));
     txGas = web3.toBigNumber('0x' + decodetx.gas.toString('hex'));
     txGasPrice = web3.toBigNumber('0x' + decodetx.gasPrice.toString('hex'));
     weiNeeded = txGas.add(1000000).mul(txGasPrice).toNumber(10);
     gasTankClientAddress = ethUtil.addHexPrefix(decodetx.from.toString('hex'));

    
    console.log('txTo=',txTo);
    console.log('txGas=',txGas);
    console.log('txGasPrice=',txGasPrice);
    console.log('weiNeeded=',weiNeeded);
    console.log('from=',gasTankClientAddress);


	// inject purchase TX
	web3.eth.sendRawTransaction(req.body.tx2, function(err, res) {
		console.log('call gasstation - tx sent', err, res);
	})
	console.log('-----/FILL TX-----');


	res.status(200).json({
		msg: 'sent for processing - hang in there...',
		txhash: txhash
	});
})



});
