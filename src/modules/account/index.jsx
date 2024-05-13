import React, { useState, useEffect, useMemo } from 'react';
import Header from '../../components/header';
import { useRecoilValue } from 'recoil';
import { AccountState } from '../../recoil';
import { ethers } from 'ethers';
import { IoMdEye } from "react-icons/io";
import { BiWallet, BiMoneyWithdraw } from "react-icons/bi";
import { useNavigate } from 'react-router-dom';

export default function Account() {
    const account = useRecoilValue(AccountState);
    const navigate = useNavigate(); 
    const [bal, setBal] = useState('');
    const [inPlay, setInPlay] = useState(0);
    const [error, setError] = useState('');
    const [amountToAdd, setAmountToAdd] = useState('');
    const [amountToWithdraw, setAmountToWithdraw] = useState('');

    // Ensure the provider URL is correct for Dymension's blockchain
    const provider = useMemo(() => new ethers.providers.JsonRpcProvider("https://dymension-evm.blockpi.network/v1/rpc/public"), []);

    useEffect(() => {
        if (!account) return;
        
        const getBalance = async () => {
            try {
                const balance = await provider.getBalance(account);
                setBal(ethers.utils.formatEther(balance));
            } catch (e) {
                console.error(e);
                setError('Failed to fetch balance.');
            }
        };
        getBalance();
    }, [account, provider]);

    const handleTransaction = async (type) => {
        if (!account) return;

        const signer = provider.getSigner();
        const amount = type === 'add' ? amountToAdd : amountToWithdraw;
        const method = type === 'add' ? 'sendTransaction' : 'withdraw';

        try {
            const tx = await signer.sendTransaction({
                to: "address_of_the_receiver_or_contract", // Change this accordingly
                value: ethers.utils.parseEther(amount) // Converts the DYM amount into the right format
            });
            await tx.wait(); // waiting for the transaction to be mined
            console.log(`${type === 'add' ? 'Deposit' : 'Withdrawal'} successful:`, tx);
            setError('');
        } catch (error) {
            console.error(`${type === 'add' ? 'Deposit' : 'Withdrawal'} error:`, error);
            setError(`${type === 'add' ? 'Deposit' : 'Withdraw'} failed.`);
        }
    };

    const playTheDealer = () => {
        navigate('/game'); 
    };

    const playVsOthers = () => {
        navigate('/gamee/play'); // Navigate to another game mode page
    };

    return (
        <div className='w-full h-screen py-4 px-4 text-white' style={{ background: "#2c3139" }}>
            <Header account={account} />
            {error && <p className="error">{error}</p>}
            <div className='flex w-full space-x-6 py-8'>
                <div className='flex w-full flex-col space-y-3'>
                    <div className='flex items-center w-full justify-start space-x-2'>
                        <IoMdEye className='text-2xl' />
                        <h5>Total balance: {bal} DYM</h5>
                        <h5>Total in play: {inPlay} DYM</h5>
                    </div>
                    <div>
                        <input type="text" value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)} placeholder="Amount to add" />
                        <button className='flex items-center text-white bg-green-600 py-3 justify-center space-x-2' onClick={() => handleTransaction('add')}>
                            <BiWallet />
                            <h5>Add to Play</h5>
                        </button>
                    </div>
                    <div>
                        <input type="text" value={amountToWithdraw} onChange={(e) => setAmountToWithdraw(e.target.value)} placeholder="Amount to withdraw" />
                        <button className='flex items-center text-white bg-red-600 py-3 justify-center space-x-2' onClick={() => handleTransaction('withdraw')}>
                            <BiMoneyWithdraw />
                            <h5>Withdraw from Play</h5>
                        </button>
                    </div>
                    <button className={`flex items-center py-3 justify-center space-x-2 ${inPlay > 0 ? 'bg-red-600 text-white' : 'bg-gray-400 text-gray-800'}`} onClick={playTheDealer} disabled={inPlay <= 0}>
                        <h5>Play The Dealer!</h5>
                    </button>
                    <button className={`flex items-center py-3 justify-center space-x-2 ${inPlay > 0 ? 'bg-red-600 text-white' : 'bg-gray-400 text-gray-800'}`} onClick={playVsOthers} disabled={inPlay <= 0}>
                        <h5>Play vs Others!</h5>
                    </button>
                </div>
            </div>
        </div>
    );
}
