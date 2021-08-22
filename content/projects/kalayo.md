+++
title = "kalayo (Work in progress)"
description = ""
weight = 1

[taxonomies]
tags = ["rust", "bitcoin", "lightning", "mysql", "redis", "api", "rest"]

[extra]
project = true
repo = "https://github.com/KaiWitt/kalayo"
link = ""
+++

Kalayo is an async webserver with a REST API for custodial Bitcoin banking whose cold wallet is managed by a multisig scheme. It allows customers to transact with other kalayo users free of charge, batch on-chain transactions with other users to save network fees and send and receive payments over the Lightning network without managing channels. It can also be used as a custodial coin mixer and liquidity provider for the Lightning network.


<!-- more -->
## Roadmap
This project is still work in progress. The following list shows the current implemented features and those that are soon to be worked on.
- [x] User accounts.
- [x] User authentication via message signing with Bitcoin addresses.
- [ ] Hot wallet which uses Bitcoin Core, and allows users to fund their accounts.
- [ ] Send/receive within the Kalayo system aswell as on-chain with the option to batch transactions.
- [ ] Federated cold wallet
- [ ] Coin mixing feature which guarantees customers to receive unrelated UTXOs
- [ ] Lightning network integration
- [ ] Lightning network liquidity vendor
- [ ] Automated Lightning network channel management

## Privacy
Kalayo doesn't know anything about its customers except their transactions and a Bitcoin address which is used for signing. User authentication is handled by signing tokens with said Bitcoin address, which means that losing its private key results in losing the control of your Kalayo account.

## Requirements
Kalayo is developed with Rust 1.54.0, Bitcoin Core 0.21.0, MySQL and the up to date version of c-lightning. To run the server you need to configure the [config.toml](https://github.com/KaiWitt/kalayo/blob/master/config.toml) with your desired settings.

## Kalayo HTTP API
Current implemented API endpoints.
Endpoints that are marked with `$` require user authentication by using the HTTP Basic Auth scheme. 
Username is the signing address of the user and the password is a signed token. How to get signable tokens is described below in the token resource.


### Users
#### `GET v1/user/:address $`
Returns a user object if you can proof ownership of `:address`.
```json
Example response:
{
    "address": "bc1q9muf0c092ag3arxxh9ctmx9gg2chd2wquz8u35",
    "username": null,
    "funded": false
}
```

#### `GET v1/user/name/:username $`
Returns information about the availability of a username. Authentication is required but any user can check the availability of every username.
```json
Example response:
{
    "username": "satoshi",
    "available": false
}
```

#### `POST v1/user`
Creates a user by registering a Bitcoin address for signing and identification purposes. The address of the created account can't be changed.
```json
Example input:
{
    "address": "bc1q9muf0c092ag3arxxh9ctmx9gg2chd2wquz8u35",
}

Example response:
{
    "address": "bc1q9muf0c092ag3arxxh9ctmx9gg2chd2wquz8u35",
    "username": null,
    "funded": false
}
```

#### `PUT v1/user/:address $`
Updates a user's username if you can proof ownership of `:address`.
```json
Example input:
{
    "username": "nakamoto",
}

Example response:
{
    "address": "bc1q9muf0c092ag3arxxh9ctmx9gg2chd2wquz8u35",
    "username": "nakamoto",
    "funded": false
}
```
#### `DELETE v1/user/:address $`
Deletes a user if you can proof ownership of `:address`.

### Tokens
#### `GET v1/token/:address`
Returns the current token of `:address`.
```json
Example response:
{
    "token": "eNAv1NlGG7inZEtQM9sXvl2D3sXwu1ueIIaLKgY7IDjndkD0tyG049LcnpJneuev"
}
```