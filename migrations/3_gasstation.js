var gasStation = artifacts.require("gasStation");

module.exports = function(deployer) {
	deployer.deploy(gasStation);
};