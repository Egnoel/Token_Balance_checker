"use client";
import { useState } from "react";
import Web3 from "web3";
import BN from 'bn.js';

interface Balance {
  symbol: string;
  balance: string;
}

export default function Home() {
  const [inputName, setInputName] = useState("");
  const [isValidAddress, setIsValidAddress] = useState(true);
  const [balances, setBalances] = useState<Balance[]>([]);
  
  const infuraUrl = `https://mainnet.infura.io/v3/b4624954accb4054ac63e72d9c8cd999`;
  const web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));

  // ABI mínimo para interagir com contratos ERC-20
  const minABI = [
    // balanceOf
    {
      "constant": true,
      "inputs": [{ "name": "_owner", "type": "address" }],
      "name": "balanceOf",
      "outputs": [{ "name": "balance", "type": "uint256" }],
      "type": "function"
    },
    // decimals
    {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [{ "name": "", "type": "uint8" }],
      "type": "function"
    },
    // name
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [{ "name": "", "type": "string" }],
      "type": "function"
    },
    // symbol
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [{ "name": "", "type": "string" }],
      "type": "function"
    }
  ];

  // Lista de tokens ERC-20 populares com seus endereços de contrato
  const tokens = [
    {
      symbol: 'USDT',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    },
    {
      symbol: 'USDC',
      address: '0xA0b86991c6218b36c1d19D4a2e9EB0cE3606EB48'
    },
    {
      symbol: 'DAI',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    },
    // Adicione mais tokens conforme necessário
  ];

  // Função para formatar o saldo baseado nos decimais usando BN.js
  const formatBalanceBN = (balance: string, decimals: number): string => {
    const balanceBN = new BN(balance);
    const divisor = new BN(10).pow(new BN(decimals));
    const integerPart = balanceBN.div(divisor).toString();
    const fractionalPart = balanceBN.mod(divisor).toString().padStart(decimals, '0');

    // Remove zeros à direita da parte fracionária
    const trimmedFractional = fractionalPart.replace(/0+$/, '');

    return trimmedFractional ? `${integerPart}.${trimmedFractional}` : integerPart;
  };

  const checkBalances = async () => {
    if (!web3.utils.isAddress(inputName)) {
      setIsValidAddress(false);
      setBalances([]);
      return;
    }
    try {
      setIsValidAddress(true);
      const newBalances: Balance[] = [];
      for (const token of tokens) {
        const contract = new web3.eth.Contract(minABI, token.address);
        // Type assertions para garantir que os retornos são strings
        const balanceRaw = await contract.methods.balanceOf(inputName).call() as string;
        const decimalsRaw = await contract.methods.decimals().call() as string;
        const symbol = await contract.methods.symbol().call() as string;
        // Converter decimals para number
        const decimals: number = parseInt(decimalsRaw, 10);
        // Formatar o saldo usando BN.js
        const formattedBalance: string = formatBalanceBN(balanceRaw, decimals);
        if (parseFloat(formattedBalance) > 0) {
          newBalances.push({ symbol: symbol, balance: formattedBalance });
        }
      }
      setBalances(newBalances);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white p-5 rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] w-[400px] text-center">
        <h1>Verificador de Saldo de Tokens ERC-20</h1>
        <input
          type="text"
          placeholder="Insira o endereço Ethereum"
          className="w-[80%] p-3 mb-3 border-[1px] border-solid border-[#ccc] rounded-md"
          onChange={(e) => setInputName(e.target.value)}
        />
        <button
          onClick={() => checkBalances()}
          type="button"
          className="py-2 px-2 border-none bg-[#28a745] text-white rounded-md cursor-pointer hover:bg-[#218838]"
        >
          Verificar Saldo
        </button>
        <div className="text-left mt-5">
          {isValidAddress ? (
            balances.length > 0 ? (
              balances.map((token, index) => (
                <div key={index} className="flex gap-3">
                  <p>{token.symbol}</p>
                  <p>{token.balance}</p>
                </div>
              ))
            ) : (
              <p>Nenhum saldo encontrado para os tokens listados.</p>
            )
          ) : (
            <p style={{ color: 'red' }}>Endereço inválido. Por favor, verifique se o endereço está correto.</p>
          )}
        </div>
      </div>
    </div>
  );
}
