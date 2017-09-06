var MiniMeTokenFactory = artifacts.require("./MiniMeToken.sol");
var MiniMeToken = artifacts.require("./MiniMeToken.sol");
var gasStation = artifacts.require("./gasStation.sol");
// var etherDelta = artifacts.require("./etherdelta.sol");
var utility = require('../utility.js')();

contract('Token Setup', function(accounts) {

  var miniMeTokenFactory;
  var swtToken;
  //  var hashtagRepToken;
  var gasStationInstance;

  // gasstation params
  var _triggercost = 2137880000000000;

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

    it("should mint tokens for gasstation client ", function(done) {
      swtToken.generateTokens('0x3aca37396f868a315202e60b3854dc82f4a06223', 4 * 1e18).then(function() {
        console.log('minted SWT to address', accounts[1]);
        done();
      });
    });

    it("should send ETH to the gasstation-server", function(done) {
      self.web3.eth.sendTransaction({
        from: accounts[0],
        to: '0xc18191d27d4673d2ba6ea322510b2949ed3de757',
        value: self.web3.toWei(1, "ether")
      }, function(err) {
        done();
      })
    });

  });

  describe('gasStation setup', function() {

    it("should deploy a gasStation-contract", function(done) {
      gasStation.new(swtToken.address, {
        gas: 4700000,
        from: accounts[0]
          //value: self.web3.toWei(1, "ether"), // put 100 ETH on the contract.
      }).then(function(instance) {
        gasStationInstance = instance;
        assert.isNotNull(gasStationInstance);
        console.log('gasstation created at address', gasStationInstance.address);
        console.log('owner is ', accounts[0]);
        done();
      });
    });

    it("should be able to refill the gasStation", function(done) {
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
      self.web3.eth.getBalance('0xc18191d27d4673d2ba6ea322510b2949ed3de757', function(err, ethbalance) {
        console.log('gasstation-server owns', ethbalance.toNumber(10), 'Wei');
        assert.ok(ethbalance.toNumber(10)>0);
        done();
      });
    });


    it("gasstation-contract should have ETH", function(done) {
      self.web3.eth.getBalance(gasStationInstance.address, function(err, ethbalance) {
        console.log('gasstation-contract owns', ethbalance.toNumber(10), 'Wei');
        assert.ok(ethbalance.toNumber(10)>0);
        done();
      });
    });

    it("gasstation-client should have a Token balance ", function(done) {
      swtToken.balanceOf.call('0x3aca37396f868a315202e60b3854dc82f4a06223').then(function(balance) {
        _swtbalance = balance.toNumber(10);
        console.log('gasstation-client token balance =', _swtbalance);
        assert.ok(_swtbalance>0);
        done();
      });
    });

    it("should print instructions", function(done) {
      console.log('----------------------------------------------------');
      console.log('-----------------STEP 1-----------------------------');
      console.log('put in frontend/index.html -> gs-client attribute');
      console.log('erc20="'+swtToken.address+'"');
      console.log('-----------------STEP 2-----------------------------');
      console.log('put in file .env');
      console.log('gastankaddress=\''+gasStationInstance.address+'\'');
      console.log('erc20token=\''+swtToken.address+'\'');
      console.log('----------------------------------------------------');
      done();


    });

  });

  // describe('access gasstation', function() {
  //   it("should allow the gasstation to get tokens from accounts[1]", function(done) {
  //     swtToken.approve(gasStationInstance.address, _tokensToExchange, {
  //       from: accounts[1]
  //     }).then(function(instance) {
  //       done();
  //     });
  //   });

  //   var _ethbalance;
  //   var _swtbalance;
  //   var _fillMeUpestimate;
  //   var _fillMeUpcost;
  //   var gasStationInfo = {};

  //   it("should read account[1] ETH balance before exchange", function(done) {
  //     self.web3.eth.getBalance(accounts[1], function(err, ethbalance) {
  //       _ethbalance = ethbalance.toNumber();
  //       console.log('ethbalance before', _ethbalance);
  //       done();
  //     });
  //   });

  //   it("should read account[1] Token balance before exchange", function(done) {
  //     swtToken.balanceOf.call(accounts[1]).then(function(balance) {
  //       _swtbalance = balance.toNumber(10);
  //       console.log('token balance before', _swtbalance);
  //       done();
  //     });
  //   });

  //   it("should read gasStation ETH balance before exchange", function(done) {
  //     self.web3.eth.getBalance(gasStationInstance.address, function(err, ethbalance) {
  //       gasStationInfo._ethbalance = ethbalance.toNumber();
  //       console.log('ethbalance before', gasStationInfo._ethbalance);
  //       done();
  //     });
  //   });

  //   it("should read gasStation] Token balance before exchange", function(done) {
  //     swtToken.balanceOf.call(gasStationInstance.address).then(function(balance) {
  //       gasStationInfo._swtbalance = balance.toNumber(10);
  //       console.log('token balance before', gasStationInfo._swtbalance);
  //       done();
  //     });
  //   });


  //   it("should send gas to do Tx", function(done) {
  //     self.web3.eth.sendTransaction({
  //       from: accounts[0],
  //       to: accounts[1],
  //       value: _triggercost,
  //     }, function(r, s) {
  //       done();
  //     });
  //   });


  //   it("should call the gasstation to get tokens from accounts[1]", function(done) {

  //     self.web3.eth.getGasPrice(function(err, gasPrice) {
  //       _gasPrice = gasPrice.toNumber(10);
  //       gasStationInstance.fillMeUp.estimateGas(1, {
  //         from: accounts[1]
  //       }).then(function(e) {
  //         console.log('estimate=', e);
  //         console.log('gasprice=', _gasPrice);

  //         _fillMeUpestimate = e;

  //         console.log('estimated cost is', _fillMeUpestimate);

  //         gasStationInstance.fillMeUp(_tokensToExchange, {
  //           from: accounts[1],
  //           gas: _fillMeUpestimate,
  //           gasPrice: _gasPrice
  //         }).then(function(a, b) {
  //           _fillMeUpcost = a.receipt.gasUsed * _gasPrice;
  //           console.log('actual cost', _fillMeUpcost);
  //           console.log('delta from estimate', _fillMeUpcost - _fillMeUpestimate * _gasPrice);
  //           done();
  //         });
  //       });
  //     });
  //   });

  //   it("should read account[1] ETH balance after exchange", function(done) {
  //     self.web3.eth.getBalance(accounts[1], function(err, ethbalance) {
  //       console.log('ETH balance', ethbalance.toNumber(10));
  //       console.log('ETH diff', ethbalance.toNumber(10) - _ethbalance);
  //       done();
  //     });
  //   });

  //   it("should read account[1] Token balance after exchange", function(done) {
  //     swtToken.balanceOf.call(accounts[1]).then(function(balance) {
  //       console.log('token balance', balance.toNumber(10));
  //       console.log('token diff', balance.toNumber(10) - _swtbalance);
  //       done();
  //     });
  //   });

  //   it("should read gasStation ETH balance after exchange", function(done) {
  //     self.web3.eth.getBalance(gasStationInstance.address, function(err, ethbalance) {
  //       console.log('ETH balance', ethbalance.toNumber(10));
  //       console.log('ETH diff', ethbalance.toNumber(10) - gasStationInfo._ethbalance);
  //       done();
  //     });
  //   });

  //   it("should read gasStation Token balance after exchange", function(done) {
  //     swtToken.balanceOf.call(gasStationInstance.address).then(function(balance) {
  //       console.log('token balance', balance.toNumber(10));
  //       console.log('token diff', balance.toNumber(10) - gasStationInfo._swtbalance);
  //       done();
  //     });
  //   });


  // });



});