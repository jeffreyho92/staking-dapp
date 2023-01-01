const { frontEndContractsFile, frontEndAbiFile } = require("../helper-hardhat.config")
const fs = require("fs")
const { network } = require("hardhat")

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

async function updateAbi() {
    const file = fs.readFileSync("./artifacts/contracts/Staker.sol/Staker.json", "utf8")
    const json = JSON.parse(file)
    const abi = JSON.stringify(json.abi)
    fs.writeFileSync(frontEndAbiFile, abi)
}

async function updateContractAddresses() {
    const Staker = await ethers.getContract("Staker")
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    contractAddresses[network.config.chainId.toString()] = [Staker.address]
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}
module.exports.tags = ["frontend"]
