/* eslint-disable prettier/prettier */
import { ethers } from "hardhat";

const main = async () => {
  const MyERC20Token = await ethers.getContractFactory("MyERC20Token");
  const myERC20Token = await MyERC20Token.deploy("MyERC20Token", "MERC");

  await myERC20Token.deployed();

  console.log("MyERC20Token deployed to:", myERC20Token.address, "by", await myERC20Token.signer.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
