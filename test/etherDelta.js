var MiniMeTokenFactory = artifacts.require("./MiniMeToken.sol");
var MiniMeToken = artifacts.require("./MiniMeToken.sol");
//var gasStation = artifacts.require("./gasStation.sol");
var etherDelta = artifacts.require("./etherdelta.sol");

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
      swtToken.generateTokens(gastankClient, 4 * 2137880000000000).then(function() {
        done();
      });
    });

  });

  describe('etherDelta setup', function() {
    //  function etherDelta(address admin_, address feeAccount_, address accountLevelsAddr_, uint feeMake_, uint feeTake_, uint feeRebate_) {
    //admin = admin_;

    it("should deploy etherDelta", function(done) {
      etherDelta.new(accounts[0], accounts[0], 0x000000000000000000000000000000000000000000000000000aa87bee538000, 0, {
        gas: 4700000,
      }).then(function(instance) {
        etherDeltaInstance = instance;
        assert.isNotNull(etherDeltaInstance);
        done();
      });
    });

    it("should deposit etherDelta", function(done) {

      etherDeltaInstance.deposit({
        from: ETHseller
      }).then(function(r) {
        done();
      });
      // self.web3.eth.sendTransaction({
      //   from: ETHseller,
      //   to: etherDeltaInstance.address,
      //   value: 1 * 1e18
      // }).then(function(a) {
      //   console.log(a);
      // })

    });
    it("should place a sell order ETH/SWT etherDelta", function(done) {
      //function order(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce) {
      etherDeltaInstance.order(
        swtToken.address, // SWT address
        1,                // amount of SWT I wanna buy
        0,                // 0 = ETH
        1,                // Amount of ETH I wanna sell
        10000,            // validity
        1,                // nonce 
        {    
          from: ETHseller
        }).then(function(r) {
        done();
      });
    });

    it("should buy ETH for SWT", function(done) {

      //  function trade(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s, uint amount) {


      etherDeltaInstance.trade(
        swtToken.address,
        1,
        0,
        1,
        10000,
        1,
        gastankClient,
        0,
        '0x0',
        '0x0',
        1,
        {
          from: gastankClient
        }).then(function(r) {
        done();
      });

    });
  });
});