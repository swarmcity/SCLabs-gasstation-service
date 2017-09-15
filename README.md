# sc-gasstation

An experimental service providing a way to exchange ERC20 tokens in ETH to pay for future transactions. 

# Installing

```
$ npm install -g ethereumjs-testrpc
$ npm install -g generate-contract-interface
$ npm install -g browserify
```

# running the service

In one terminal - start testRPC

```
$ testrpc -p 8546
```

in another terminal - create a file ```.env``` containing these parameters :


```
privatekey="(a private key holding the ETH to supply the upfront gas)"
gastankaddress="(the address of the gastank contract)"
erc20token="(the address of the ERC20 token your gastank accepts)"
PORT=3000
```

Now start up your gastank

```
nodemon
```

or

```
node index.js
```

## Building

Create contract interfaces and browserify utility library

```
. ./build.sh
```

## Running smart contract unit tests

```
truffle test ./test/gasStation.js
```



![Fill me up](images/station.jpeg)

