import * as Phaser from "phaser";
import { GameManager } from "./gameManager";
import { playersArr } from "./gameManager";
import { text } from "stream/consumers";

enum COMBINATION  {BIGGEST_CARD, PAIR, TWO_PAIR, STREET, TRIPLE,
    FULL_HOUSE, FLASH, CARE, STREET_FLASH, ROYAL_FLASH };
enum STEP {BET, PASS};
enum GAMESTATE {BEGINNING, TWO_CARD, FLOP, TERN, RIVER, END};
enum PLAYERSTATE {INGAME, PASSED};
type playersData = {"name":string, "money":number};
type combi = {"combiName":COMBINATION, "cardValue": number, "combiArr": Array<number> };
type pointCoord = {"x":number, "y":number};

let myScene:PokerRoom;

interface IPlayerView{
    /** имя игрока */
    name:string;

    /** координаты двух карт */
    twoCardArr:Array<pointCoord>;

    /** координаты комбинации из пяти карт */
    combiCard:pointCoord;

    /** координаты бирки */
    tagTxt:pointCoord;

    twoCardImgArr:Phaser.GameObjects.Image[];

    showTwoCard():void;
}

export class PokerRoom extends Phaser.Scene
{
    myGameManager:GameManager;
    
    /** состояние(фаза) игры */
    gameState:GAMESTATE;

    /** всплывающий div элемент с подсказками и, иногда, кнопками выбора */
    domElement:Phaser.GameObjects.DOMElement;

    /** объекты данных игроков, сохраняющиеся в хранилище */
    playersDataArr:Array<playersData>;

    /** визуальное представление игроков */
    playersViewArr:Array<IPlayerView>=[];

    /** текст надписей (количество монет) на бирках игроков и банка */
    usrTagTxt:Phaser.GameObjects.Text;
    oslTagTxt:Phaser.GameObjects.Text;
    khrTagTxt:Phaser.GameObjects.Text;
    bankTagTxt:Phaser.GameObjects.Text;

    /** кнопки помощь, пас и ставка */
    pasBtn:Phaser.GameObjects.Image;
    stavkaBtn:Phaser.GameObjects.Image;
    helpBtn:Phaser.GameObjects.Image;

    /** колор матрицы кнопок помощь, ставка и пас */
    pasBtnCM:Phaser.FX.ColorMatrix;
    stavkaBtnCM:Phaser.FX.ColorMatrix;
    helpBtnCM:Phaser.FX.ColorMatrix;

    constructor(){
        super("pokerRoom");

        this.playersDataArr = [{"name":"user", "money":100},
        {"name":"oslik", "money":100},{"name":"khrusha", "money":100}];

        this.myGameManager = new GameManager();

        this.playersViewArr.push(new UserView("user"));
        this.playersViewArr.push(new LeftBot("oslik"));
        this.playersViewArr.push(new RightView("khrusha"));
    }

    preload(){
        this.load.setPath('assets');
        this.load.image("room", "pokerRoom3.png");
        this.load.image("coinTag","coinTag.png");
        this.load.image('stavkaBtn',"stavkaBtn.png");
        this.load.image('pasBtn',"pasBtn.png");
        this.load.image('coins',"coins.png");
        this.load.image('helpBtn',"help.png");

        for(let i = 0; i<36; i++){
            this.load.image(("card"+i), ("card"+i + ".png"));
        }
    }

    create(){
        this.gameState = GAMESTATE.BEGINNING;

        this.add.image(450,800,"room");

        /** кучки монет */
        this.add.image(563,521,"coins");
        this.add.image(325,548,"coins");
        this.add.image(342,867,"coins").setFlipX(true);

        /** изображения бирок для записи количества монет */
        this.add.image(264,548,"coinTag");
        this.add.image(654,520,"coinTag");
        this.add.image(278,884,"coinTag");
        this.add.image(778,680,"coinTag");

        this.oslTagTxt = this.add.text(264,548,"0000", { color: '#66120a', align: 'left',
            fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5);
        this.khrTagTxt = this.add.text(654,520,"0000", { color: '#66120a', align: 'left',
            fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5);
        this.usrTagTxt = this.add.text(278,884,"0000", { color: '#66120a', align: 'left',
            fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5);
        this.bankTagTxt = this.add.text(778,680,"0000", { color: '#66120a', align: 'left',
            fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5);
        
        this.helpBtn =  this.add.image(448,1464,"helpBtn").setInteractive();
        this.helpBtnCM = this.helpBtn.preFX.addColorMatrix();
        this.helpBtn.setAlpha(0.1);
        this.helpBtnCM.blackWhite();
        this.helpBtn.setState(0);
        this.setHelpEnable(false);

        this.helpBtn.on('pointerdown', () => {
            if(this.helpBtn.state == 0) return;

            
        })

        myScene = this;

        this.domElement = this.add.dom(450, -300, 'div');

        this.showDomPlay();
        //this.showDomGameOver();
        
        // проверяем платежеспособность игроков
        let failePlrsData:Array<playersData> = this.myGameManager.prepareGame(this.playersDataArr);

        this.pasBtn = this.add.image(148,1318,'pasBtn').setState(0)
            .setAlpha(0.2).setInteractive();
        this.stavkaBtn = this.add.image(748,1318,'stavkaBtn').setState(0)
            .setAlpha(0.2).setInteractive();
        this.pasBtnCM = this.pasBtn.preFX.addColorMatrix();
        this.stavkaBtnCM = this.stavkaBtn.preFX.addColorMatrix();
        this.stavkaBtnCM.blackWhite();
        this.pasBtnCM.blackWhite();

        this.setBetPasEnable(false);
        // если не все игроки платежеспособны, игра не начнётся, выведется
        // соответствующее сообщение
        if(failePlrsData.length != 0){

        }
        /** если у всех есть средства для начального взноса, вызываем 
         * всплывающую шторку с кнопкой "Играть"
        */
        else{
            this.showDomPlay();
        }

        

        // for(let i = 0; i < 6; i++){
        //     this.add.image(33 + i*66, 126, ("card"+i));
        //     this.add.image(581 + i*66, 158, ("card"+i));
        //     this.add.image(599 + i*66, 890, ("card"+i));
        //     this.add.image(322 + i*66, 715, ("card"+i));
        // }

        // for(let i = 0; i < 2; i++){
        //     this.add.image(309 + i*66, 405, ("card"+i));
        //     this.add.image(548 + i*66, 405, ("card"+i));
        //     this.add.image(313 + i*66, 1030, ("card"+i));
        // }
    }

    update(time: number, delta: number): void {
        
    }

    /** раздаём по две карты */
    startGame(){
        this.myGameManager.setTwoCard();
        for(let i=0; i<this.playersViewArr.length; i++){
            this.playersViewArr[i].showTwoCard();
        }

        this.add.tween({
            targets: this.bankTagTxt,
            props:{
                scaleY: {value:0, duration: 500, yoyo:true},
                text: { value: this.myGameManager.gameBank, duration: 0, delay: 500 }
            },
            ease: 'Linear',
            onComplete: () => {
                this.gameState = GAMESTATE.TWO_CARD;
                this.continueGame();
            }
        })
    }

    continueGame(){
        let retArr:Array<playersData>;
        switch(this.gameState){
            case GAMESTATE.TWO_CARD:
                retArr = this.myGameManager.checkGameState();
                if(retArr.length! = 0){
                    
                }
            break;
        }
        myScene.setBetPasEnable(true);
        myScene.setHelpEnable(true);
    }

    /** делает кнопки ставка и пас доступными/недоступными */
    setBetPasEnable(enable: boolean) {
        // если хотим сделать доступными кнопки ставка и пас
        if (enable){
            // если уже доступны, выходим
            if (this.stavkaBtn.state == 1) return;

            this.stavkaBtnCM.reset();
            this.pasBtnCM.reset();

            this.add.tween({
                targets: [this.stavkaBtn, this.pasBtn],
                props: {
                    alpha: { value: 1, duration: 500 }
                },
                //delay:1000,
                ease: 'Linear',
                onComplete: () => {
                    this.stavkaBtn.setState(1);
                    this.pasBtn.setState(1);
                }
            })
        }
        // если хотим сделать недоступными
        else{
            // если уже недоступны, просто выходим
            if(this.stavkaBtn.state == 0) return;

            this.stavkaBtn.setState(0);
            this.pasBtn.setState(0);

            this.add.tween({
                targets: [this.stavkaBtn, this.pasBtn],
                props: {
                    alpha: { value: 0.1, duration: 500 }
                },
                //delay:1000,
                ease: 'Linear',
                onComplete: () => {
                    this.stavkaBtnCM.blackWhite();
                    this.pasBtnCM.blackWhite();
                }
            })
        }
    }

    /** делает кнопку помощь доступной/недоступной */
    setHelpEnable(enable:boolean){
        if(enable){
            // если кнопка уже доступна, выходим
            if(this.helpBtn.state == 1) return;

            this.helpBtnCM.reset()
            this.add.tween({
                targets: this.helpBtn,
                alpha: 1,
                duration: 300,
                onComplete: () => {
                    this.helpBtn.setState(1);
                }
            });
        }
        else{
            if(this.helpBtn.state == 0) return;

            this.add.tween({
                targets: this.helpBtn,
                alpha: 0.1,
                duration: 300,
                onComplete: () => {
                    this.helpBtnCM.blackWhite();
                }
            });
        }
    }

    /** вызывается если все игроки платежеспособны и можно начать игру */
    showDomPlay(){
        let str = `<div class="flexContainer">
            <div id="btnDiv"  name="doPlay"><button id="btnPlay" name="doPlay">
            <span class="playTxt" name="doPlay">ИГРАТЬ</span></button></div>
                <div class="listDiv">
                    <ul class ="ulEl">
                        <li>ВЫ: ` + this.playersDataArr[0].money + ` монет</li>
                        <li>ОСЁЛ: ` + this.playersDataArr[1].money + ` монет</li>
                        <li>ХРЮША: ` + this.playersDataArr[2].money + ` монет</li>
                    </ul>
                </div>
            </div>`;
        
        
        this.domElement.setHTML(str);
        this.domElement.addListener('click');
        this.domElement.on('click', (evt) => {
            if(evt.target.attributes.name && 
                evt.target.attributes.name.value == "doPlay"){
                this.domElement.removeAllListeners('click');
                this.tweens.add({
                    targets: this.domElement,
                    y: -300,
                    duration: 2000,
                    ease: 'Sine.easeInOut',
                    loop: 0,
                    onComplete: () => {
                        this.startGame();
                    }
                });
            }
        });

        this.tweens.add({
            targets: this.domElement,
            y: 300,
            duration: 2000,
            ease: 'Sine.easeInOut',
            loop: 0,
            
        });
    }



    /** вызывается если все игроки платежеспособны и можно начать игру */
    showDomGameOver(){
        let str = `<div class="flexContainer">
        <div><span class ="playTxt">Игра закончена</span></div>
        <div class="btnsCont">
          <button id="btnPlay" name="newGame">
          <span name="newGame" class="playTxt">Новая игра</span></button>
          <button id="btnCancel" name="cancel" class = "btnCancel">
          <span name="cancel" class="playTxt">ОТМЕНА</span></button>
        </div>
        <div class="listDiv" >
          <ul class ="ulEl">
            <li>ОСЁЛ</li>
            <li>ХРЮША</li>
            <li>ВЫ</li>
          </ul>
        </div>
      </div>`;


        let ret:string;

        this.domElement.setHTML(str);
        this.domElement.addListener('click');
        this.domElement.on('click', (evt) => {
            if (evt.target.attributes.name.value == "newGame") {
                ret = "newGame";
                this.domElement.removeAllListeners('click');
                this.tweens.add({
                    targets: this.domElement,
                    y: -300,
                    duration: 2000,
                    ease: 'Sine.easeInOut',
                    loop: 0,
                    onComplete: () => {
                        console.log(ret);
                    }
                });
            }else if(evt.target.attributes.name.value == "cancel"){
                ret = "cancel";
                this.domElement.removeAllListeners('click');
                this.tweens.add({
                    targets: this.domElement,
                    y: -300,
                    duration: 2000,
                    ease: 'Sine.easeInOut',
                    loop: 0,
                    onComplete: () => {
                        console.log(ret);
                    }
                });
            }
        });

        this.tweens.add({
            targets: this.domElement,
            y: 300,
            duration: 2000,
            ease: 'Sine.easeInOut',
            loop: 0,
            onComplete: () => {

            }
        });
    }

    showTwoCard(){

    }
}

class UserView implements IPlayerView
{
    twoCardArr: pointCoord[];
    twoCardImgArr: Phaser.GameObjects.Image[];
    combiCard: pointCoord;
    tagTxt:pointCoord;
    name: string;

    /** аргументы - координаты двух карт, координата левой карты комбинации,
     * координата текста на бирке
     */
    constructor(name: string){
        this.twoCardArr = [{"x":634, "y":989}, {"x":701,"y":989}];
        this.combiCard = {"x":575,"y":858};
        this.tagTxt = {"x":278,"y":884};
        this.twoCardImgArr = [];
        this.name = name;
    }

    showTwoCard(){
        myScene.add.image(this.combiCard.x,this.combiCard.y,'card1');

        /** извлекаем данные нужного игрока */
        let plr = playersArr.find((plr) => {
            if(plr.name == this.name) return true;
            return false;
        });

        // показываем две карты
        this.twoCardImgArr.push(myScene.add.image(this.twoCardArr[0].x,
            this.twoCardArr[0].y, 'card'+plr.twoCardArr[0]).setScale(0,1));
        this.twoCardImgArr.push(myScene.add.image(this.twoCardArr[1].x,
            this.twoCardArr[1].y, 'card'+plr.twoCardArr[1]).setScale(0,1));

        myScene.add.tween({
            targets: [this.twoCardImgArr[0],this.twoCardImgArr[1]],
            props:{
                scaleX: {value:1, duration: 500}
            },
            ease: 'Linear'
        })

        myScene.add.tween({
            targets: [myScene.usrTagTxt],
            props:{
                scaleY: {value:0, duration: 500, yoyo:true},
                text: { value: plr.coins, duration: 0, delay: 500 }
            },
            ease: 'Linear',
        })
    }
}

class LeftBot implements IPlayerView
{
    twoCardArr: pointCoord[];
    twoCardImgArr: Phaser.GameObjects.Image[];
    combiCard: pointCoord;
    tagTxt:pointCoord;
    name: string;

    /** аргументы - координаты двух карт, координата левой карты комбинации,
     * координата текста на бирке
     */
    constructor(name: string){
        this.twoCardArr = [{"x":284, "y":307}, {"x":351,"y":307}];
        this.combiCard = {"x":33,"y":126};
        this.tagTxt = {"x":264,"y":548};
        this.twoCardImgArr = [];
        this.name = name;
    }

    showTwoCard(){
        myScene.add.image(this.combiCard.x,this.combiCard.y,'card2');

        let plr = playersArr.find((plr) => {
            if(plr.name == this.name) return true;
            return false;
        });

        this.twoCardImgArr.push(myScene.add.image(this.twoCardArr[0].x,
            this.twoCardArr[0].y, 'card'+plr.twoCardArr[0]).setScale(0,1));
        this.twoCardImgArr.push(myScene.add.image(this.twoCardArr[1].x,
            this.twoCardArr[1].y, 'card'+plr.twoCardArr[1]).setScale(0,1));

        myScene.add.tween({
            targets: [this.twoCardImgArr[0],this.twoCardImgArr[1]],
            props:{
                scaleX: {value:1, duration: 500}
            },
            delay:500,
            ease: 'Linear'
        })

        myScene.add.tween({
            targets: [myScene.oslTagTxt],
            props:{
                scaleY: {value:0, duration: 500, yoyo:true},
                text: { value: plr.coins, duration: 0, delay: 500 }
            },
            ease: 'Linear',
        })
    }
}

class RightView implements IPlayerView
{
    twoCardArr: pointCoord[];
    twoCardImgArr: Phaser.GameObjects.Image[];
    combiCard: pointCoord;
    tagTxt:pointCoord;
    name: string;

    /** аргументы - координаты двух карт, координата левой карты комбинации,
     * координата текста на бирке
     */
    constructor(name: string){
        this.twoCardArr = [{"x":536, "y":356},{"x":602,"y":356}];
        this.combiCard = {"x":556,"y":158};
        this.tagTxt = {"x":654,"y":520};
        this.twoCardImgArr = [];
        this.name = name;
    }

    showTwoCard(){
        myScene.add.image(this.combiCard.x,this.combiCard.y,'card3');

        let plr = playersArr.find((plr) => {
            if(plr.name == this.name) return true;
            return false;
        });

        this.twoCardImgArr.push(myScene.add.image(this.twoCardArr[0].x,
            this.twoCardArr[0].y, 'card'+plr.twoCardArr[0]).setScale(0,1));
        this.twoCardImgArr.push(myScene.add.image(this.twoCardArr[1].x,
            this.twoCardArr[1].y, 'card'+plr.twoCardArr[1]).setScale(0,1));

        myScene.add.tween({
            targets: [this.twoCardImgArr[0],this.twoCardImgArr[1]],
            props:{
                scaleX: {value:1, duration: 500}
            },
            delay:1000,
            ease: 'Linear',
        })

        myScene.add.tween({
            targets: [myScene.khrTagTxt],
            props:{
                scaleY: {value:0, duration: 500, yoyo:true},
                text: { value: plr.coins, duration: 0, delay: 500 }
            },
            ease: 'Linear'
        })
    }
}