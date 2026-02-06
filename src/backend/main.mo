import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Nat32 "mo:core/Nat32";
import Runtime "mo:core/Runtime";

// No migration needed

actor {
  type PlayerId = Nat32;
  type Word = Text;
  type Stroke = { points : [(Float, Float)]; color : Text; width : Nat };

  module Stroke {
    public func compare(a : Stroke, b : Stroke) : Order.Order {
      Nat.compare(a.width, b.width);
    };
  };

  type GameState = {
    #lobby;
    #roleReveal;
    #drawing;
    #voting;
    #results;
    #winner;
  };

  type RoomCode = Text;

  type Player = {
    id : PlayerId;
    name : Text;
    isHost : Bool;
    isSpy : Bool;
    eliminated : Bool;
  };

  module Player {
    public func compare(player1 : Player, player2 : Player) : Order.Order {
      Nat32.compare(player1.id, player2.id);
    };
  };

  type Room = {
    code : RoomCode;
    players : [Player];
    host : PlayerId;
    currentWord : Word;
    state : GameState;
    drawings : [Stroke];
    votes : [(PlayerId, PlayerId)];
    turnOrder : [PlayerId];
    started : Bool;
  };

  let rooms = Map.empty<RoomCode, Room>();
  let namesInUse = Map.empty<Text, ()>();
  var nextPlayerId : Nat = 1;

  let words = [
    "Cat",
    "Apple",
    "Tree",
    "Car",
    "Mountain",
    "Pizza",
    "Eiffel Tower",
    "Dog",
    "Banana",
    "House",
  ];

  // Room Management
  public shared ({ caller }) func createRoom(playerName : Text, code : Text) : async Text {
    if (namesInUse.containsKey(playerName)) {
      Runtime.trap("Name already taken");
    };

    let hostPlayer : Player = {
      id = Nat32.fromNat(nextPlayerId);
      name = playerName;
      isHost = true;
      isSpy = false;
      eliminated = false;
    };

    let initialRoom : Room = {
      code;
      players = [hostPlayer];
      host = Nat32.fromNat(nextPlayerId);
      currentWord = "";
      state = #lobby;
      drawings = [];
      votes = [];
      turnOrder = [];
      started = false;
    };

    rooms.add(code, initialRoom);
    namesInUse.add(playerName, ());
    nextPlayerId += 1;

    code;
  };

  public shared ({ caller }) func joinRoom(roomCode : Text, playerName : Text) : async Bool {
    if (namesInUse.containsKey(playerName)) {
      Runtime.trap("Name already taken");
    };

    switch (rooms.get(roomCode)) {
      case (null) {
        false;
      };
      case (?room) {
        let newPlayer : Player = {
          id = Nat32.fromNat(nextPlayerId);
          name = playerName;
          isHost = false;
          isSpy = false;
          eliminated = false;
        };

        namesInUse.add(playerName, ());
        nextPlayerId += 1;

        let updatedRoom : Room = {
          code = room.code;
          players = room.players.concat([newPlayer]);
          host = room.host;
          currentWord = room.currentWord;
          state = room.state;
          drawings = room.drawings;
          votes = room.votes;
          turnOrder = room.turnOrder;
          started = room.started;
        };

        rooms.add(roomCode, updatedRoom);
        true;
      };
    };
  };

  // Fetch Room State
  public query ({ caller }) func getRoomState(roomCode : Text) : async Room {
    switch (rooms.get(roomCode)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) { room };
    };
  };

  public shared ({ caller }) func startGame(roomCode : Text, hostPlayerId : PlayerId) : async () {
    switch (rooms.get(roomCode)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        let hostIndex = room.players.findIndex(func(player) { player.id == hostPlayerId });
        switch (hostIndex) {
          case (null) { Runtime.trap("Host not found") };
          case (?hostIdx) {
            let host = room.players[hostIdx];
            if (not host.isHost) {
              Runtime.trap("Player is not host");
            };
            if (room.players.size() < 3) {
              Runtime.trap("Cannot start game with fewer than 3 players");
            };
            let newRoom : Room = {
              room with state = #roleReveal;
            };
            rooms.add(roomCode, newRoom);
          };
        };
      };
    };
  };
};
