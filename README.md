# khala-chainbridge-graph
Phala ChainBridge index service build upon TheGraph protocol

## Build & Deployment

### Kovan testnet deployment

```sh
graph auth --product hosted-service <ACCESS KEY>
yarn codegen ./subgraph-kovan.yaml
yarn build ./subgraph-kovan.yaml
graph deploy --product hosted-service <GRAPH NAME> ./subgraph-kovan.yaml
```

### Ethereum mainnet deployment

```sh
graph auth --studio <ACCESS KEY>
yarn codegen ./subgraph-mainnet.yaml
yarn build ./subgraph-mainnet.yaml
graph deploy --studio <GRAPH NAME> ./subgraph-mainnet.yaml
```

### Moonbase testnet Deployment

```sh
graph auth --product hosted-service <ACCESS KEY>
yarn codegen ./subgraph-moonbase.yaml
yarn build ./subgraph-moonbase.yaml
graph deploy --product hosted-service <GRAPH NAME> ./subgraph-moonbase.yaml
```

## Moonriver deployment

```sh
graph auth --product hosted-service <ACCESS KEY>
yarn codegen ./subgraph-moonriver.yaml
yarn build ./subgraph-moonriver.yaml
graph deploy --product hosted-service <GRAPH NAME> ./subgraph-moonriver.yaml
```

## Query data

Example query commands

```sh
{
  bridgeInboundingRecords(first:1, orderBy:createdAt, orderDirection: asc) {
    depositNonce
    originChainId
    resourceId
    executeTx {
      hash
    }
  }
  
  erc20Depositeds(first: 1, orderBy: createdAt, orderDirection: asc) {
    recipient
    amount
    token
    tx {
      hash
    }
  }
}
```

Corresponding responses

```sh
{
  "data": {
    "bridgeInboundingRecords": [
      {
        "depositNonce": "9",
        "originChainId": 1,
        "resourceId": "0x00e6dfb61a2fb903df487c401663825643bb825d41695e63df8af6162ab145a6",
        "executeTx": {
          "hash": "0x1c5127f5a0c22086a304fa2fc6625a8cd708b34725e94fc588239305917065c8"
        }
      }
    ],
    "erc20Depositeds": [
      {
        "recipient": "0xa29d4e0f035cb50c0d78c8cebb56ca292616ab20",
        "amount": "1000000000000000000",
        "token": "0x512f7a3c14b6ee86c2015bc8ac1fe97e657f75f2",
        "tx": {
          "hash": "0x1c5127f5a0c22086a304fa2fc6625a8cd708b34725e94fc588239305917065c8"
        }
      }
    ]
  }
}
```