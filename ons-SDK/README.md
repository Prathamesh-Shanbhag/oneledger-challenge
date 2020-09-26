# Oneledger SDK

Oneledger SDK is a series of highly customizable JavaScript libs that allow developers to interact with Oneledger network.    

SDK has several codebase that taking care of different features.  
- [ons-SDK](https://github.com/Oneledger/ons-SDK): Main codebase of Oneledger SDK, including online queries, offline transaction serialization and useful tools with default config export.
- [hd-vault](https://github.com/Oneledger/hd-vault): HD wallet core, including HD wallet generation, master key management, key pair derivation, transaction sign and address verification.
- [ons-faucet](https://github.com/Oneledger/ons-faucet): Oneledger testnet faucet, including CLI and request functions for minting OLT on Oneledger testnet.
- [middle_utility](https://github.com/Oneledger/middle_utility): Middle layer helper lib, including all pre-defined error code and error message and common tools that all other Oneledger SDK libs are using.
- [sdk-interoperability](https://github.com/Oneledger/sdk-interoperability): Oneledger interoperability lib of SDK, including support of Ethereum and Bitcoin lock&redeem feature.
- [explorer-sdk-js](https://github.com/Oneledger/explorer-sdk-js): Oneledger Explorer SDK, including APIs of Oneledger transactions queries from Explorer server.

## 0. Pre-Start
Install npm and node and make sure you have them as the following version:
```bash
    $ npm -v
      6.14.7

    $ node -v
      v10.21.0
```

Create your own project:
```bash
    $ mkdir my_awesome_project
    $ cd my_awesome_project
    $ npm init
```
Just follow the default settings during `npm init` would be fine, you can always make changes in `package.json` about your project later.

Download Oneledger SDK libs and update `package.json` dependencies:
```json
    "dependencies": {
        "hd-vault": "file:./hd-vault", 
        "middle_utility": "file:./middle_utility",
        "ons-SDK": "file:./ons-SDK",
        "ons-faucet": "file:./ons-faucet",
        "explorer-sdk-js": "file:./explorer-sdk-js"
    }
```
**All Oneledger libs should be stored under the root dir of your project.**

Install dependencies:  

Run below command inside each Oneledger SDK dependency folder, then run it one more time in your project root dir.
```bash
    $ npm i
```

Create `main.js` file, this would be the main file of your project:
```bash
    $ touch main.js
```

Declare some const values that we need in this project later:
```javascript 1.8
    const yourMasterKeyPassword = "5h$mY_SupEr_sTRong_%$passWorD123#@"; // password to encrypt/decrypt your HD wallet master key
    const fullnodeUrl = "https://xxx.fullnode.oneledger.network/jsonrpc"; // fullnode URL is used to broadcast transactions and make query
    const explorerServerUrl = "https://xxx.explorer.oneledger.network"; // explorer URL is used to query transaction history
    const faucetServerUrl = "https://xxx.faucet.oneledger.network/jsonrpc"; // faucet server URL is used to request Test OLT
    const requestAmount = 10000; // Test OLT amount to request
    const sendAmount = "2000"; // Test OLT amount to send
```

**Tips**: you can always run your code by `$ node main.js` in terminal.

## 1. Create HD Wallet:
Import HD vault to your project, in `main.js`
```javascript
    const HDVault = require('hd-vault');
```

Master Key Derivation:
```javascript
    const mnemonicWords = HDVault.mnemonicUtil.mnemonicGenerator24();
    const masterKey = new HDVault.MasterKeySeedManager(mnemonicWords, yourMasterKeyPassword);
    const {encryptedMasterKeySeed} = masterKey.getMasterKeySeedInfo();
```

Now you have a functioning HD wallet yourself, you can derive Oneledger key pairs from your HD wallet now.  
There are few things you need to keep in mind before proceeding:
1. Things you need to store somewhere safe and never share with anyone else:   
    a). 24 mnemonic words(specific in given order), this is used to generate your master key.  
    b). Your master key password, this is used to encrypt/decrypt your master key.   
    c). Never share your master key info.
2. If you forget your password, you can always recover with your 24 mnemonic words(in given order).
3. If you forget password AND 24 mnemonic words, you lose the access to your wallet forever.
4. Different master key can derive different key pair even with the same key type and the same key index.
5. HD wallet is an independent module that is used for key pair derivation and transaction signing based on key type, we only need Oneledger key pair here, key type is `OLT`.


## 2. Create Oneledger Account 
Oneledger Key Derivation
```javascript
    const derivedKeyData = {
        keyType: "OLT",
        keyIndex: 0, // Increment keyIndex for generating new keys
        password: yourMasterKeyPassword,
        encryptedMasterKeySeed: encryptedMasterKeySeed
    };
    const {response} = await HDVault.derivedKeyManager.deriveNewKeyPair(derivedKeyData).catch(error => {
        // handler error here
    });
    const {keyIndex, address, publicKey} = response;
```

Notice:
1. `keyIndex` can be any non-negative integer, different `keyIndex` will derive different key pair.
2. For security reasons, HD wallet does not expose private key, the `repsonse` only returns current key index, address and public key associated with this address.

## 3. Request Test OLT
<span id="RequestTestOLT">You can only request test OLT on Testnet.</span>
```javascript 1.8
    const faucet = require('ons-faucet'); 
    
    const env = {url: faucetServerUrl};
    const {response} = await faucet.requestOLT(address, requestAmount, env).catch(error => {
        // handle error here  
    });
    const result = response;
```


## 4. Prepare Transaction  
Here, we are taking `send currency to an address` transaction as example.
```javascript 1.8
    const {transfer} = require('ons-SDK');
    
    const env = {
        url: fullnodeUrl,
        storeConfig: {
            platform: "electron",
            storeLocation: __dirname
        }
    };

    async function sendToAddrOffline(fromAddress, toAddress, currency, sendAmount, env) {
        const sendToAddrPayload = {
            fromAddr: fromAddress,
            to: toAddress,
            amount: {
                currency: currency,
                value: sendAmount
            }
        };

        let responseSendToAddrTx = '';
        try {
            responseSendToAddrTx = await transfer.sendToAddressTxOffline(sendToAddrPayload, env)
        } catch (err) {
            // handle error here
        }

        const rawTx = responseSendToAddrTx.response.rawTx;
    }
```

Notice: 
1. Oneledger SDK is designed as highly customizable, so that some configurations like storage solution can be decided by developers based on the platform they work on. To achieve that, all SDK request functions will take one param named `env`.  
  
   You can always construct your own `env` object based on the Oneledger network you are connecting to, or the platform you are working on.    
    
   For example, you can replace `fullnodeUrl` with the Oneledger fullnode url you are connecting to, by default SDK is pointing to Oneledger Mainnet.  
      
   Oneledger SDK provides two kinds of config storage solution:  
   a). `electron`: If you are working on electron app(or any other app that has access to the local file system), choose this one and set proper `storeLocation`, `__dirname` would be used by default.  
   b). `browser`: If your are working on Chrome extension app(or any other app that has access to browser `window.localSotrage`), choose this one and set proper `storeLocation`, `__dirname` would be used by default.  
2. `currency` here we use `OLT`.
3. Destructure the response to get `rawTx`, this is the transaction that you need to sign with your OLT key later.

**If you are working on customized transaction, please go to [9. Customized Transaction in SDK](#CustomizedTransctionInSDK)**

## 5. Sign Transaction
<span id="signTx">Sign transaction</span> with Oneledger Key derived by HD wallet.
```javascript
    const signData = {
        message: rawTx,
        keyType: "OLT",
        keyIndex: 0,
        password: yourMasterKeyPassword,
        encryptedMasterKeySeed: encryptedMasterKeySeed
    };
    const {response} = await HDVault.derivedKeyManager.signTx(signData).catch(error => {
        // handler error here
    });
    const {signature} = response;
```

Notice:
1. `rawTx` in the payload should be a Base64 encoded string, which you get from transaction prepare step.
2. `keyIndex` here indicates which key you want to use for signing.
3. You need to pass correct master key password to authorize HD wallet for signing.
4. `signature` in return response will be used for broadcast later.


## 6. Broadcast Transaction
```javascript 1.8
    const {request, requestConfig} = require('ons-SDK');

    async function broadcastTx({publicKey, rawTx, signature}, env) {
        const broadcastBody = {
            broadcastType: requestConfig.BroadcastType.Sync,
            rawTx: rawTx,
            signature: signature,
            publicKey: {
                keyType: requestConfig.PublicKeyTypes.publicKeyType,
                data: publicKey // Make sure you use the publicKey here that derived from the same KeyIndex that used to sign your transaction.
            }
        };
        const {response} = await request.broadcastTx(broadcastBody, env).catch(error => {
           // handler error here
        });
        const {txHash, height} = response;
    }
```

Notice:  
1. `broadcastType` could be `Async`, `Sync` and `TxCommitMtSig`, we recommend to use `Sync` here.
2. `publicKey.keyType` should always be `requestConfig.PublicKeyTypes.publicKeyType` which is `ed25519`.
3. `publicKey` is the public key of the key pair that used to sign this transaction.
4. `txHash` in return response could be used for later tx query, each tx has its own unique txHash, `height` might be `undefined` if tx been broadcasted by `Sync`.
5. To successfully broadcast a transaction to Oneledger network, you should have enough OLT balance in the signing account, to get test OLT, please refer to [3. Request Test OLT](#RequestTestOLT)

## 7. Query Account Balance
```javascript 1.8
    const {request} = require('ons-SDK');

    async function queryBalanceForAddr({address, currency}, env) {
        const queryBalanceObj = {
            address: address,
            currency: currency
        };
        const {response} = await request.queryCurrencyBalanceForAccount(queryBalanceObj, env).catch(error => {
            // handle error here
        });
        const balance = response;
    }
```

Notice: 
1. `currency` is optional, it will query all currency that address owns if `currency` not given.

## 8. Query Transaction History
```javascript 1.8
    const {account} = require("explorer-sdk-js");

    const env = {
        url: explorerServerUrl,
        storeConfig: {
            platform: "electron",
            storeLocation: __dirname
        }
    };

    const data = {
        address: queryAddress,
        page: 0, 
        pageSize: 20
    }
    const {response} = await account.queryAccountTxs(data, env).catch(error => {
        // handle error here
    });
    const txs = response;
```

Notice:
1. `env.url` must be a valid Oneledger Explorer server URL.
2. `queryAddress` in `data` is the address that you want to query.


## 9. Customized Transaction in SDK
<span id="CustomizedTransctionInSDK">In this section</span>, you will learn how to implement your own transaction in Oneledger SDK.  

To make it easily understandable, we will implement a transaction that stores a json object into Oneledger blockchain in the following example. 
### 9.1 Register customized transaction type
```javascript 1.8
    const CustmoziedTxType = "STOREJSON";
```
`STOREJSON` must be registered on Oneledger protocol already, otherwise Oneledger blockchain will not recognize it.

### 9.2 Implement customized transaction prepare function
In `main.js` of your project.
```javascript 1.8
    const {request, util, offlineSerialize} = require('ons-SDK');
    const {ErrorUtil} = require("middle_utility").TierError;

    const env = {
        url: fullnodeUrl,
        storeConfig: {
            platform: "electron",
            storeLocation: __dirname
        }
    };

    async function storeJsonTx({key, value, gasAdjustment = 0}, env) {
        // do the input check
    
        // query current gas price from Oneledger network
        let gasPrice;
        try {
            const result = await request.queryGasPrice(env);
            gasPrice = result.response
        } catch (err) {
            return Promise.reject(err)
        }
        
        // construct your customized transaction data
        const tx_dataObj = {
            jsonData: {key: value} // `jsonData` has to be explicitly defined in the customized transaction in Oneledger protocol as json tag name
        };

        const assembledTx = util.assembleTxData(CustmoziedTxType, tx_dataObj, gasPrice, gasAdjustment);
        assembledTx.fee.gas = 400000
        const {gas} = assembledTx.fee;
        const feeEstimationResult = await util.txFeeEstimator(gas, gasPrice).catch(error => {
            return Promise.reject(error)
        });
        return Promise.resolve(ErrorUtil.responseWrap({...util.rawTxStructure(offlineSerialize.jsonObjectToBase64(assembledTx)), ...{feeEstimation: feeEstimationResult.response}}))
    }
```

Notice:
1. Oneledger SDK is able to support different type of transactions by different implementation of transaction prepare. Transaction prepare step will gather all data which transaction needed and encode it into `rawTx`.
2. `gasAdjustment` is used for providing more gas to speed up your transaction, it's `0` by default, we don't need to modify it.
3. `storeJsonTx` defined above will return you `rawTx` along with `feeEstimation` which gives you a heads-up about how much the transaction fee is gonna cost.
4. After your get `rawTx`, you can continue from [5. Sign Transaction](#signTx).  


To Learn more about Oneledger SDK, please go to [Full Documentation](https://oneledger.atlassian.net/wiki/spaces/EN/pages/562200577/3.1+SDK+Documentation).

