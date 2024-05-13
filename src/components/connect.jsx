import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { AccountState } from '../recoil';
import { ethers } from 'ethers';

export default function Connect() {
    const navigate = useNavigate();
    const [account, setAccount] = useRecoilState(AccountState);

    const connectWallet = async () => {
        console.log("Connecting to wallet...");
        try {
            // Detecting MetaMask's provider
            const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
            // Prompt user to request their accounts
            await provider.send("eth_requestAccounts", []);

            const signer = provider.getSigner();
            const address = await signer.getAddress();
            console.log(address, "Wallet address");

            // Set account and navigate if successful
            setAccount(address);
            navigate("/account");
        } catch (error) {
            console.error("Error connecting to wallet:", error);
            // Handle errors such as user rejecting connection
        }
    };

    return (
        <button className='text-slate-700 bg-red-600 rounded-lg px-6 py-2' onClick={connectWallet}>
            Connect Wallet
        </button>
    );
}