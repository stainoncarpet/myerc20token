/* eslint-disable prettier/prettier */
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyERC20Token", () => {
  it("Should mint correct amount depending on incoming eth", async () => {
    const MyERC20Token = await ethers.getContractFactory("MyERC20Token");
    const myERC20Token = await MyERC20Token.deploy("MyERC20Token", "MERC");
    await myERC20Token.deployed();

    const signers = await ethers.getSigners();

    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("1.0"),
      to: myERC20Token.address
    });

    const tokenDecimals = await myERC20Token.decimals();

    // 1 ETH should be equal 100 MyERC20Token
    const balanceInSmallestTokenUnits = await myERC20Token.balanceOf(signers[1].address);
    const balanceInNormalTokenUnits = parseFloat(ethers.utils.formatUnits(balanceInSmallestTokenUnits, tokenDecimals))

    expect(balanceInNormalTokenUnits).to.equal(100);
    expect(await myERC20Token.totalSupply()).to.equal(balanceInSmallestTokenUnits);
  });

  it("Should return unused wei", async () => {
    const MyERC20Token = await ethers.getContractFactory("MyERC20Token");
    const myERC20Token = await MyERC20Token.deploy("MyERC20Token", "MERC");
    await myERC20Token.deployed();

    const signers = await ethers.getSigners();

    // send exact amount to purchase 1 MyERC20Token, no way should be returned
    const beforeSend1 = ethers.utils.formatEther(await signers[1].getBalance());

    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("0.0100"),
      to: myERC20Token.address
    });

    const afterSend1 = ethers.utils.formatEther(await signers[1].getBalance());

    const balanceDifferenceWithoutReturn = (parseFloat(beforeSend1) - parseFloat(afterSend1));

    // send more than enough to purchase 1 MyERC20Token, but less than enough to purchase 2, wei should be returned
    const beforeSend2 = ethers.utils.formatEther(await signers[1].getBalance());

    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("0.0199"),
      to: myERC20Token.address
    });

    const afterSend = ethers.utils.formatEther(await signers[1].getBalance());

    const balanceDifferenceWithReturn = (parseFloat(beforeSend2) - parseFloat(afterSend));

    // difference with and without wei return should be much less than 0.0199 - 0.0100
    expect(
      Math.abs(balanceDifferenceWithoutReturn - balanceDifferenceWithReturn)
    ).to.lessThanOrEqual(0.0001);

    // 2 MyERC20Token should exist
    const tokenDecimals = await myERC20Token.decimals();
    const balanceInSmallestTokenUnits = await myERC20Token.balanceOf(signers[1].address);
    const balanceInNormalTokenUnits = parseFloat(ethers.utils.formatUnits(balanceInSmallestTokenUnits, tokenDecimals))

    expect(balanceInNormalTokenUnits).to.equal(2);
    expect(await myERC20Token.totalSupply()).to.equal(balanceInSmallestTokenUnits);
  });

  it("Should transfer and burn correct amount of MyERC20Token", async () => {
    const MyERC20Token = await ethers.getContractFactory("MyERC20Token");
    const myERC20Token = await MyERC20Token.deploy("MyERC20Token", "MERC");
    await myERC20Token.deployed();

    const signers = await ethers.getSigners();

    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("1.0"),
      to: myERC20Token.address
    });

    const tokenDecimals = await myERC20Token.decimals();

    // 1 ETH should be equal 100 MyERC20Token
    const balanceInSmallestTokenUnits = await myERC20Token.balanceOf(signers[1].address);
    const balanceInNormalTokenUnits = parseFloat(ethers.utils.formatUnits(balanceInSmallestTokenUnits, tokenDecimals))

    expect(balanceInNormalTokenUnits).to.equal(100);
    expect(await myERC20Token.totalSupply()).to.equal(balanceInSmallestTokenUnits);

    // need 101 tokens to transfer 100 tokens, 1 is burned
    const transferPromise = myERC20Token.connect(signers[1]).transfer(signers[2].address, ethers.utils.parseUnits("100", tokenDecimals))
    expect(transferPromise).to.be.revertedWith("Insufficient balance");

    // purchase missing token
    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("0.01"),
      to: myERC20Token.address
    });

    const balanceInSmallestTokenUnits2 = await myERC20Token.balanceOf(signers[1].address);
    const balanceInNormalTokenUnits2 = parseFloat(ethers.utils.formatUnits(balanceInSmallestTokenUnits2, tokenDecimals))

    expect(balanceInNormalTokenUnits2).to.equal(101);
    expect(await myERC20Token.totalSupply()).to.equal(balanceInSmallestTokenUnits2);

    // try to transfer 100 tokens again, this time it should  work
    await expect(
      myERC20Token.connect(signers[1]).transfer(signers[2].address, ethers.utils.parseUnits("100", tokenDecimals))
    )
    .to.emit(myERC20Token, "Transfer")
    .withArgs(signers[1].address, signers[2].address, ethers.utils.parseUnits("100", tokenDecimals))
    ;

    // check if correct token amount exists
    expect(await myERC20Token.totalSupply()).to.equal(ethers.utils.parseUnits("100", tokenDecimals));
  });
});
