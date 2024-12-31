import * as Phaser from 'phaser';
import { PokerRoom } from './pokerRoom';

let myGame: Phaser.Game;

export function startGame(){
    
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

