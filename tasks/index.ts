/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
import { task } from "hardhat/config";

declare global {
    namespace NodeJS {
      interface ProcessEnv {
        METAMASK_PRIVATE_KEY: string
      }
    }
  }

const network = "rinkeby";
const API_TOKEN = "";

export const runTasks = () => {
    task("get", "Purchase MyERC20Token with ETH")
        .addParam("address", "Contract address")
        .addParam("eth", "Amount of ETH to swap for MyERC20Token")
        .setAction(async (taskArguments, hre) => {
            const alchemyProvider = new hre.ethers.providers.AlchemyProvider(network, API_TOKEN);
            const walletOwner = new hre.ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, alchemyProvider);

            const donationTransaction = await walletOwner.sendTransaction({ to: taskArguments.address, value: taskArguments.eth});

            console.log("Receipt: ", donationTransaction);
        })
    ;

    task("transfer", "Send wei to contract")
        .addParam("address", "Contract address")
        .addParam("to", "Recipient address")
        .addParam("value", "How much MyERC20Token to transfer")
        .setAction(async (taskArguments, hre) => {
            const contractSchema = require("../artifacts/contracts/MyERC20Token.sol/MyERC20Token.json");

            const alchemyProvider = new hre.ethers.providers.AlchemyProvider(network, API_TOKEN);
            const walletOwner = new hre.ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, alchemyProvider);
            const contractInstance = new hre.ethers.Contract(taskArguments.address, contractSchema.abi, walletOwner);

            const transferTx = await contractInstance.transfer(taskArguments.to, taskArguments.value);
            
            console.log("Receipt: ", transferTx);
        })
    ;

    task("transferfrom", "Send wei to contract")
        .addParam("address", "Contract address")
        .addParam("from", "Payer address")
        .addParam("to", "Recipient address")
        .addParam("value", "How much MyERC20Token to transfer")
        .setAction(async (taskArguments, hre) => {
            const contractSchema = require("../artifacts/contracts/MyERC20Token.sol/MyERC20Token.json");

            const alchemyProvider = new hre.ethers.providers.AlchemyProvider(network, API_TOKEN);
            const walletOwner = new hre.ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, alchemyProvider);
            const contractInstance = new hre.ethers.Contract(taskArguments.address, contractSchema.abi, walletOwner);

            const transferTx = await contractInstance.transferFrom(taskArguments.from, taskArguments.to, taskArguments.value);
            
            console.log("Receipt: ", transferTx);
        })
    ;

    task("approve", "Send wei to contract")
        .addParam("address", "Contract address")
        .addParam("spender", "Allow address to spend")
        .addParam("value", "How much MyERC20Token to transfer")
        .setAction(async (taskArguments, hre) => {
            const contractSchema = require("../artifacts/contracts/MyERC20Token.sol/MyERC20Token.json");

            const alchemyProvider = new hre.ethers.providers.AlchemyProvider(network, API_TOKEN);
            const walletOwner = new hre.ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, alchemyProvider);
            const contractInstance = new hre.ethers.Contract(taskArguments.address, contractSchema.abi, walletOwner);

            const approveTx = await contractInstance.approve(taskArguments.spender, taskArguments.value);
            
            console.log("Receipt: ", approveTx);
        })
    ;
};