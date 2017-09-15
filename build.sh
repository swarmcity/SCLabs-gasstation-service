rm -Rf build
rm -f contracts/IgasStation.sol
cd contracts
generate-contract-interface < gasStation.sol > IgasStation.sol
cd ..
truffle compile
browserify utility.js > utility-browserify.js

