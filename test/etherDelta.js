var MiniMeTokenFactory = artifacts.require("./MiniMeToken.sol");
var MiniMeToken = artifacts.require("./MiniMeToken.sol");
//var gasStation = artifacts.require("./gasStation.sol");
var etherDelta = artifacts.require("./etherdelta.sol");
var utility = require('../utility.js')();
const sha256 = require('js-sha256').sha256;
const sha3 = require('web3/lib/utils/sha3.js');


contract('Token Setup', function(accounts) {


  var ETHseller = accounts[3];
  var gastankClient = accounts[4];

  var miniMeTokenFactory;
  var swtToken;
  //  var hashtagRepToken;
  var gasStationInstance;
  var etherDeltaInstance;

  // gasstation params
  var _triggercost = 2137880000000000;
  var _exchangerate_numerator = 1;
  var _exchangerate_denominator = 1;

  var _tokensToExchange = 2137880000000000;

  var self = this;

  describe('Deploy MiniMeToken TokenFactory', function() {
    it("should deploy MiniMeToken contract", function(done) {
      MiniMeTokenFactory.new().then(function(_miniMeTokenFactory) {
        assert.ok(_miniMeTokenFactory.address);
        miniMeTokenFactory = _miniMeTokenFactory;
        console.log('miniMeTokenFactory created at address', _miniMeTokenFactory.address);
        done();
      });
    });
  });

  describe('Deploy SWT (test) Token', function() {
    it("should deploy a MiniMeToken contract", function(done) {
      MiniMeToken.new(
        miniMeTokenFactory.address,
        0,
        0,
        "Swarm City Token",
        18,
        "SWT",
        true
      ).then(function(_miniMeToken) {
        assert.ok(_miniMeToken.address);
        console.log('SWT token created at address', _miniMeToken.address);
        swtToken = _miniMeToken;
        done();
      });
    });

    it("should mint tokens for gastankClient", function(done) {
      swtToken.generateTokens(gastankClient, 1 * 1e18).then(function() {
        done();
      });
    });

  });

  describe('etherDelta setup', function() {
    //  function etherDelta(address admin_, address feeAccount_, address accountLevelsAddr_, uint feeMake_, uint feeTake_, uint feeRebate_) {
    //admin = admin_;

    it("should deploy etherDelta", function(done) {
      etherDelta.new(accounts[0], accounts[0], 0x0, 0, 0, 0, {
        gas: 4700000,
      }).then(function(instance) {
        etherDeltaInstance = instance;
        assert.isNotNull(etherDeltaInstance);
        done();
      });
    });

    it("ETHseller should deposit 1 ETH to EtherDelta", function(done) {

      etherDeltaInstance.deposit({
        from: ETHseller,
        value: 1 * 1e18
      }).then(function(r) {
        done();
      });
    });


    it("ETHseller should have 1 ETH in the EtherDelta contract", function(done) {
      etherDeltaInstance.balanceOf.call(0, ETHseller).then(function(balance) {
        assert.equal(balance.valueOf(), 1 * 1e18, "account not correct amount");
        done();
      });
    });

    it("gastankClient should give allowance for 1 SWT to EtherDelta", function(done) {
      swtToken.approve(etherDeltaInstance.address, 1 * 1e18, {
        from: gastankClient,
      }).then(function(r) {
        done();
      });
    });

    it("gastankClient should deposit 1 SWT to EtherDelta", function(done) {
      etherDeltaInstance.depositToken(swtToken.address, 1 * 1e18, {
        from: gastankClient,
      }).then(function(r) {
        done();
      });
    });

    it("gastankClient should have 1 SWT in the EtherDelta contract", function(done) {
      etherDeltaInstance.balanceOf.call(swtToken.address, gastankClient).then(function(balance) {
        assert.equal(balance.valueOf(), 1 * 1e18, "account not correct amount");
        done();
      });
    });



    it("should place a sell order ETH/SWT etherDelta", function(done) {

      var watcher = etherDeltaInstance.Order();
      watcher.watch(function(error, result) {
        console.log('new order event ', result.args);
        watcher.stopWatching();
        done();
      });

      //function order(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce) {
      etherDeltaInstance.order(
        swtToken.address, // SWT address
        1 * 1e18, // amount of SWT I wanna buy
        0, // 0 = ETH
        1 * 1e18, // Amount of ETH I wanna sell
        10000, // validity
        1, // nonce 
        {
          from: ETHseller
        }).then(function(r) {
        // this will fire an Order event...
      });
    });



    // function availableVolume(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s) constant returns(uint) {
    //   bytes32 hash = 


    it("Avaiable volume of order should be 1 * 1e18", function(done) {



      const condensed = utility.pack(
        [
          etherDeltaInstance.address, //'this.config.contractEtherDeltaAddr,
          swtToken.address, //tokenGet,
          1 * 1e18, //amountGet,
          0, //tokenGive,
          1 * 1e18, //amountGive,
          10000, //expires,
          1 // orderNonce,
        ], [160, 160, 256, 160, 256, 256, 256]);
      const hash = sha256(new Buffer(condensed, 'hex'));

      console.log('hash=', hash);


      //console.log('web3=',web3);

      utility.sign(null, gastankClient, hash, '826b25292b2ba3d8d3cfeed25b8fd3042db714eef5121feadda94dc22aa2cbec', function(err, signature) {
        if (err) {
          console.log('ERR', err);
          return done();
        }
        console.log('sig=', signature);



        etherDeltaInstance.availableVolume.call(
          swtToken.address,
          1 * 1e18,
          0,
          1 * 1e18,
          10000,
          1,
          ETHseller,
          signature.v,
          signature.r,
          signature.s

        ).then(function(volume) {
          assert.equal(volume.valueOf(), 1 * 1e18, "volume not correct amount");
          done();
        });
      });

    });


    it("should buy ETH for SWT", function(done) {

      //  function trade(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s, uint amount) {

      const condensed = utility.pack(
        [
          etherDeltaInstance.address, //'this.config.contractEtherDeltaAddr,
          swtToken.address, //tokenGet,
          1 * 1e18, //amountGet,
          0, //tokenGive,
          1 * 1e18, //amountGive,
          10000, //expires,
          1 // orderNonce,
        ], [160, 160, 256, 160, 256, 256, 256]);
      const hash = sha256(new Buffer(condensed, 'hex'));

      console.log('hash=', hash);

      utility.sign(null, gastankClient, hash, '826b25292b2ba3d8d3cfeed25b8fd3042db714eef5121feadda94dc22aa2cbec', function(err, signature) {
        if (err) {
          console.log('ERR', err);
          return done();
        }
        console.log('sig=', signature);

        function prefixMessage(msgIn) {
          let msg = msgIn;
          msg = new Buffer(msg.slice(2), 'hex');
          msg = Buffer.concat([
            new Buffer(`\x19Ethereum Signed Message:\n${msg.length.toString()}`),
            msg
          ]);
          console.log('MSG TO BE HASHED 2', msg.toString('hex'));
          msg = sha3(`0x${msg.toString('hex')}`, {
            encoding: 'hex'
          });
          console.log('HASH 2', msg.toString('hex'));
          msg = new Buffer((msg.substring(0, 2) === '0x') ? msg.slice(2) : msg, 'hex');
          return `0x${msg.toString('hex')}`;
        }

        utility.verify(null, gastankClient, signature.v, signature.r, signature.s, prefixMessage('0x' + hash), function(err, res) {
          if (err) {
            console.log('verify err', err);
          }
          console.log('verify result=', res);

          etherDeltaInstance.trade(
            swtToken.address,
            1 * 1e18,
            0,
            1 * 1e18,
            10000,
            1,
            ETHseller,
            signature.v,
            signature.r,
            signature.s, 1 * 1e10, {
              from: gastankClient
            }).then(function(r) {
            done();
          });
        });

        //return;

        // web3, addressIn, // eslint-disable-line consistent-return
        //     v, rIn, sIn, valueIn, callback) {

      });
    });


    it("ETHseller should now have 1 SWT in the EtherDelta contract", function(done) {
      etherDeltaInstance.balanceOf.call(swtToken.address, ETHseller).then(function(balance) {
        assert.equal(balance.valueOf(), 1 * 1e10, "account not correct amount");
        done();
      });
    });

  });
});