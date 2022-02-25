/* eslint-disable prettier/prettier */
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyERC20Token", () => {
  it("Should mint correct amount depending on incoming eth", async () => {
    const MyERC20Token = await ethers.getContractFactory("MyERC20Token");
    const myERC20Token = await MyERC20Token.deploy("MyERC20Token", "MERC");
    await myERC20Token.deployed();

    const signers = await ethers.getSigners();

    const tokenDecimals = await myERC20Token.decimals();

    const mintTx = signers[1].sendTransaction({
      value: ethers.utils.parseEther("1.0"),
      to: myERC20Token.address
    });

    await expect(mintTx)
      .to.emit(myERC20Token, "Transfer")
      .withArgs("0x0000000000000000000000000000000000000000", signers[1].address, ethers.utils.parseUnits("100", tokenDecimals))
    ;

    // 1 ETH should be equal 100 MyERC20Token
    const balanceInSmallestTokenUnits = await myERC20Token.balanceOf(signers[1].address);
    const balanceInNormalTokenUnits = parseFloat(ethers.utils.formatUnits(balanceInSmallestTokenUnits, tokenDecimals))

    expect(balanceInNormalTokenUnits).to.equal(100);
    expect(await myERC20Token.totalSupply()).to.equal(balanceInSmallestTokenUnits);

    // mint tokens through fallback function
    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("1.0"),
      to: myERC20Token.address,
      data: (new ethers.utils.AbiCoder).encode(["string"], ["some data"])
    });

    // 200 tokens should exist and belong to signer[1]
    const balanceInSmallestTokenUnits2 = await myERC20Token.balanceOf(signers[1].address);
    const balanceInNormalTokenUnits2 = parseFloat(ethers.utils.formatUnits(balanceInSmallestTokenUnits2, tokenDecimals))

    expect(balanceInNormalTokenUnits2).to.equal(200);
    expect(await myERC20Token.totalSupply()).to.equal(balanceInSmallestTokenUnits2);

    const tx = signers[1].sendTransaction({
      value: ethers.utils.parseEther("0.00001"),
      to: myERC20Token.address
    });

    expect(tx).to.be.revertedWith("Minimum amount of ETH accepted: 0.01 ETH");
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

    // test may fail if gas reporter is enabled (gas reporter overrides test command), coverage doesn't fail
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

  it("Should transfer through allowance", async () => {
    const MyERC20Token = await ethers.getContractFactory("MyERC20Token");
    const myERC20Token = await MyERC20Token.deploy("MyERC20Token", "MERC");
    await myERC20Token.deployed();

    const signers = await ethers.getSigners();

    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("1.0"),
      to: myERC20Token.address
    });

    const tokenDecimals = await myERC20Token.decimals();

    const fiftyTokens = ethers.utils.parseUnits("50", tokenDecimals);

    // create allowance for 50 MyERC20Token and check if allowance is registered
    await myERC20Token.connect(signers[1]).approve(signers[2].address, fiftyTokens);
    expect(
      await myERC20Token.allowance(signers[1].address, signers[2].address)
    )
      .to.be.equal(fiftyTokens);

    // try to transfer more than allowed
    expect(myERC20Token.connect(signers[2]).transferFrom(signers[1].address, signers[3].address, ethers.utils.parseUnits("51", tokenDecimals)))
      .to.be.revertedWith("Allowance exceeded")
      ;

    // try to transfer 50 tokens 
    expect(await myERC20Token.connect(signers[2]).transferFrom(signers[1].address, signers[3].address, fiftyTokens))
      .to.emit(myERC20Token, "Transfer")
      .withArgs(signers[1].address, signers[3].address, fiftyTokens)
      ;

    // check if allowance was consumed
    expect(
      await myERC20Token.allowance(signers[1].address, signers[2].address)
    )
      .to.be.equal(0);

    // check if target address received tokens
    expect(
      await myERC20Token.balanceOf(signers[3].address)
    )
      .to.be.equal(fiftyTokens);


    // try to transfer exact balance through allowance
    await signers[15].sendTransaction({
      value: ethers.utils.parseEther("0.5"),
      to: myERC20Token.address
    });

    await myERC20Token.connect(signers[15]).approve(signers[16].address, fiftyTokens)

    expect(myERC20Token.connect(signers[16]).transferFrom(signers[15].address, signers[17].address, fiftyTokens))
      .to.be.revertedWith("Allower's balance is not sufficient")
      ;
  });

  it("Admin should be able to extract ether", async () => {
    const MyERC20Token = await ethers.getContractFactory("MyERC20Token");
    const myERC20Token = await MyERC20Token.deploy("MyERC20Token", "MERC");
    await myERC20Token.deployed();

    const signers = await ethers.getSigners();

    const addressBalanceBeforeTransfer = ethers.utils.formatEther(await signers[1].getBalance());

    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("3.0"),
      to: myERC20Token.address
    });

    const addressBalanceAfterTransfer = ethers.utils.formatEther(await signers[1].getBalance());

    expect(parseInt(addressBalanceBeforeTransfer) - parseInt(addressBalanceAfterTransfer)).to.be.equal(3);

    const adminBalanceBeforeExtraction = ethers.utils.formatEther(await signers[0].getBalance());

    await expect(myERC20Token.connect(signers[5]).extractEther()).to.be.revertedWith("Only admin can trigger ether extraction");

    await myERC20Token.extractEther();

    const adminBalanceAfterExtraction = ethers.utils.formatEther(await signers[0].getBalance());

    expect(parseInt(adminBalanceAfterExtraction) - parseInt(adminBalanceBeforeExtraction)).to.be.equal(3);
  });

  it("Should increase and decrease allowance correctly", async () => {
    const MyERC20Token = await ethers.getContractFactory("MyERC20Token");
    const myERC20Token = await MyERC20Token.deploy("MyERC20Token", "MERC");
    await myERC20Token.deployed();

    const signers = await ethers.getSigners();

    const tokenDecimals = await myERC20Token.decimals();

    const fiftyTokens = ethers.utils.parseUnits("50", tokenDecimals);
    const seventyfiveTokens = ethers.utils.parseUnits("75", tokenDecimals);
    const onehundredtwentyfiveTokens = ethers.utils.parseUnits("125", tokenDecimals);

    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("3.0"),
      to: myERC20Token.address
    });

    expect(await myERC20Token.connect(signers[1]).approve(signers[2].address, fiftyTokens))
      .to.emit(myERC20Token, "Approval")
      .withArgs(signers[1].address, signers[2].address, fiftyTokens)
      ;

    // increase allowance by 75 tokens
    expect(await myERC20Token.allowance(signers[1].address, signers[2].address)).to.be.equal(fiftyTokens);
    await myERC20Token.connect(signers[1]).increaseAllowance(signers[2].address, seventyfiveTokens);
    expect(await myERC20Token.allowance(signers[1].address, signers[2].address)).to.be.equal(onehundredtwentyfiveTokens);

    // decrease allowance by 50 tokens
    await myERC20Token.connect(signers[1]).decreaseAllowance(signers[2].address, fiftyTokens);
    expect(await myERC20Token.allowance(signers[1].address, signers[2].address)).to.be.equal(seventyfiveTokens);

    // check if balance doesn't go negative
    await myERC20Token.connect(signers[1]).decreaseAllowance(signers[2].address, onehundredtwentyfiveTokens);
    expect(await myERC20Token.allowance(signers[1].address, signers[2].address)).to.be.equal(0);
  });

  it("Should destroy contract and send eth to admin", async () => {
    const MyERC20Token = await ethers.getContractFactory("MyERC20Token");
    const myERC20Token = await MyERC20Token.deploy("MyERC20Token", "MERC");
    await myERC20Token.deployed();

    const signers = await ethers.getSigners();

    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("10.0"),
      to: myERC20Token.address
    });

    const adminBalanceBeforeDestruction = parseFloat(ethers.utils.formatEther(await signers[0].getBalance()));

    await expect(
      myERC20Token.connect(signers[3]).destroyContract()
    )
    .to.be.revertedWith("Only admin can trigger contract destruction");

    await myERC20Token.destroyContract();

    const adminBalanceAfterDestruction = parseFloat(ethers.utils.formatEther(await signers[0].getBalance()));
    expect(Math.ceil(adminBalanceAfterDestruction - adminBalanceBeforeDestruction)).to.be.equal(10);
  });

  it("Should stop minting new tokens if max supply reached", async () => {
    const MyERC20Token = await ethers.getContractFactory("MyERC20Token");
    const myERC20Token = await MyERC20Token.deploy("MyERC20Token", "MERC");
    await myERC20Token.deployed();

    const signers = await ethers.getSigners();

    await signers[1].sendTransaction({
      value: ethers.utils.parseEther("999.99"),
      to: myERC20Token.address
    });

    const tokenDecimals = await myERC20Token.decimals();

    // 1000 ETH should be equal 100000 MyERC20Token
    const balanceInSmallestTokenUnits = await myERC20Token.balanceOf(signers[1].address);
    const balanceInNormalTokenUnits = parseFloat(ethers.utils.formatUnits(balanceInSmallestTokenUnits, tokenDecimals))

    expect(balanceInNormalTokenUnits).to.equal(99999);
    expect(await myERC20Token.totalSupply()).to.equal(balanceInSmallestTokenUnits);
    expect(
      parseFloat(ethers.utils.formatUnits((await myERC20Token.totalSupply()), tokenDecimals))
    ).to.equal(
      parseFloat(ethers.utils.formatUnits((await myERC20Token.MAX_SUPPLY()), tokenDecimals)) - 1
    );

    const mintMoreTx = signers[2].sendTransaction({
      value: ethers.utils.parseEther("1"),
      to: myERC20Token.address
    });

    expect(mintMoreTx).to.be.revertedWith("Maximum MyERC20Token supply reached");
  });
});
