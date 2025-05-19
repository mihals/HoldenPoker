import * as Phaser from 'phaser';
import { PokerRoom } from './pokerRoom';

enum LEVELSTATE{COMPLETED, ENABLE, DISABLE};
let myGame: Phaser.Game;

export function startGame(){

    globalThis.levelsData = {playerName:"Me", 
        playerAchiev:[{numLvl:1, coins:0, levelState:LEVELSTATE.ENABLE}]};

    const config = {
        type: Phaser.AUTO,
        backgroundColor: '#bfc874',
        width: 900,
        height: 1600,
        parent: 'gameContainer',
        // physics: {
        //     default: 'arcade',
        //     arcade: {
        //         debug: true,
        //     }
        // },
        dom: {
            createContainer: true
          },
        scale: {
            autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
            mode: Phaser.Scale.FIT
          },
        scene: [ PokerRoom],
    };
    myGame = new Phaser.Game(config);
}

