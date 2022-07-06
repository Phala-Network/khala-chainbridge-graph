# khala-chainbridge-graph
Phala ChainBridge index service build upon TheGraph protocol

## Deployment

### Kovan testnet deployment

```sh
graph auth --product hosted-service <ACCESS KEY>
yarn codegen ./subgraph-kovan.yaml
graph deploy --product hosted-service <GRAPH NAME> ./subgraph-kovan.yaml
```

### Ethereum mainnet deployment

```sh
graph auth --studio <ACCESS KEY>
yarn codegen ./subgraph-mainnet.yaml
graph deploy --studio <GRAPH NAME> ./subgraph-mainnet.yaml
```

### Moonbase testnet Deployment

```sh
graph auth --product hosted-service <ACCESS KEY>
yarn codegen ./subgraph-moonbase.yaml
graph deploy --product hosted-service <GRAPH NAME> ./subgraph-moonbase.yaml
```

## Moonriver deployment

```sh
graph auth --product hosted-service <ACCESS KEY>
yarn codegen ./subgraph-moonriver.yaml
graph deploy --product hosted-service <GRAPH NAME> ./subgraph-moonriver.yaml
```