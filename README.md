# sc-gasstation

An experimental service providing a way to exchange ERC20 tokens in ETH to pay for future transactions. 

# Installing

```
$ npm install -g ethereumjs-testrpc
```

# running the service

In one terminal - start testRPC

```
$ testrpc -p 8546
```

in another terminal - go to the polymer client and run it

```
$ truffle compile
$ truffle migrate
$ truffle test ./test/gasStation.js
```

Create a file ```.env``` containing these parameters :


```
privatekey="(a private key holding the ETH to supply the upfront gas)"
gastankaddress="(the address of the gastank contract)"
erc20token="(the address of the ERC20 token your gastank accepts)"
```

Now start up your gastank

```
nodemon
```

or

```
node index.js
```



![Fill me up](images/station.jpeg)

