var MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
var MiniMeToken = artifacts.require("MiniMeToken");
var gasStation = artifacts.require("gasStation");

module.exports = function(deployer) {
	deployer.deploy(MiniMeTokenFactory).then(function() {
		deployer.deploy(MiniMeToken, MiniMeTokenFactory.address, 0,
			0,
			"Swarm City Token",
			18,
			"SWT",
			true);

	});
	deployer.deploy(gasStation);
};