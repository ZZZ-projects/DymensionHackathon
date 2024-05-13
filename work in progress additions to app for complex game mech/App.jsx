import { useEffect, useState, useCallback, useMemo  } from 'react';
import { useDymensionSDK } from './hooks/moon'; 
import abi from "./abi.json";
import { ethers } from 'ethers';
import GameStateComponent from './components/GameState';
import PlayerState from './components/PlayerState';
import Controls from './components/Controls';
import LoginControls from './components/LoginControls';


const shortenAddress = (address, charsToShow = 6, breakChar = '...') => {
  const front = address.substring(0, charsToShow);
  const back = address.substring(address.length - charsToShow);
  return `${front}${breakChar}${back}`;
};

const GameStateEnum = {
  Joining: 0,
  Player1Bet: 1,
  Player2BetOrCall: 2,
  Player1RaiseOrCall: 3,
  Player2RaiseOrCall: 4,
  Player1Fold: 5,
  Player2Fold: 6,
  Player1ReDraw: 7,
  Player2ReDraw: 8,
  DetermineWinner: 9,
  GameEnded: 10
};

const App = () => {
  const { provider, accounts, connectWallet, getSigner } = useDymensionSDK();
  const [loggedIn, setLoggedIn] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [isPlayer2, setIsPlayer2] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  const contractAddress = '0x1fF116257e646b6C0220a049e893e81DE87fc475';
  const contractABI = abi;
  const contract = useMemo(() => new ethers.Contract(contractAddress, contractABI, getSigner()), [contractAddress, contractABI, getSigner]);


  const getGameStateInWords = (gameStateNumber) => {
    const gameStateMapping = {
      [GameStateEnum.Joining]: 'Joining',
      [GameStateEnum.Player1Bet]: 'Player 1 Bet',
      [GameStateEnum.Player2BetOrCall]: 'Player 2 Bet or Call',
      [GameStateEnum.Player1RaiseOrCall]: 'Player 1 Raise or Call',
      [GameStateEnum.Player2RaiseOrCall]: 'Player 2 Raise or Call',
      [GameStateEnum.Player1Fold]: 'Player 1 Fold',
      [GameStateEnum.Player2Fold]: 'Player 2 Fold',
      [GameStateEnum.Player1ReDraw]: 'Player 1 ReDraw',
      [GameStateEnum.Player2ReDraw]: 'Player 2 ReDraw',
      [GameStateEnum.DetermineWinner]: 'Determine Winner',
      [GameStateEnum.GameEnded]: 'Game Ended',
    };

    return gameStateMapping[gameStateNumber];
  };

  const callContractMethod = useCallback(async (methodName, args = [], convertToBigInt = false) => {
    if (!contract) {
      console.error('Contract is not initialized');
      return;
    }
  
    try {
      const method = contract.methods[methodName];
      if (!method) {
        console.error(`Method ${methodName} does not exist on the contract`);
        return;
      }
  
      const result = await method(...args).call({ from: accounts[0] });
      return convertToBigInt ? ethers.utils.formatUnits(result, 0) : result;
    } catch (error) {
      console.error(`Error calling ${methodName} method:`, error);
    }
  }, [contract, accounts]); 

  const fetchGameState = useCallback(async () => {
    console.log('Fetching game state...');
    setLoading(true);
    try {
      const currentBet = await callContractMethod('currentBet', [], true);
      const player2 = await callContractMethod('player2');
      const player1 = await callContractMethod('player1');
      const winner = await callContractMethod('winner');
      const currentBettor = await callContractMethod('currentBettor');
      const gS = await callContractMethod('currentState', [], true);
      let cardStates = await callContractMethod('getPlayersCards');
      cardStates = [
        cardStates[0].map(card => Number(card)),
        cardStates[1].map(card => Number(card)),
      ];
  
      setIsPlayer1(accounts[0].toLowerCase() === player1.toLowerCase());
      setIsPlayer2(accounts[0].toLowerCase() === player2.toLowerCase());
      setGameState(gS);
      setGameData({
        currentBet, player2, player1, winner, currentBettor, cardStates
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching game state:", error);
      setError("Failed to fetch game state");
      setLoading(false);
    }
  }, [accounts, callContractMethod]); // Ensure all dependencies are correct
  
  

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      setLoggedIn(true);
      fetchGameState();
    } else {
      setLoggedIn(false);
    }
  }, [accounts, fetchGameState]); // Include fetchGameState in the dependency array
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (loggedIn && accounts[0]) {
        fetchGameState(); // This function needs to be stable across renders
      }
    }, 10000); // Poll every 10 seconds
  
    return () => clearInterval(intervalId);
  }, [loggedIn, accounts, fetchGameState]); 


  // UseDymensionSDK automatically updates accounts
  //const getAccounts = async () => {
  //  try {
 //     if (provider) {
 //       const accountList = await provider.listAccounts();
 //       setAccounts(accountList);
 //     }
 //   } catch (error) {
 //     console.error("Error fetching accounts:", error);
 //     setError("Failed to fetch accounts");
 //   }
 // };

  const handleLogin = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to connect wallet");
    }
  };
  
  
  const sendTransaction = async (methodName, args = [], transactionOptions = {}) => {
    setLoading(true);
    if (!contract) {
      console.error('Contract is not initialized');
      return;
    }

    try {
      const transactionRequest = {
        to: contractAddress,
        from: accounts[0],
        data: contract.interface.encodeFunctionData(methodName, args),
        ...transactionOptions
      };

      const txResponse = await provider.getSigner().sendTransaction(transactionRequest);
      await txResponse.wait();
      setConfirmed(`Transaction sent successfully for ${methodName}`);
      console.log({ txResponse });
      setLoading(false);
      return txResponse;
    } catch (error) {
      console.error(`Error sending transaction to ${methodName} method:`, error);
      setError(`Error sending transaction to ${methodName} method (${JSON.stringify(error)})`);
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900 px-4">
      {error && <div className="mb-5 bg-red-800 rounded text-white p-2 px-4">{error}</div>}
      {!loggedIn ? (
        <LoginControls onLogin={handleLogin} />
      ) : (
        <div className="w-full max-w-5xl">
          <h2 className="font-bold text-center text-4xl mb-4 w-full">
            Quantum Picture Poker
          </h2>
          {!accounts && <p className="text-center w-full">Loading...</p>}
          {accounts && !accounts[0] && (
            <button onClick={handleLogin} className="mt-4 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-500">
              Connect Wallet
            </button>
          )}
          {accounts && accounts[0] && (
            <div className="mt-4 text-xs mb-6 -mt-2 text-center">Logged in as: {shortenAddress(accounts[0])}</div>
          )}
          {gameData && (
            <>
              <div className="w-full bg-white p-6 rounded-lg shadow-lg mb-4">
                <GameStateComponent currentPot={gameData.currentBet} gameData={gameData} gameState={getGameStateInWords(gameState)} />
              </div>
              <div className="w-full flex justify-between mb-4 gap-4">
                {accounts && accounts[0] && (
                  <div className="w-1/2 bg-white p-6 rounded-lg shadow-lg">
                    <PlayerState playerNumber={1} address={gameData.player1} isPlayer={isPlayer1} cardState={gameData.cardStates[0]} />
                  </div>
                )}
                {accounts && (
                  <div className="w-1/2 bg-white p-6 rounded-lg shadow-lg">
                    <PlayerState playerNumber={2} address={gameData.player2} isPlayer={isPlayer2} cardState={gameData.cardStates[1]} />
                  </div>
                )}
              </div>
              <div className="w-full bg-white p-6 rounded-lg shadow-lg">
                <Controls web3={getSigner()} accountAddress={accounts[0]} sendTransaction={sendTransaction} loggedIn={loggedIn} gameState={getGameStateInWords(gameState)} gameData={gameData} isPlayer1={isPlayer1} isPlayer2={isPlayer2} isMyTurn={isMyTurn} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;

