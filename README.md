# Staking dApp

## Contract

```bash
yarn install

npx hardhat test test/unit/Staker.test.js

npx hardhat deploy --tags staker,frontend --network matic
# or
npx hardhat deploy --tags staker,frontend --network goerli

#build frontend
npx hardhat deploy --tags staker,frontend

# start local blockchain node
npx hardhat node
npx hardhat deploy --tags all --network localhost

# script for local blockchain
npx hardhat run script/staker-script.js --network localhost
```

## Frontend

```bash
yarn install

yarn dev
```