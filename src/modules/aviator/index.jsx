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
                    <h5 className='font-semibold text-xl text-red-600'>aviator</h5>
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
