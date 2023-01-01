const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { parseEther } = require("ethers/lib/utils")
const { developmentChains, networkConfig } = require("../../helper-hardhat.config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Staker Unit Tests", function () {
          let stakerContract, owner

          beforeEach(async () => {
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              owner = accounts[0]
              await deployments.fixture(["staker"])
              stakerContract = await ethers.getContract("Staker") // Returns a new connection to the contract

              //top up contract to pay interest
              console.log("top up", stakerContract.address)
              await owner.sendTransaction({
                  to: stakerContract.address,
                  value: ethers.utils.parseEther("1"),
                  gasLimit: "1500000",
              })
          })

          describe("stake", function () {
              it("should be able to stake", async () => {
                  var startingBalance = await stakerContract.stakes(owner.address)
                  startingBalance = startingBalance.balance
                  console.log("startingBalance", ethers.utils.formatEther(startingBalance))

                  var amount = "0.1"
                  const stakeResult = await stakerContract.stake({
                      value: ethers.utils.parseEther(amount),
                  })
                  await stakeResult.wait() // Waiting for confirmation...

                  var newBalance = await stakerContract.stakes(owner.address)
                  newBalance = newBalance.balance
                  console.log("newBalance", ethers.utils.formatEther(newBalance))
                  expect(newBalance).to.equal(
                      startingBalance.add(ethers.utils.parseEther(amount)),
                      "Error with staking, balance did not increase enough."
                  )
              })

              it("should be able to withdraw", async () => {
                  var withdrawalTimeLeft1 = await stakerContract.withdrawalTimeLeft()
                  withdrawalTimeLeft1 = withdrawalTimeLeft1.toNumber()
                  console.log("withdrawalTimeLeft1", withdrawalTimeLeft1)
                  expect(withdrawalTimeLeft1).to.greaterThan(
                      0,
                      "Error while expecting the time left to be greater than 0."
                  )

                  var stakeResult = await stakerContract.stake({
                      value: ethers.utils.parseEther("1"),
                  })
                  await stakeResult.wait() // Waiting for confirmation...
                  await ethers.provider.send("evm_increaseTime", [withdrawalTimeLeft1])
                  await ethers.provider.send("evm_mine")

                  const withdrawalTimeLeft2 = await stakerContract.withdrawalTimeLeft()
                  console.log("withdrawalTimeLeft2", withdrawalTimeLeft2.toNumber())
                  expect(withdrawalTimeLeft2.toNumber()).to.equal(
                      0,
                      "Error while expecting time left to be 0."
                  )

                  var withdrawResult = await stakerContract.withdraw()
                  const receipt = await withdrawResult.wait()
                  for (const event of receipt.events) {
                      console.log(`Event ${event.event} with args ${event.args}`)
                  }

                  var newBalance = await stakerContract.stakes(owner.address)
                  newBalance = newBalance.balance
                  console.log("newBalance", ethers.utils.formatEther(newBalance))
                  expect(newBalance).to.equal(0, "Error with withdraw, balance should reset to 0.")
              })
          })
      })
