var MiniMeTokenFactory = artifacts.require("./MiniMeToken.sol");
var MiniMeToken = artifacts.require("./MiniMeToken.sol");
var gasStation = artifacts.require("./gasStation.sol");
// var etherDelta = artifacts.require("./etherdelta.sol");

contract('Token Setup', function(accounts) {

  var miniMeTokenFactory;
  var swtToken;
  //  var hashtagRepToken;
  var gasStationInstance;

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

    it("should mint tokens for accounts[1] ( owner ) ", function(done) {
      swtToken.generateTokens(accounts[1], 4 * 2137880000000000).then(function() {
        done();
      });
    });
  });

  describe('gasStation setup', function() {

    it("should deploy a gasStation", function(done) {
      gasStation.new(swtToken.address, _exchangerate_numerator, _exchangerate_denominator, _triggercost, {
        gas: 4700000,
        value: 1e18,
      }).then(function(instance) {
        gasStationInstance = instance;
        assert.isNotNull(gasStationInstance);
        done();
      });
    });

    it("should verify the triggercost", function(done) {
      gasStationInstance.triggercost().then(function(value) {
        assert.equal(value.toNumber(), _triggercost);
        done();
      });
    });

    it("should verify the exchangerate_numerator", function(done) {
      gasStationInstance.exchangerate_numerator().then(function(value) {
        assert.equal(value.toNumber(), _exchangerate_numerator);
        done();
      });
    });

    it("should verify the exchangerate_denominator", function(done) {
      gasStationInstance.exchangerate_denominator().then(function(value) {
        assert.equal(value.toNumber(), _exchangerate_denominator);
        done();
      });
    });

    it("should read balance of the gasstation", function(done) {
      self.web3.eth.getBalance(accounts[1], function(err, ethbalance) {
        console.log('gasstation owns', ethbalance.toNumber(10), 'Wei');
        done();
      });
    });
  });

  describe('access gasstation', function() {
    it("should allow the gasstation to get tokens from accounts[1]", function(done) {
      swtToken.approve(gasStationInstance.address, _tokensToExchange, {
        from: accounts[1]
      }).then(function(instance) {
        done();
      });
    });

    var _ethbalance;
    var _swtbalance;
    var _fillMeUpestimate;
    var _fillMeUpcost;
    var gasStationInfo = {};

    it("should read account[1] ETH balance before exchange", function(done) {
      self.web3.eth.getBalance(accounts[1], function(err, ethbalance) {
        _ethbalance = ethbalance.toNumber();
        console.log('ethbalance before', _ethbalance);
        done();
      });
    });

    it("should read account[1] Token balance before exchange", function(done) {
      swtToken.balanceOf.call(accounts[1]).then(function(balance) {
        _swtbalance = balance.toNumber(10);
        console.log('token balance before', _swtbalance);
        done();
      });
    });

    it("should read gasStation ETH balance before exchange", function(done) {
      self.web3.eth.getBalance(gasStationInstance.address, function(err, ethbalance) {
        gasStationInfo._ethbalance = ethbalance.toNumber();
        console.log('ethbalance before', gasStationInfo._ethbalance);
        done();
      });
    });

    it("should read gasStation] Token balance before exchange", function(done) {
      swtToken.balanceOf.call(gasStationInstance.address).then(function(balance) {
        gasStationInfo._swtbalance = balance.toNumber(10);
        console.log('token balance before', gasStationInfo._swtbalance);
        done();
      });
    });


    it("should send gas to do Tx", function(done) {
      self.web3.eth.sendTransaction({
        from: accounts[0],
        to: accounts[1],
        value: _triggercost,
      }, function(r, s) {
        done();
      });
    });


    it("should call the gasstation to get tokens from accounts[1]", function(done) {

      self.web3.eth.getGasPrice(function(err, gasPrice) {
        _gasPrice = gasPrice.toNumber(10);
        gasStationInstance.fillMeUp.estimateGas(1, {
          from: accounts[1]
        }).then(function(e) {
          console.log('estimate=', e);
          console.log('gasprice=', _gasPrice);

          _fillMeUpestimate = e;

          console.log('estimated cost is', _fillMeUpestimate);

          gasStationInstance.fillMeUp(_tokensToExchange, {
            from: accounts[1],
            gas: _fillMeUpestimate,
            gasPrice: _gasPrice
          }).then(function(a, b) {
            _fillMeUpcost = a.receipt.gasUsed * _gasPrice;
            console.log('actual cost', _fillMeUpcost);
            console.log('delta from estimate', _fillMeUpcost - _fillMeUpestimate * _gasPrice);
            done();
          });
        });
      });
    });

    it("should read account[1] ETH balance after exchange", function(done) {
      self.web3.eth.getBalance(accounts[1], function(err, ethbalance) {
        console.log('ETH balance', ethbalance.toNumber(10));
        console.log('ETH diff', ethbalance.toNumber(10) - _ethbalance);
        done();
      });
    });

    it("should read account[1] Token balance after exchange", function(done) {
      swtToken.balanceOf.call(accounts[1]).then(function(balance) {
        console.log('token balance', balance.toNumber(10));
        console.log('token diff', balance.toNumber(10) - _swtbalance);
        done();
      });
    });

    it("should read gasStation ETH balance after exchange", function(done) {
      self.web3.eth.getBalance(gasStationInstance.address, function(err, ethbalance) {
        console.log('ETH balance', ethbalance.toNumber(10));
        console.log('ETH diff', ethbalance.toNumber(10) - gasStationInfo._ethbalance);
        done();
      });
    });

    it("should read gasStation Token balance after exchange", function(done) {
      swtToken.balanceOf.call(gasStationInstance.address).then(function(balance) {
        console.log('token balance', balance.toNumber(10));
        console.log('token diff', balance.toNumber(10) - gasStationInfo._swtbalance);
        done();
      });
    });


  });



});