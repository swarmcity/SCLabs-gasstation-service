var MiniMeTokenFactory = artifacts.require("./MiniMeToken.sol");
var MiniMeToken = artifacts.require("./MiniMeToken.sol");
var gasStation = artifacts.require("./gasStation.sol");
var utility = require('../utility.js')();
var ethUtil = require("ethereumjs-util");
var ethTx = require("ethereumjs-tx");
var keythereum = require('keythereum');

contract('Token Setup', function(accounts) {

  // create some random ethereum keypairs

  function mkkeypair() {
    var dk = keythereum.create();
    var keyObject = keythereum.dump("none", dk.privateKey, dk.salt, dk.iv);
    return ({
      private: ethUtil.addHexPrefix(dk.privateKey.toString('hex')),
      public: ethUtil.addHexPrefix(keyObject.address)
    });
  }

  var randomkeys = [];

  for (var i = 0; i < 3; i++) {
    randomkeys.push(mkkeypair());
  }

  // the indexes of these keys represent these persona :
  var gasstation_client = 0;
  var gasstation_nodeserver = 1;
  var gasstation_withdrawaccount = 2;



  var miniMeTokenFactory;
  var swtToken;
  var gasStationInstance;

  // parameters
  const gasPrice = 2 * 1e9;

  // gasstation params
  var _triggercost = 2137880000000000;

  var _tokensToExchange = 2137880000000000;

  var self = this;

  describe('Deploy MiniMeToken TokenFactory', function() {
    it("should deploy MiniMeToken contract", function(done) {
      MiniMeTokenFactory.new({
        from: accounts[2]
      }).then(function(_miniMeTokenFactory) {
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
        true, {
          from: accounts[2]
        }
      ).then(function(_miniMeToken) {
        assert.ok(_miniMeToken.address);
        console.log('SWT token created at address', _miniMeToken.address);
        swtToken = _miniMeToken;
        done();
      });
    });

    it("should mint tokens for gasstation client ", function(done) {
      swtToken.generateTokens(randomkeys[gasstation_client].public, 4 * 1e18, {
        from: accounts[2]
      }).then(function() {
        console.log('minted SWT to address', accounts[1]);
        done();
      });
    });


    it("should send ETH to the gasstation-server (" + randomkeys[gasstation_nodeserver].public + ")", function(done) {
      var p = {
        from: accounts[0],
        to: randomkeys[gasstation_nodeserver].public,
        value: self.web3.toWei(1, "ether")
      };
      console.log(p);
      self.web3.eth.sendTransaction(p, function(err) {
        done();
      })
    });
  });

  describe('gasStation setup', function() {

    it("should deploy a gasStation-contract", function(done) {
      gasStation.new(randomkeys[gasstation_withdrawaccount].public, {
        gas: 4700000,
        from: accounts[2]
      }).then(function(instance) {
        gasStationInstance = instance;
        assert.isNotNull(gasStationInstance);
        console.log('gasstation created at address', gasStationInstance.address);
        console.log('owner is ', accounts[2]);
        done();
      });
    });

    // gasstation client should have some tokens to start with.
    it("should mint tokens for gasstation client ", function(done) {
      swtToken.generateTokens(randomkeys[gasstation_client].public, 3 * 1e18, {
        from: accounts[2]
      }).then(function() {
        console.log('minted SWT to address', accounts[1]);
        done();
      });
    });

    // gasstation contract should have some ETH.
    it("should be able to fund/refill the gasStation", function(done) {
      self.web3.eth.sendTransaction({
        from: accounts[0],
        to: gasStationInstance.address,
        value: self.web3.toWei(1, "ether")
      }, function(err) {
        done();
      })
    });

  });

  describe('post-setup tests', function() {

    it("gasstation-server should have ETH", function(done) {
      self.web3.eth.getBalance(randomkeys[gasstation_nodeserver].public, function(err, ethbalance) {
        console.log('gasstation-server owns', ethbalance.toNumber(10), 'Wei');
        assert.ok(ethbalance.toNumber(10) > 0);
        done();
      });
    });

    it("gasstation-contract should have ETH", function(done) {
      self.web3.eth.getBalance(gasStationInstance.address, function(err, ethbalance) {
        console.log('gasstation-contract owns', ethbalance.toNumber(10), 'Wei');
        assert.ok(ethbalance.toNumber(10) > 0);
        done();
      });
    });

    it("gasstation-client should have a Token balance ", function(done) {
      swtToken.balanceOf.call(randomkeys[gasstation_client].public).then(function(balance) {
        _swtbalance = balance.toNumber(10);
        console.log('gasstation-client token balance =', _swtbalance);
        assert.ok(_swtbalance > 0);
        done();
      });
    });

    it("gasstation-client should have no ETH", function(done) {
      self.web3.eth.getBalance(randomkeys[gasstation_client].public, function(err, ethbalance) {
        console.log('gasstation-client owns', ethbalance.toNumber(10), 'Wei');
        assert.ok(ethbalance.toNumber(10) == 0);
        done();
      });
    });

    it("should print instructions", function(done) {
      console.log('----------------------------------------------------');
      console.log('-----------------STEP 1-----------------------------');
      console.log('put in frontend/index.html -> gs-client attribute');
      console.log('erc20="' + swtToken.address + '"');
      console.log('-----------------STEP 2-----------------------------');
      console.log('put in file .env');
      console.log('gastankaddress=\'' + gasStationInstance.address + '\'');
      console.log('erc20token=\'' + swtToken.address + '\'');
      console.log('----------------------------------------------------');
      done();

    });
  });

  describe('test transaction on gasstation', function() {

    var approvaltx;

    it("should create getapproval TX", function(done) {
      var tx = utility.getapprovaltx(self.web3, randomkeys[gasstation_client].public, randomkeys[gasstation_client].private, swtToken.address, 1, gasStationInstance.address, gasPrice, function(err, tx) {
        console.log('err=', err, 'tx=', tx);

        approvaltx = tx;

        var decodedTx = new ethTx(tx.signedtx);

        //console.log('decoded tx=', decodedTx);
        //console.log('cost tostring=', tx.cost);



        done();
      });
    });

    it("gasstation-client should have no ETH", function(done) {
      self.web3.eth.getBalance(randomkeys[gasstation_client].public, function(err, ethbalance) {
        console.log('gasstation-client owns', ethbalance.toNumber(10), 'Wei');
        assert.ok(ethbalance.toNumber(10) == 0);
        done();
      });
    });

    it("should send gas to cover cost", function(done) {
      self.web3.eth.sendTransaction({
        from: accounts[0],
        to: randomkeys[gasstation_client].public,
        value: approvaltx.cost
      }, function(err) {
        done();
      })
    });

    it("gasstation-client should have enough ETH to cover initial tx costs", function(done) {
      self.web3.eth.getBalance(randomkeys[gasstation_client].public, function(err, ethbalance) {
        console.log('gasstation-client owns', ethbalance.toNumber(10), 'Wei');
        assert.ok(ethbalance.toNumber(10) == approvaltx.cost);
        done();
      });
    });

    it("gasstation-client should be able to execute TX", function(done) {
      web3.eth.sendRawTransaction(approvaltx.signedtx, function(err, res) {
        console.log('create allowance - tx sent', err, res);
        done();
      })
    });

    it("gasstation-client should have no ETH after tx", function(done) {
      self.web3.eth.getBalance(randomkeys[gasstation_client].public, function(err, ethbalance) {
        console.log('gasstation-client owns', ethbalance.toNumber(10), 'Wei');
        assert.ok(ethbalance.toNumber(10) == 0);
        done();
      });
    });

  });

  describe('clean up gasstation', function() {

    // it("gasstation-contract should have a non-zero Token balance ", function(done) {
    //   swtToken.balanceOf.call(gasStationInstance.address).then(function(balance) {
    //     _swtbalance = balance.toNumber(10);
    //     console.log('gasstation-contract token balance =', _swtbalance);
    //     assert.ok(_swtbalance > 0);
    //     done();
    //   });
    // });

    // it("withDrawtokens should not be possible from other account than the owner", function(done) {
    //   gasStationInstance.withdrawTokens(swtToken.address, accounts[4], {
    //     from: accounts[2]
    //   }).then(function() {
    //     done();
    //     // this should fail
    //   }).catch(function(e) {
    //     assert.fail(null, null, 'this function should not throw', e);
    //     done();
    //   });
    // });

    it("gasstation-contract should have a zero Token balance ", function(done) {
      swtToken.balanceOf.call(gasStationInstance.address).then(function(balance) {
        _swtbalance = balance.toNumber(10);
        console.log('gasstation-contract token balance =', _swtbalance);
        assert.ok(_swtbalance == 0);
        done();
      });
    });


    describe('Transfer ownership of gasstation', function() {

      it("gasstation-contract should get transfered ", function(done) {
        gasStationInstance.transferOwnership(randomkeys[gasstation_nodeserver].public, {
          from: accounts[2]
        }).then(function() {
          gasStationInstance.owner.call().then(function(owner) {
            console.log('owner of gasstation is now', owner);
            assert.ok(owner == randomkeys[gasstation_nodeserver].public);
            done();
          });
        });
      });

    });

  });
});