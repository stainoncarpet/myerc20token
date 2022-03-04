/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
import { task } from "hardhat/config";

declare global {
    namespace NodeJS {
      interface ProcessEnv {
        ETHERSCAN_API_KEY: string
        ROPSTEN_URL: string
        ALCHEMY_KEY: string
        METAMASK_PRIVATE_KEY: string
        COINMARKETCAP_API_KEY: string
        RINKEBY_URL: string
      }
    }
  }

const NETWORK = "rinkeby";

export const runTasks = () => {
    task("get", "Mint MyERC20Token be sending ETH")
        .addParam("address", "Contract address")
        .addParam("eth", "Amount of ETH to swap for MyERC20Token")
        .setAction(async (taskArguments, hre) => {
            const alchemyProvider = new hre.ethers.providers.AlchemyProvider(NETWORK, process.env.ALCHEMY_KEY);
            const walletOwner = new hre.ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, alchemyProvider);

            const donationTransaction = await walletOwner.sendTransaction({ to: taskArguments.address, value: taskArguments.eth});

            console.log("Receipt: ", donationTransaction);
        })
    ;

    task("transfer", "Send MyERC20Token to address")
        .addParam("address", "Contract address")
        .addParam("to", "Recipient address")
        .addParam("value", "How much MyERC20Token to transfer")
        .setAction(async (taskArguments, hre) => {
            const contractSchema = require("../artifacts/contracts/MyERC20Token.sol/MyERC20Token.json");

            const alchemyProvider = new hre.ethers.providers.AlchemyProvider(NETWORK, process.env.ALCHEMY_KEY);
            const walletOwner = new hre.ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, alchemyProvider);
            const contractInstance = new hre.ethers.Contract(taskArguments.address, contractSchema.abi, walletOwner);

            const transferTx = await contractInstance.transfer(taskArguments.to, taskArguments.value);
            
            console.log("Receipt: ", transferTx);
        })
    ;

    task("transferfrom", "Send MyERC20Token from one address to another")
        .addParam("address", "Contract address")
        .addParam("from", "Payer address")
        .addParam("to", "Recipient address")
        .addParam("value", "How much MyERC20Token to transfer")
        .setAction(async (taskArguments, hre) => {
            const contractSchema = require("../artifacts/contracts/MyERC20Token.sol/MyERC20Token.json");

            const alchemyProvider = new hre.ethers.providers.AlchemyProvider(NETWORK, process.env.ALCHEMY_KEY);
            const walletOwner = new hre.ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, alchemyProvider);
            const contractInstance = new hre.ethers.Contract(taskArguments.address, contractSchema.abi, walletOwner);

            const transferTx = await contractInstance.transferFrom(taskArguments.from, taskArguments.to, taskArguments.value);
            
            console.log("Receipt: ", transferTx);
        })
    ;

    task("approve", "Allow address to spend on your behalf")
        .addParam("address", "Contract address")
        .addParam("spender", "ЫSpender address")
        .addParam("value", "How much MyERC20Token to transfer")
        .setAction(async (taskArguments, hre) => {
            const contractSchema = require("../artifacts/contracts/MyERC20Token.sol/MyERC20Token.json");

            const alchemyProvider = new hre.ethers.providers.AlchemyProvider(NETWORK, process.env.ALCHEMY_KEY);
            const walletOwner = new hre.ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, alchemyProvider);
            const contractInstance = new hre.ethers.Contract(taskArguments.address, contractSchema.abi, walletOwner);

            const approveTx = await contractInstance.approve(taskArguments.spender, taskArguments.value);
            
            console.log("Receipt: ", approveTx);
        })
    ;

    task("destroy", "Destroy contract")
    .addParam("address", "Contract address")
    .setAction(async (taskArguments, hre) => {
        const contractSchema = require("../artifacts/contracts/MyERC20Token.sol/MyERC20Token.json");

        const alchemyProvider = new hre.ethers.providers.AlchemyProvider(NETWORK, process.env.ALCHEMY_KEY);
        const walletOwner = new hre.ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, alchemyProvider);
        const contractInstance = new hre.ethers.Contract(taskArguments.address, contractSchema.abi, walletOwner);

        const approveTx = await contractInstance.destroyContract();
        
        console.log("Receipt: ", approveTx);
    })
    ;
};