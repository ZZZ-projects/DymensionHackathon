New Connect.jsx:
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

New Index.jsx:
import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import { useRecoilValue } from 'recoil';
import { AccountState } from '../../recoil';
import { ethers } from 'ethers';
import abi from "../../abi/bet.json";
import { Link } from 'react-router-dom';

const address = "0xeb8a5b71Fa5cA86fB472D111D1aBD2d779933D70";

export default function Account() {
    const account = useRecoilValue(AccountState);
    const [bal, setBal] = useState();
    const [provider, setProvider] = useState(new ethers.providers.JsonRpcProvider("https://dymension-evm.blockpi.network/v1/rpc/public"));
    const [contract, setContract] = useState(new ethers.Contract(address, abi, provider));

    useEffect(() => {
        const getBalance = async () => {
            try {
                const signer = provider.getSigner(account);
                const contractWithSigner = contract.connect(signer);
                const balance = await contractWithSigner.getUserBalance(account);
                setBal(ethers.utils.formatEther(balance));
                console.log(balance.toString());
            } catch (e) {
                console.error(e);
            }
        };
        if (account) {
            getBalance();
        }
    }, [account, provider, contract]);

    const deposit = async () => {
        try {
            const signer = provider.getSigner(account);
            const contractWithSigner = contract.connect(signer);
            const tx = await contractWithSigner.deposit({ value: ethers.utils.parseEther("1") });
            await tx.wait();
            console.log("Transaction completed:", tx);
        } catch (e) {
            console.error(e);
        }
    };

    const withdraw = async () => {
        // Similar to deposit, implement withdraw logic here
    };

    return (
        <div className='w-full h-screen py-4 px-4 text-white' style={{ background: "#2c3139" }}>
            <Header account={account} />
            <div className='flex  w-full space-x-6 py-8'>
                <div className='flex w-full flex-col space-y-3'>
                    <div className='flex items-center w-full justify-start space-x-2'>
                        <IoMdEye className='text-2xl' />
                        <h5>Total balance: {bal} ETH</h5>
                    </div>
                    <button className='flex items-center text-white bg-green-600 py-3 justify-center space-x-2' onClick={deposit}>
                        <BiWallet />
                        <h5>Deposit</h5>
                    </button>
                </div>
            </div>
        </div>
    );
}

New index.jsx {aviator}:
import React, { useEffect, useState } from 'react';
import { MdArrowBackIos } from "react-icons/md";
import { AiFillQuestionCircle } from "react-icons/ai";
import { IoMdJet } from "react-icons/io";
import "./aviator.css";
import { motion } from "framer-motion";
import { Link, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { useRecoilValue } from 'recoil';
import { AccountState } from '../../recoil';
import abiQrng from "../../abi/qrn.json";

const qrng = "0x51246c9F480Cc6A46397b2A35684BC3231Acf41F";

export default function Aviator() {
    const account = useRecoilValue(AccountState);
    const [values, setValues] = useState({ x: 0, y: 0 });
    const [start, setStart] = useState(false);
    const [counting, setCounting] = useState(false);
    const [count, setCount] = useState(0);
    const [bet, setBet] = useState('');
    const [ready, setReady] = useState(false);
    const [odds, setOdds] = useState(1);
    const [end, setEnd] = useState(false);

    const provider = new ethers.providers.JsonRpcProvider("https://dymension-evm.blockpi.network/v1/rpc/public");
    const qrngContract = new ethers.Contract(qrng, abiQrng, provider.getSigner());

    const begin = async () => {
        try {
            setCounting(true);
            const txResponse = await qrngContract.makeRequestUint256();
            const txReceipt = await txResponse.wait();
            console.log("Transaction receipt:", txReceipt);
            
            setReady(true);
            const num = await qrngContract.endpointIdUint256();
            const integerValue = parseInt(num, 16);
            console.log(integerValue, "Random number generated");

            if (integerValue > 0) {
                setStart(true);
                const oddsInterval = setInterval(() => {
                    setOdds(prevOdds => {
                        if (prevOdds < integerValue) {
                            return prevOdds + 1.1;
                        } else {
                            clearInterval(oddsInterval);
                            setEnd(true);
                            return prevOdds;
                        }
                    });
                }, 500);
            }
        } catch (error) {
            console.error("Error initiating the game:", error);
            setCounting(false);
            setReady(false);
        }
    };

    useEffect(() => {
        const updatePosition = () => {
            setValues(v => ({ x: v.x + 20, y: v.y - 10 }));
        };

        const positionInterval = setInterval(updatePosition, 1000);
        return () => clearInterval(positionInterval);
    }, []);

    return (
        <div className='w-full h-screen py-6 px-2 text-white bg-black'>
            <div className='flex w-full items-center'>
                <Link to="/account">
                    <MdArrowBackIos className='text-2xl' />
                </Link>
            </div>

            <div className='flex w-full items-center py-8 justify-between'>
                <div className='flex items-center space-x-2'>
                    <h5 className='font-semibold text-xl text-red-600'>Aviator</h5>
                    <AiFillQuestionCircle className='text-2xl text-slate-300'/>
                </div>

                <div className='flex items-center space-x-2'>
                    <h5 className='text-green-500 font-semibold'>{bet} ETH</h5>
                </div>
            </div>

            <div className='w-full bg-black h-80 rounded-lg graph-container relative'>
                {start && !end ? (
                    <motion.div animate={{ x: values.x, y: values.y }} className="plane">
                        <div className='flex flex-col items-center'>
                            <h5 className='text-lg font-semibold text-red-700'>{odds.toFixed(2)}x</h5>
                            <IoMdJet className='text-6xl text-red-600' />
                        </div>
                    </motion.div>
                ) : end ? (
                    <div className='flex items-center justify-center py-8'>
                        <h5 className='text-red-600 text-5xl'>Flew away!</h5>
                    </div>
                ) : (
                    counting ? (
                        <div className='flex items-center justify-center py-10'>
                            <h5 className='text-red-600 text-7xl font-semibold'>{count}</h5>
                        </div>
                    ) : (
                        <div className='flex items-center justify-center py-8 flex-col space-y-4'>
                            <h5 className='text-red-600 text-4xl'>Starting</h5>
                            <h5 className='text-red-600 text-2xl font-light text-center w-1/2'>Enter your bet</h5>
                        </div>
                    )
                )}
            </div>

            <div className='w-full flex flex-col rounded-lg py-4 mt-4' style={{ background: "#2c3139" }}>
                <div className='flex item-center w-full justify-center'>
                    <div className='flex items-center bg-black w-1/2 rounded-full justify-between px-4 py-1'>
                        <h5 className='hover:bg-slate-600 w-1/2 text-center text-sm'>Bet</h5>
                        <h5 className='hover:bg-slate-600 w-1/2 text-center text-sm'>Auto</h5>
                    </div>
                </div>

                <div className='flex w-full py-4 space-x-6 px-4'>
                    <input
                        className='bg-black h-10 w-2/5 rounded-sm text-white px-3'
                        type={"number"}
                        placeholder={"10"}
                        value={bet}
                        onChange={(e) => setBet(e.target.value)}
                    />
                    {ready ? (
                        <button className='flex flex-col bg-red-500 text-white rounded-lg py-4 px-3 w-3/4' onClick={() => setReady(false)}>
                            <span>Cancel</span>
                        </button>
                    ) : (
                        <button className='flex flex-col bg-green-500 text-white rounded-lg py-4 px-3 w-3/4' onClick={begin}>
                            <span>Bet</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
