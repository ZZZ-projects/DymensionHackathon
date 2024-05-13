# DymensionHackathon
Similar to the real-world poker variant of five-card draw

Uses a quantum algorithm in QIskit to create randomness through entanglement with quantum gates allowing the state of each card to be determined by qubits. [Contains code for classical deployment and live quantum computer deployment using IBM API]

Main Idea:
A card-based gambling game in which the player automatically bets DYM that their five-card hand beats the dealer's. After being dealt their hand, the player can bet more DYM and/or have some or all of their cards replaced with random cards from the deck. The dealer then, if need be, replaces cards in his hand (facedown to the player) with random cards from the deck. The hands are then shown. If the player's hand is better, they win a set number of coins based on both the rank of their hand and the number of coins bet ranging from a Pair (2×) to a Flush (or five of a kind) (16×). If the dealer's hand is better, the player simply loses the coins bet. In the rare occurrence that a draw happens, the player gets their DYM returned.

If all opponents have the same hand, then the cards ranks determine who wins. The cards ranking from best to worst is: Stone, Amethyst, Diamond, Jester, Queen, King, Ancient, Ace.

Flush/Five of a kind: 16 x
Four of a kind: 8 x
Full house: 6 x
Three of a kind: 4 x
Two pairs: 3 x
One pair: 2 x

1v1 Game-Mode. Both players agree on a base value, and can call/raise/fold as in normal poker, and to account for the limited pool 'P' (P=B_{1}+B_{2}≤Max(B_{1},B_{2}), where B_{i} = player i's bet amount), the game is adjusted accordingly:
Flush/Five of a kind: 5 x
Four of a kind: 3.3 x
Full house: 2.6 x
Three of a kind: 2 x
Two pairs: 1.8 x
One pair: 1.5 x

And players are limited to betting 1/5th of their total bankroll to ensure a payout is always possible. 

If we get the chance to add a more players, with four players, the winner can receive up to 20x, and for three players, it is 15x. If no players have no valuable hands, then no exchanges occur.


Technical Decisions:
Why 8 picture states?
to minimize computing time while utilizing a quantum computer or quantum simulator with qubits and gates, the number of Quantum states from hamard gates = 2^{q}, where q = number of qubits
i.e. we are restricted to 2, 4, 8, 64, etc states
Going too high would certainly both add unnecessary over-complexity and ruin the gameplay experience as well as inducing a larger quantum volume, increasing the chance of error and loss of information due to decoherence

The game was originally hooked up to call on the IBM API to handle the quantum randomness using a circuit consisting of Appling a simple Hadamard gate to qubits before taking the measurement to get the random result. 8 states allows for minimal computing time, since switching to the crypto native QRNG from API3 I need to look into how their quantum randomness is achieved to see the validity, but this seems to in theory have more freedom of number of states without compromising time.

We have been working without good organization and hope to get it to a more deployable state with all of the planned features deployed as a rollapp on main-net at some point, but hopefully you will be able to see our beginning steps even if it as not as much as we would have hoped.

Smart Contract in contract.sol:
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contract for a card-based poker game with quantum randomness (to be integrated later)
contract CardPoker {
    // Define the different states of the game
    enum GameState {
        Joining,
        Player1Bet,
        Player2BetOrCall,
        Player1RaiseOrCall,
        Player2RaiseOrCall,
        Player1Fold,
        Player2Fold,
        Player1PlayCards,
        Player2PlayCards,
        DetermineWinner,
        Tie,
        GameEnded
    }

    // Event declarations to log significant contract interactions
    event PlayerJoined(address player);
    event BetPlaced(address player, uint256 amount);
    event CardsPlayed(address player, uint8[5] cards);
    event WinnerDeclared(address winner, uint256 payout);

    // Game state and player management variables
    GameState public currentState;
    address[2] public players;
    uint256[2] public bets;
    uint8[5][2] public playerCards;
    bool[2] public hasPlayed;
    bool[2] public hasReplayed;
    bool public gameStarted;
    address public currentBettor;
    uint8 public roundNumber;
    address public winner;

    // Contract ownership and bet tracking
    address private owner;
    uint256 public currentBet;
    address public player1;
    address public player2;

    // Modifier to restrict function calls to the owner of the contract
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the contract owner can call this function"
        );
        _;
    }

    // Constructor to set the initial owner of the contract
    constructor() {
        owner = msg.sender;
    }

    // Event logging function when a player joins the game
    function joinGame() public {
        require(
            currentState == GameState.Joining,
            "Cannot join game at this stage"
        );
        require(
            players[0] != msg.sender && players[1] != msg.sender,
            "Player already in the game"
        );
        require(
            players[0] == address(0) || players[1] == address(0),
            "Game is full"
        );
        uint8 playerIndex = players[0] == address(0) ? 0 : 1;
        players[playerIndex] = msg.sender;

        // Update player1 and player2 variables
        if (playerIndex == 0) {
            player1 = msg.sender;
        } else {
            player2 = msg.sender;
        }

        emit PlayerJoined(msg.sender);
        if (players[1] != address(0)) {
            currentState = GameState.Player1Bet;
            gameStarted = true;
            currentBettor = players[0];
        }
    }

    // Function for players to place or raise a bet
    function placeBet(uint256 amount) public payable {
        require(gameStarted, "Game not started");
        require(msg.value == amount, "Sent ether does not match the input amount");

        uint8 playerIndex = msg.sender == players[0] ? 0 : 1;
        require(
            (currentState == GameState.Joining && (playerIndex == 0 || playerIndex == 1)) ||
            (currentState == GameState.Player1Bet && msg.sender == players[0]) ||
            (currentState == GameState.Player2BetOrCall && msg.sender == players[1]) ||
            (currentState == GameState.Player1RaiseOrCall && msg.sender == players[0]) ||
            (currentState == GameState.Player2RaiseOrCall && msg.sender == players[1]),
            "Not your turn"
        );

        if (currentState == GameState.Joining || currentState == GameState.Player1Bet) {
            currentBet = amount;
            currentState = (playerIndex == 0) ? GameState.Player2BetOrCall : GameState.Player1RaiseOrCall;
        } else {
            uint256 totalBet = bets[playerIndex] + msg.value;
            require(totalBet >= currentBet, "Total bet must be at least equal to the current bet to call or raise");

            if (totalBet > currentBet) {
                currentBet = totalBet;
                currentState = (playerIndex == 0) ? GameState.Player2RaiseOrCall : GameState.Player1RaiseOrCall;
            } else if (totalBet == currentBet) {
                if (currentState == GameState.Player2BetOrCall || currentState == GameState.Player2RaiseOrCall) {
                    currentState = GameState.Player1PlayCards;
                } else if (currentState == GameState.Player1RaiseOrCall) {
                    currentState = GameState.Player2PlayCards;
                }
            }
        }

        bets[playerIndex] += msg.value;
        emit BetPlaced(msg.sender, msg.value);

        if (bets[0] >= currentBet && bets[1] >= currentBet) {
            currentState = determineNextPhase();
        }
    }

    // Private helper to determine the next phase of the game
    function determineNextPhase() private returns (GameState) {
        if (!hasPlayed[0] && !hasPlayed[1]) {
            return GameState.Player1PlayCards;
        } else if (hasPlayed[0] && !hasPlayed[1]) {
            return GameState.Player2PlayCards;
        } else if (hasPlayed[0] && hasPlayed[1]) {
            return GameState.DetermineWinner;
        }
        return GameState.Joining; // Fallback, should not reach here in a normal flow
    }
    // Function to raise the bet amount during a game round
    function raise(uint256 raiseAmount) public payable {
        require(gameStarted, "Game not started");
        require(
            (currentState == GameState.Player1Bet && msg.sender == players[0]) ||
            (currentState == GameState.Player2BetOrCall && msg.sender == players[1]) ||
            (currentState == GameState.Player1RaiseOrCall && msg.sender == players[0]) ||
            (currentState == GameState.Player2RaiseOrCall && msg.sender == players[1]),
            "Not your turn to raise"
        );

        uint8 playerIndex = msg.sender == players[0] ? 0 : 1;
        // The raiseAmount includes the amount to call plus the additional raise
        uint256 totalRequiredBet = currentBet - bets[playerIndex] + raiseAmount;

        require(
            msg.value == totalRequiredBet,
            "Raise amount does not match the required total bet amount"
        );

        bets[playerIndex] += msg.value;
        currentBet += raiseAmount; // Increment the currentBet by the raiseAmount only

        emit BetPlaced(msg.sender, msg.value);

        // Advance the game state to the next appropriate state
        currentState = (playerIndex == 0) ? GameState.Player2BetOrCall : GameState.Player1Bet;
    }

    // Function allowing players to call the current bet
    function call() public payable {
        require(gameStarted, "Game not started");
        require(
            currentState == GameState.Player2BetOrCall && msg.sender == players[1] ||
            currentState == GameState.Player1RaiseOrCall && msg.sender == players[0] ||
            currentState == GameState.Player2RaiseOrCall && msg.sender == players[1],
            "Not your turn to call"
        );

        uint8 playerIndex = msg.sender == players[0] ? 0 : 1;
        uint256 callAmount = currentBet - bets[playerIndex];

        require(
            msg.value == callAmount,
            "Call amount does not match the required bet amount"
        );

        bets[playerIndex] += msg.value;

        emit BetPlaced(msg.sender, msg.value);

        // Advance the game state
        if (currentState == GameState.Player2BetOrCall || currentState == GameState.Player2RaiseOrCall) {
            currentState = GameState.Player1PlayCards;
        } else if (currentState == GameState.Player1RaiseOrCall) {
            currentState = GameState.Player2PlayCards;
        }

        // Check if both players have placed their bets and are ready to play the cards
        if (bets[0] == bets[1] && currentState != GameState.Joining) {
            currentState = GameState.Player1PlayCards;
        }
    }

    // Function for players to fold their hand
    function fold() public {
        require(gameStarted, "Game not started");
        require(
            (currentState == GameState.Player1Bet && msg.sender == players[0]) ||
            (currentState == GameState.Player2BetOrCall && msg.sender == players[1]) ||
            (currentState == GameState.Player1RaiseOrCall && msg.sender == players[0]) ||
            (currentState == GameState.Player2RaiseOrCall && msg.sender == players[1]),
            "Not your turn to fold"
        );
        uint8 playerIndex = msg.sender == players[0] ? 0 : 1;

        // Assign the win to the other player
        winner = players[1 - playerIndex];
        emit WinnerDeclared(winner, address(this).balance);
        payoutAndReset(); // Transfer the pot to the winner and reset the game
    }

    // Function to play cards by a player
    function playCards(uint8[5] memory cardsToPlay) public {
        require(
            (currentState == GameState.Player1PlayCards &&
                msg.sender == players[0]) ||
                (currentState == GameState.Player2PlayCards &&
                    msg.sender == players[1]),
            "Not your turn to play cards"
        );
        require(gameStarted, "Game not started");
        uint8 playerIndex = msg.sender == players[0] ? 0 : 1;
        require(!hasPlayed[playerIndex], "Already played");

        // Validate each card played and update the state
        for (uint8 i = 0; i < 5; i++) {
            require(
                cardsToPlay[i] >= 1 && cardsToPlay[i] <= 52, // Assuming a standard deck of 52 cards
                "Card value out of range"
            );
            playerCards[playerIndex][i] = cardsToPlay[i];
        }
        hasPlayed[playerIndex] = true;
        emit CardsPlayed(msg.sender, playerCards[playerIndex]);
        roundNumber++;
        if (roundNumber == 2) {
            currentState = GameState.DetermineWinner;
            determineWinner();
        } else {
            currentBettor = players[0]; // Reset the current bettor for the next betting round
        }
        currentState = currentState == GameState.Player1PlayCards
            ? GameState.Player2PlayCards
            : GameState.DetermineWinner;
    }

    // Function to determine the winner of the game
    function determineWinner() private {
        require(
            currentState == GameState.DetermineWinner ||
                currentState == GameState.Player1Fold ||
                currentState == GameState.Player2Fold,
            "Cannot determine winner at this stage"
        );
        if (currentState == GameState.Player1Fold) {
            winner = players[1];
        } else if (currentState == GameState.Player2Fold) {
            winner = players[0];
        } else {
            address winningPlayer = evaluateWinner();
            if (winningPlayer == address(0)) {
                currentState = GameState.Tie; // Set state to Tie if there's no clear winner
            } else {
                winner = winningPlayer;
            }
        }
        payoutAndReset();
    }

    // Function to compare player hands and determine the game winner
    function evaluateWinner() private view returns (address) {
        uint8[5] memory player1Cards = playerCards[0];
        uint8[5] memory player2Cards = playerCards[1];
        // Implement the evaluation logic for the card game here (omitted for brevity)
        // For example, you can implement card game rules like Poker or a simple higher card wins mechanism
        return address(0); // Placeholder for the actual logic
    }
    // Function to reset the game and clear all game-related data
    function resetGame() public onlyOwner {
        currentState = GameState.Joining;
        delete players; // Clears the players array
        for (uint256 i = 0; i < bets.length; i++) {
            bets[i] = 0; // Resets all bets to 0
        }
        for (uint256 i = 0; i < playerCards.length; i++) {
            for (uint256 j = 0; j < playerCards[i].length; j++) {
                playerCards[i][j] = 0; // Resets card values to 0
            }
        }
        for (uint256 i = 0; i < hasPlayed.length; i++) {
            hasPlayed[i] = false; // Resets play status for both players
        }
        for (uint256 i = 0; i < hasReplayed.length; i++) {
            hasReplayed[i] = false; // Resets replay status for both players
        }
        gameStarted = false; // Indicates the game is not started
        currentBettor = address(0); // Resets current bettor
        roundNumber = 0; // Resets the round number
        winner = address(0); // Clears the winner
        currentBet = 0; // Resets the current bet to 0
        player1 = address(0); // Resets player 1 address
        player2 = address(0); // Resets player 2 address
    }

    // Function to handle payouts and reset the game
    function payoutAndReset() private {
        uint256 payoutAmount = address(this).balance;
        if (currentState != GameState.Tie) {
            payable(winner).transfer(payoutAmount);
            emit WinnerDeclared(winner, payoutAmount);
        } else {
            // Assuming players[0] and players[1] are the addresses of the players
            uint256 splitAmount = payoutAmount / 2;

            // In case of an odd number of wei in the pot, add the remainder to the first player's split.
            uint256 remainder = payoutAmount % 2;

            if (players[0] != address(0)) {
                payable(players[0]).transfer(splitAmount + remainder);
            }
            if (players[1] != address(0)) {
                payable(players[1]).transfer(splitAmount);
            }
        }
        resetGame();
    }

    // Can add additional functions for game management, updating game rules, or player management.

    // Function to receive ETH to the contract
    receive() external payable {
        // Maybe also log incoming transactions or manage internal balances
    }
}
