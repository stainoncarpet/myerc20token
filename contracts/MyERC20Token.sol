//SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.11 <0.9.0;

import "hardhat/console.sol";

/* 
Написать токен стандарта ERC-20
 Реализовать весь основной функционал контракта. Не наследовать от openzeppelin и прочих библиотек и не копировать код (!)
 Добавить функции mint и burn
 Написать полноценные тесты к контракту
 Написать скрипт деплоя
 Задеплоить в тестовую сеть
 Написать таски на transfer, transferFrom, approve
 Верифицировать контракт
Требования
Все ERC20 токены в сети должны удовлетворять стандарту описанному в eip.
Содержать полный набор функций из eip.
Реализация логики и ответственность за правильность лежит на вас, впрочем в сети полно примеров ERC20 токенов, где можно посмотреть как обычно выглядит реализация подобных токенов.
*/

// https://eips.ethereum.org/EIPS/eip-20
interface MyEIP20Interface {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);

    function balanceOf(address _owner) external view returns (uint256 balance);
    function transfer(address _to, uint256 _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
    function approve(address _spender, uint256 _value) external returns (bool success);
    function allowance(address _owner, address _spender) external view returns (uint256 remaining);

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}

contract MyERC20Token is MyEIP20Interface {
    address payable immutable public admin;
    // View functions
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    mapping(address => uint256) public balanceOf; // address user
    uint256 public totalSupply = 0;
    mapping(address => mapping(address => uint256)) public allowance; // address owner, address spender
    uint256 public constant TOKEN_PRICE_IN_WEI = 10**16; // contract receives some ether and mints tokens: 1 token per 0.01 ETH
    // DIVIDEND / DIVISOR = PERCENTAGE, e.g. 1 / 100 = 1%
    uint256 public constant BURN_DIVIDEND = 1;
    uint256 public constant BURN_DIVISOR = 100;

    // keep track of
        // balanceOf
        // totalSupply
        // allowance

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        admin = payable(msg.sender);
    }

    // accepts minimum 0.01 ETH
    modifier onlyMinimum() {
        require(msg.value >= 10**16, "Minimum amount of ETH accepted: 0.01 ETH");
        _;
    }

    receive() external payable onlyMinimum {
        mint(msg.value, msg.sender);
    }

    fallback() external payable onlyMinimum {
        mint(msg.value, msg.sender);
    }

    // Functions
    function transfer(address _to, uint256 _value) external returns (bool) {
        uint256 amountToBurn = _value * BURN_DIVIDEND / BURN_DIVISOR;
        //console.log("FROM TRANSFER: ", balanceOf[msg.sender], _value + amountToBurn);
        require(balanceOf[msg.sender] >= (_value + amountToBurn), "Insufficient balance");
        
        balanceOf[msg.sender] -= (_value + amountToBurn);
        balanceOf[_to] += _value;
        burn(amountToBurn);

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) external returns (bool) {
        uint256 amountToBurn = _value * BURN_DIVIDEND / BURN_DIVISOR;

        require(allowance[_from][msg.sender] >= (_value + amountToBurn), "Transfer amount exceeds allowance");
        require(balanceOf[_from] >= (_value + amountToBurn), "Allower's balance is not sufficiet");

        balanceOf[_from] -= (_value + amountToBurn);
        balanceOf[_to] += _value;

        burn(amountToBurn);
    }

    function approve(address _spender, uint256 _value) external returns (bool) {
        allowance[msg.sender][_spender] = _value;
        return true;
    }

    function increaseAllowance(address _spender, uint256 _amount) external returns (bool) {
        allowance[msg.sender][_spender] += _value;
        return true;
    }

    function decreaseAllowance(address _spender, uint256 _amount) external returns (bool) {
        allowance[msg.sender][_spender] -= _value;
        return true;
    }

    // Extra functions
    function mint(uint256 incomingWei, address sender) private {
        // in smallest units
        uint256 newlyMintedTokenAmount = incomingWei / TOKEN_PRICE_IN_WEI * (10**decimals);

        balanceOf[sender] += newlyMintedTokenAmount;
        totalSupply += newlyMintedTokenAmount;

        // send back remainder of incoming ETH
        uint256 remainingWei = incomingWei % TOKEN_PRICE_IN_WEI;
        payable(sender).transfer(remainingWei);
    }

    // burn 1% of transferred amount
    function burn(uint256 amountToBurn) private {
        totalSupply -= amountToBurn;
    }

    function extractEther() external {
        require(payable(msg.sender) == admin);
        admin.transfer(address(this).balance);
    }

    function destroyContract() external {
        require(msg.sender == admin);
        selfdestruct(admin);
    }
}
