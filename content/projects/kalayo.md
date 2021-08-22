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

## REST API
You can find the documentation of the current state of Kalayo's REST API in the [api module](https://github.com/KaiWitt/kalayo/tree/master/src/api).

## Privacy
Kalayo doesn't know anything about its customers except their transactions and a Bitcoin address which is used for signing. User authentication is handled by signing tokens with said Bitcoin address, which means that losing its private key results in losing the control of your Kalayo account.

## Requirements
Kalayo is developed with Rust 1.54.0, Bitcoin Core 0.21.0, MySQL and the up to date version of c-lightning. To run the server you need to configure the [config.toml](https://github.com/KaiWitt/kalayo/blob/master/config.toml) with your desired settings.