# Bobboi, a card game

This repository contains a mobile-friendly web app that implements a card game called Bobboi. The web app allows players to start new games, join an existing game using a unique ID, and quickly restart a new game with an existing set of players.

## What are the rules?

Bobboi is a cooperative card game that is played with a standard deck of 52 playing cards. The minimum number of players is 2 and the maximum number is 52. The recommended number of players is between 4 and 6.

To start, each player is randomly dealt one card that is shown to every other player, but not to themselves. The shared objective of the game is for all players to correctly guess the rank of their own card. Suits are not used.

Players should use the information that they gain by inspecting the other players’ cards, plus information that each player communicates with all other players over the course of three rounds.

After the cards are dealt, the rounds proceed as follows:

### Round 1

The player whose card was dealt first goes first. They should declare to the other players whether they see a pair (any pair) among the other players’ cards.

The next player in the dealing order will answer a similar question to the group: do they see at least one other pair that could conceivably be a different pair than the one that the first player had declared?

The third player will answer a similar question: do they see at least one other pair that could conceivably be a different pair than the ones that both earlier players had declared?

The process continues until all players have answered the question. It’s important that these questions are answered accurately.

### Round 2

The player whose card was dealt first goes first. They should declare to the other players what they believe their relative ranking is out of the total number of cards in play. For instance, in a game with N players, if player 1 sees that all (N-1) players have very low cards, then they may declare that they think they are 1st highest out of N.

The next player in the dealing order will do the same, and so on until all players have answered the question.

### Round 3

In the last round, the player whose card was dealt first goes first. They will simply state what rank they think their card is, and after that, they should immediately reveal to themselves their card’s true rank.

The next player in the dealing order does the same, and so on until all players have guessed their card’s rank.

If all players correctly guess their rank, then the players collectively win. Otherwise, the players collectively lose.

### Playing again

If the players decide to play again, then the cards are collected and re-dealt starting with the player immediately following the last game’s first player, but otherwise in consistent order.
