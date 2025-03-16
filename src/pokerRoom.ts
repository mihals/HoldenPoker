import * as Phaser from "phaser";
import { GameManager } from "./gameManager";
//import { GAMESTATE } from "./gameManager";
//import { playersArr } from "./gameManager";
import { text } from "stream/consumers";

enum COMBINATION  {BIGGEST_CARD, PAIR, TWO_PAIR, STREET, TRIPLE,
    FULL_HOUSE, FLASH, CARE, STREET_FLASH, ROYAL_FLASH };
enum STEP {BET, PASS};
/** обозначает стадию игры: APP_START - приложение только запустилось, необходимо
 *  выяснить достижения игрока в предыдущих сеансах, предложить ему варианты -
 *  продолжить с последнего уровня или заново пройти уже пройденные уровни,
 *  GAME_START - перед началом выбранного уровня, назначаются игроки, начисляются
 *  монеты всем игрокам, стадии игры missingState присваивается значение TWO_CARD_START 
  */
enum GAMESTATE {APP_START, GAME_START, TWO_CARD_START, TWO_CARD, FLOP_START,
      FLOP,TERN_START, TERN, RIVER, END};

enum PLAYERSTATE {INGAME, PASSED, OUTGAME};
type playersData = {"name":string, "money":number};
type combi = {"combiName":COMBINATION, "cardValue": number, "combiArr": Array<number> };
type pointCoord = {"x":number, "y":number};

let myScene:PokerRoom;

interface IPlayerView{
    /** имя игрока */
    name:string;

    /** монеты в распоряжении игрока */
    coins:number;

    /** координаты двух карт */
    twoCardCoordArr:Array<pointCoord>;

    /** координаты комбинации из пяти карт */
    combiCard:pointCoord;

    /** координаты бирки */
    tagTxt:pointCoord;

    /** изображение игрока */
    playerImg:Phaser.GameObjects.Image;

    /** матрица цвета игрока */
    //playerImgCM:Phaser.FX.ColorMatrix;

    /** изображения двух карт */
    twoCardImgArr:Phaser.GameObjects.Image[];

    /**изображение карт в комбинации */
    combiImgArr:Phaser.GameObjects.Image[];

    twoCardValue:number[]

    passTxt:Phaser.GameObjects.Text;

    /** изображает ставку или пас */
    doBet();

    /** заканчивает игру, получает выигрыш в случае победы */
    stopGame():void;

    /** получает монеты в случае выигрыша */
    getCoins():void;

    /** получаем значения карт из myGameManager и заносим их в массив twoCardValue,
     *  показываем их на игровом поле, добавляем монетку в банк, списываем эту
     *  монетку из средств игрока
     */
    showTwoCard():void;

    /** играем флоп - пасуем или ставим, ищем комбинации */
    showFlop():void;

    /** играем терн - пасуем или ставим, ищем комбинации */
    showTern():void
}

/** это класс для визуального отображения хода игры, сами же игровые
 * события вычисляются в myGameManager
 */
export class PokerRoom extends Phaser.Scene
{
    myGameManager:GameManager;
    
    /** состояние(фаза) игры */
    gameState:GAMESTATE;

    /** предыдущая стадия игры, запоминается на время проигрывания твинов */
    prevState: GAMESTATE;

    /** текущая стадия игры */
    currentState:GAMESTATE;

    /** стадия игры, к которой требуется перейти */
    missingState:GAMESTATE;

    /** всплывающий div элемент с подсказками и, иногда, кнопками выбора */
    domElement:Phaser.GameObjects.DOMElement;

    /** объекты данных игроков, сохраняющиеся в хранилище */
    playersDataArr:Array<playersData>;

    /** массив, визуальное представление игроков */
    playersViewArr:Array<IPlayerView>=[];

    myUserView:IPlayerView;
    myLeftBotView:IPlayerView;
    myRightBotView:IPlayerView;

    /** текст надписей (количество монет) на бирках игроков и банка */
    usrTagTxt:Phaser.GameObjects.Text;
    oslTagTxt:Phaser.GameObjects.Text;
    khrTagTxt:Phaser.GameObjects.Text;
    bankTagTxt:Phaser.GameObjects.Text;

    /**прикуп - карты на столе */
    tableCards:Phaser.GameObjects.Image[];

    /** кнопки помощь, пас и ставка */
    pasBtn:Phaser.GameObjects.Image;
    stavkaBtn:Phaser.GameObjects.Image;
    helpBtn:Phaser.GameObjects.Image;

    /** колор матрицы кнопок помощь, ставка и пас */
    pasBtnCM:Phaser.FX.ColorMatrix;
    stavkaBtnCM:Phaser.FX.ColorMatrix;
    helpBtnCM:Phaser.FX.ColorMatrix;

    cowboy:Phaser.GameObjects.Image;

    cowboyCM:Phaser.FX.ColorMatrix;
    // myLeftBotCM:Phaser.FX.ColorMatrix;
    // myRightBot:Phaser.FX.ColorMatrix;

    myDomManager:DomManager;

    currentStep:STEP;

    constructor(){
        super("pokerRoom");

        this.playersDataArr = [{"name":"user", "money":100},
        {"name":"oslik", "money":100},{"name":"khrusha", "money":100}];

        this.gameState = GAMESTATE.APP_START;
        this.prevState = GAMESTATE.APP_START;
        this.currentState = GAMESTATE.APP_START;
        this.missingState = GAMESTATE.APP_START;
        

        this.myGameManager = new GameManager();

        this.myDomManager = new DomManager();

        this.tableCards = [];

        // this.myUserView = new UserView("user");
        // this.myLeftBotView = new LeftBotView("oslik");
        // this.myRightBotView = new RightBotView("khrusha");

        // this.playersViewArr.push(this.myUserView);
        // this.playersViewArr.push(this.myLeftBotView);
        // this.playersViewArr.push(this.myRightBotView);
    }

    preload(){
        this.load.setPath('assets');

        this.load.image("empty", "empty.png");

        this.load.image("wall", "wall.png");
        this.load.image("floor", "floor.png");
        this.load.image("table", "table.png");

        this.load.image("cowboy", "cowboy.png");
        this.load.image("cowboyChair", "cowboyChair.png");

        this.load.image("piggi","piggi.png");
        this.load.image("piggiHand","piggiHand.png");

        this.load.image("oslik","oslik.png");
        this.load.image("oslikHand","oslikHand.png");

        this.load.image("coinTag","coinTag.png");
        this.load.image('stavkaBtn',"stavkaBtn.png");
        this.load.image('pasBtn',"pasBtn.png");
        this.load.image('coins',"coins.png");
        this.load.image('helpBtn',"help.png");
        this.load.image('coin',"coin.png");

        for(let i = 0; i<36; i++){
            this.load.image(("card"+i), ("card"+i + ".png"));
        }
    }

    create(){
        

        //this.add.image(450,800,"room");
        this.add.image(454,715,"table");
        this.add.image(450,445,"wall").setDepth(-1);
        this.add.image(450,1047,"floor").setDepth(-1);
        

        this.cowboy = this.add.image(486,1038,"cowboy");
        this.cowboyCM = this.cowboy.preFX.addColorMatrix();
        this.cowboyCM.blackWhite();

        this.add.image(495,1226,"cowboyChair");

        /** кучки монет */
        //this.add.image(563,521,"coins");
        //this.add.image(325,548,"coins");
        this.add.image(342,867,"coins").setFlipX(true);

        /** изображения бирок для записи количества монет */
        //this.add.image(264,548,"coinTag");
        //this.add.image(654,520,"coinTag");
        this.add.image(278,884,"coinTag");
        this.add.image(778,680,"coinTag").setDepth(1);

        // this.oslTagTxt = this.add.text(264,548,"0000", { color: '#66120a', align: 'left',
        //     fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5);
        // this.khrTagTxt = this.add.text(654,520,"0000", { color: '#66120a', align: 'left',
        //     fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5);
        // this.usrTagTxt = this.add.text(278,884,"0000", { color: '#66120a', align: 'left',
        //     fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5);
        this.bankTagTxt = this.add.text(778,680,"", { color: '#66120a', align: 'left',
            fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5).setDepth(1);
        
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

        this.domElement = this.add.dom(450, -600, 'div');

        //this.showDomPlay();
        //this.showDomGameOver();
        
        // проверяем платежеспособность игроков
        //let failePlrsData:Array<playersData> = this.myGameManager.prepareGame(this.playersDataArr);

        this.pasBtn = this.add.image(148,1318,'pasBtn').setState(0)
            .setAlpha(0.2).setInteractive().on("pointerdown", () => {this.doBet(STEP.PASS)});;
        this.stavkaBtn = this.add.image(748,1318,'stavkaBtn').setState(0)
            .setAlpha(0.2).setInteractive().on("pointerdown", () => {this.doBet(STEP.BET)});
        this.pasBtnCM = this.pasBtn.preFX.addColorMatrix();
        this.stavkaBtnCM = this.stavkaBtn.preFX.addColorMatrix();
        this.stavkaBtnCM.blackWhite();
        this.pasBtnCM.blackWhite();

        this.setBetEnable(false);
        this.setPasEnable(false);
        // если не все игроки платежеспособны, игра не начнётся, выведется
        // соответствующее сообщение
        // if(failePlrsData.length != 0){

        // }
        /** если у всех есть средства для начального взноса, вызываем 
         * всплывающую шторку с кнопкой "Играть"
        */
        // else{
        //     //this.showDomPlay();
        // }

        

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

        this.tableCards[0] = this.add.image(168,700,"empty")//.setDepth(2);
        
        this.prepareApp();
    }

    update(time: number, delta: number): void {
        if(this.currentState != this.missingState) this.playNext();
    }

    /** этот метод проверяет загруженные из localStorage или PlayerData
     *  данные и предлагает выбрать уровень из пройденных или, если ещё ни
     *  один уровень не пройден, предлагает начать игру с первого уровня
    */
    prepareApp(){
        // если уровень ещё не проходился или проходился неудачно, предлагаем
        // пройти первый уровень
        if(globalThis.levelsData.length == 0 ||
            globalThis.levelsData[0].levelState != LEVELSTATE.COMPLETED){
                this.myDomManager.inviteToApp();
        }
    }

    /** метод переводит игру в следующую стадию */
    playNext(){
        this.prevState = this.currentState;
        this.currentState = this.missingState;
         
        switch(this.missingState){
            case GAMESTATE.GAME_START:
                this.myGameManager.prepareGame(globalThis.numLevel);
                this.myUserView = new UserView(this.myGameManager.myUser.name,
                    this.myGameManager.myUser.coins);
                this.myLeftBotView = new LeftBotView(this.myGameManager.myLeftBot.name,
                    this.myGameManager.myUser.coins);
                this.myRightBotView = new RightBotView(this.myGameManager.myRightBot.name,
                    this.myGameManager.myUser.coins);
                
                this.cowboyCM.reset();
                break;
            case GAMESTATE.TWO_CARD_START:
                this.myDomManager.inviteToTwoCard();
                break;
            case GAMESTATE.TWO_CARD:
                this.myGameManager.setTwoCard();
                this.myGameManager.sortCombi();
                this.showTwoCard();
                break;
            case GAMESTATE.FLOP_START:
                this.myDomManager.inviteToFlop();
                break;
            case GAMESTATE.FLOP:
                this.myGameManager.playFlop(this.currentStep == STEP.BET? true:false);
                this.myGameManager.sortCombi();
                this.add.timeline([
                    {
                        at: 100,
                        run: () => {
                            this.myUserView.doBet();
                        }
                    },
                    {
                        from:1000,
                        run: () => {
                            this.myLeftBotView.doBet();
                        }
                    },
                    {
                        from: 1000,
                        run: () => {
                            this.myRightBotView.doBet();
                        }
                    },
                    {
                        from:1000,
                        run: () => {
                            if(this.myGameManager.gameState != GAMESTATE.END){
                                this.showFlop();
                            }
                        }
                    }
                ]).play();
                break;
            case GAMESTATE.TERN_START:
                this.myDomManager.inviteToTern();
                break;
            case GAMESTATE.TERN:
                this.myGameManager.playTern(this.currentStep == STEP.BET? true:false);
                this.myGameManager.sortCombi();
                this.add.timeline([
                    {
                        at: 100,
                        run: () => {
                            this.myUserView.doBet();
                        }
                    },
                    {
                        from:1000,
                        run: () => {
                            this.myLeftBotView.doBet();
                        }
                    },
                    {
                        from: 1000,
                        run: () => {
                            this.myRightBotView.doBet();
                        }
                    },
                    {
                        from:1000,
                        run: () => {
                            if(this.myGameManager.gameState != GAMESTATE.END){
                                this.showTern();
                            }
                        }
                    }
                ]).play();
                break;
        }
    }

    stopGame(){
        // перебираем победителей
        this.myGameManager.winners.forEach((plr) => {
            // ищем соответствующего игрока
            if(plr.name == this.myUserView.name){
                this.myUserView.stopGame();
            }
            if(plr.name == this.myLeftBotView.name){
                this.myLeftBotView.stopGame();
            }
            if(plr.name == this.myRightBotView.name){
                this.myRightBotView.stopGame();
            }
        });

        if(this.myGameManager.myUser.playerState == PLAYERSTATE.PASSED){
            this.cowboyCM.blackWhite();
        }
        if(this.myGameManager.myLeftBot.playerState == PLAYERSTATE.PASSED){
            (this.myLeftBotView as LeftBotView).playerImgCM.blackWhite();
            (this.myLeftBotView as LeftBotView).handImgCM.blackWhite();
        }
        if(this.myGameManager.myRightBot.playerState == PLAYERSTATE.PASSED){
            (this.myRightBotView as RightBotView).playerImgCM.blackWhite();
            (this.myRightBotView as RightBotView).handImgCM.blackWhite();
        }
    }

    /** обработчик нажатия кнопок Ставка и Пас, устанавливает значение step
     *  в зависимости от выбора пользователя и вызывает следующую стадию
     */
    doBet(step:STEP){
        this.currentStep = step;
        this.setBetEnable(false);
        this.setPasEnable(false);
        switch(this.currentState){
            case GAMESTATE.TWO_CARD_START:
                this.missingState = GAMESTATE.TWO_CARD;
                break;
            case GAMESTATE.FLOP_START:
                this.missingState = GAMESTATE.FLOP;
                break;
            case GAMESTATE.TERN_START:
                this.missingState = GAMESTATE.TERN;
                break;
        }
    }

    /** делает кнопки ставка и пас доступными/недоступными */
    // setBetPasEnable(enable: boolean) {
    //     // если хотим сделать доступными кнопки ставка и пас
    //     if (enable){
    //         // если уже доступны, выходим
    //         if (this.stavkaBtn.state == 1) return;

    //         this.stavkaBtnCM.reset();
    //         this.pasBtnCM.reset();

    //         this.add.tween({
    //             targets: [this.stavkaBtn, this.pasBtn],
    //             props: {
    //                 alpha: { value: 1, duration: 500 }
    //             },
    //             //delay:1000,
    //             ease: 'Linear',
    //             onComplete: () => {
    //                 this.stavkaBtn.setState(1);
    //                 this.pasBtn.setState(1);
    //             }
    //         })
    //     }
    //     // если хотим сделать недоступными
    //     else{
    //         // если уже недоступны, просто выходим
    //         if(this.stavkaBtn.state == 0) return;

    //         this.stavkaBtn.setState(0);
    //         this.pasBtn.setState(0);

    //         this.add.tween({
    //             targets: [this.stavkaBtn, this.pasBtn],
    //             props: {
    //                 alpha: { value: 0.1, duration: 500 }
    //             },
    //             //delay:1000,
    //             ease: 'Linear',
    //             onComplete: () => {
    //                 this.stavkaBtnCM.blackWhite();
    //                 this.pasBtnCM.blackWhite();
    //             }
    //         })
    //     }
    // }

    /** делает кнопку ставка доступной/недоступной */
    setBetEnable(enable: boolean) {
        // если хотим сделать доступными кнопки ставка и пас
        if (enable){
            // если уже доступны, выходим
            if (this.stavkaBtn.state == 1) return;

            this.stavkaBtnCM.reset();

            this.add.tween({
                targets: [this.stavkaBtn],
                props: {
                    alpha: { value: 1, duration: 500 }
                },
                //delay:1000,
                ease: 'Linear',
                onComplete: () => {
                    this.stavkaBtn.setState(1);
                }
            })
        }
        // если хотим сделать недоступными
        else{
            // если уже недоступны, просто выходим
            if(this.stavkaBtn.state == 0) return;

            this.stavkaBtn.setState(0);

            this.add.tween({
                targets: [this.stavkaBtn],
                props: {
                    alpha: { value: 0.1, duration: 500 }
                },
                //delay:1000,
                ease: 'Linear',
                onComplete: () => {
                    this.stavkaBtnCM.blackWhite();
                }
            })
        }
    }

    /** делает кнопку пас доступными/недоступными */
    setPasEnable(enable: boolean) {
        // если хотим сделать доступными кнопки ставка и пас
        if (enable){
            // если уже доступны, выходим
            if (this.pasBtn.state == 1) return;

            this.pasBtnCM.reset();

            this.add.tween({
                targets: [this.pasBtn],
                props: {
                    alpha: { value: 1, duration: 500 }
                },
                //delay:1000,
                ease: 'Linear',
                onComplete: () => {
                    this.pasBtn.setState(1);
                }
            })
        }
        // если хотим сделать недоступными
        else{
            // если уже недоступны, просто выходим
            if(this.pasBtn.state == 0) return;

            this.pasBtn.setState(0);

            this.add.tween({
                targets: [this.pasBtn],
                props: {
                    alpha: { value: 0.1, duration: 500 }
                },
                //delay:1000,
                ease: 'Linear',
                onComplete: () => {
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
    // showDomPlay(){
    //     let str = `<div class="flexContainer">
    //         <div id="btnDiv"  name="doPlay"><button id="btnPlay" name="doPlay">
    //         <span class="playTxt" name="doPlay">ИГРАТЬ</span></button></div>
    //             <div class="listDiv">
    //                 <ul class ="ulEl">
    //                     <li>ВЫ: ` + this.playersDataArr[0].money + ` монет</li>
    //                     <li>ОСЁЛ: ` + this.playersDataArr[1].money + ` монет</li>
    //                     <li>ХРЮША: ` + this.playersDataArr[2].money + ` монет</li>
    //                 </ul>
    //             </div>
    //         </div>`;
        
        
    //     this.domElement.setHTML(str);
    //     this.domElement.addListener('click');
    //     this.domElement.on('click', (evt) => {
    //         if(evt.target.attributes.name && 
    //             evt.target.attributes.name.value == "doPlay"){
    //             this.domElement.removeAllListeners('click');
    //             this.tweens.add({
    //                 targets: this.domElement,
    //                 y: -300,
    //                 duration: 2000,
    //                 ease: 'Sine.easeInOut',
    //                 loop: 0,
    //                 onComplete: () => {
    //                     this.startGame();
    //                 }
    //             });
    //         }
    //     });

    //     this.tweens.add({
    //         targets: this.domElement,
    //         y: 300,
    //         duration: 2000,
    //         ease: 'Sine.easeInOut',
    //         loop: 0,
            
    //     });
    // }

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
        this.add.timeline([
            {at:100, 
             run: () => this.myUserView.showTwoCard()},
            {from:500, 
             run: () => this.myLeftBotView.showTwoCard()},
            {from:500, 
             run: () => this.myRightBotView.showTwoCard()},
            {from:500,
             run: () =>   {this.add.tween({
                    targets: [this.bankTagTxt],
                    props:{
                        scaleY: {value:0, duration: 500, yoyo:true},
                        text: { value: this.myGameManager.gameBank,
                             duration: 0, delay: 500 }
                    },
                    ease: 'Linear'})
                }
            },
            {from: 1000,
                run: () => {
                    this.missingState = GAMESTATE.FLOP_START;
                }
            }
        ]).play();
    }

    showFlop(){
        this.tableCards[0].setTexture("card" + this.myGameManager.myTableArr[0]).setScale(0,1);
        this.tableCards[1] = this.add.image(this.tableCards[0].x +70, this.tableCards[0].y,
            "card" + this.myGameManager.myTableArr[1]).setScale(0,1);
        this.tableCards[2] = this.add.image(this.tableCards[1].x +70, this.tableCards[1].y,
            "card" + this.myGameManager.myTableArr[2]).setScale(0,1);

        this.add.timeline([
            {
                at: 100,
                run: () => {
                    this.add.tween({
                        targets: [this.bankTagTxt],
                        props: {
                            scaleY: { value: 0, duration: 500, yoyo: true },
                            text: {
                                value: this.myGameManager.gameBank,
                                duration: 0, delay: 500
                            }
                        },
                        ease: 'Linear'
                    })

                }
            },
            {
                from:500,
                run: () => {
                    this.add.tween({
                    delay:1000,
                    targets: [this.tableCards[0],this.tableCards[1],this.tableCards[2]],
                    props:{
                        scaleX:{value:1, duration:500}
                    }
                    })
                }
            },
            {
                from: 500,
                run: () => this.myUserView.showFlop()
            },
            {
                from: 500,
                run: () => this.myLeftBotView.showFlop()
            },
            {
                from: 500,
                run: () => this.myRightBotView.showFlop()
            },
            {
                from: 500,
                run: () => this.missingState = GAMESTATE.TERN_START
            }
        ]).play();
    }

    showTern(){
        this.tableCards[3] = this.add.image(this.tableCards[2].x +70, this.tableCards[2].y,
            "card" + this.myGameManager.myTableArr[3]).setScale(0,1);

        this.add.timeline([
            {
                at: 100,
                run: () => {
                    this.add.tween({
                        targets: [this.bankTagTxt],
                        props: {
                            scaleY: { value: 0, duration: 500, yoyo: true },
                            text: {
                                value: this.myGameManager.gameBank,
                                duration: 0, delay: 500
                            }
                        },
                        ease: 'Linear'
                    })
                }
            },
            {
                from: 500,
                run: () => {
                    this.add.tween({
                        //delay: 1000,
                        targets: [this.tableCards[3]],
                        props: {
                            scaleX: { value: 1, duration: 500 }
                        }
                    })
                }
            },
            {
                from: 500,
                run: () => this.myUserView.showTern()
            },
            {
                from: 500,
                run: () => this.myLeftBotView.showTern()
            },
            {
                from: 500,
                run: () => this.myRightBotView.showTern()
            },
            {
                from: 500,
                run: () => this.missingState = GAMESTATE.TERN_START
            }
        ]).play();
    }
}

class UserView implements IPlayerView
{
    twoCardValue: number[];
    twoCardCoordArr: pointCoord[];
    twoCardImgArr: Phaser.GameObjects.Image[];
    playerImg: Phaser.GameObjects.Image;
    combiCard: pointCoord;
    combiImgArr:Phaser.GameObjects.Image[];
    tagTxt:Phaser.GameObjects.Text;
    name: string;
    coins: number;
    coinImg: Phaser.GameObjects.Image;
    passTxt:Phaser.GameObjects.Text;

    /** имя игрока */
    constructor(name: string, coins:number){
        this.twoCardValue = [];
        this.twoCardCoordArr = [{"x":634, "y":989}, {"x":702,"y":989}];
        this.combiCard = {"x":575,"y":858};
        //this.tagTxt = {"x":278,"y":884};
        this.twoCardImgArr = [];
        this.combiImgArr = [];
        this.name = name;
        this.coins = coins;
        this.coinImg = myScene.add.image(278,884,"coin").setAlpha(0);
        this.tagTxt = myScene.add.text(278,884,"" + this.coins, { color: '#66120a', align: 'left',
            fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5).setScale(1,0);
        this.passTxt = myScene.add.text(488,1056,"ПАС", { color: '#fff200', align: 'center',
            fontSize:"72px", fontStyle: "bold", fontFamily: "Arial, Roboto"})
            .setOrigin(0.5,0.5).setAlpha(0);

        this.combiImgArr[0] = myScene.add.image(572, 858, "empty").setScale(0, 1);
        this.combiImgArr[1] = myScene.add.image(this.combiImgArr[0].x + 70, 858,
            "empty").setScale(0, 1);
        this.combiImgArr[2] = myScene.add.image(this.combiImgArr[1].x + 70, 858,
            "empty").setScale(0, 1);
        this.combiImgArr[3] = myScene.add.image(this.combiImgArr[2].x + 70, 858,
            "empty").setScale(0, 1);
        this.combiImgArr[4] = myScene.add.image(this.combiImgArr[3].x + 70, 858,
            "empty").setScale(0, 1);

        myScene.add.tween({
            delay:1500,
            targets:this.tagTxt,
            scaleY: 1,
            duration:500,
            onComplete: () => {
                myScene.missingState = GAMESTATE.TWO_CARD_START;
            }
        })
    }

    doBet(){
        if(myScene.myGameManager.myRightBot.playerState == PLAYERSTATE.PASSED){
            if(this.combiImgArr.length == 5){
                myScene.add.tween({
                    targets:[this.combiImgArr[0],this.combiImgArr[1],this.combiImgArr[2],
                                this.combiImgArr[3],this.combiImgArr[4]],
                    props:{scaleX:{value:0, duration:500}}
                })
            }
            myScene.add.tween({
                delay:500,
                targets: this.passTxt,
                alpha:1,
                duration:500,
                onComplete: () => {
                    myScene.cowboyCM.blackWhite();
                }
            })
        }else{
            this.coins = myScene.myGameManager.myUser.coins;
            //this.tagTxt.setText("" + this.coins);
            myScene.add.tween({
                targets: [this.tagTxt],
                props: {
                    scaleY: { value: 0, duration: 500, yoyo: true },
                    text: { value: this.coins, duration: 0, delay: 500 }
                },
                ease: 'Linear',
            })

            this.coinImg.setPosition(278, 884);
            myScene.add.tween({
                targets: this.coinImg,
                x: { value: 778, duration: 800 },
                y: { value: 680, duration: 800 }
            });
            // myScene.add.tween({
            //     targets: [this.tagTxt],
            //     props:{
            //         scaleY: {value:0, duration: 500, yoyo:true},
            //         text: { value: myScene.myGameManager.myUser.coins,
            //              duration: 0, delay: 500 }
            //     },
            //     ease: 'Linear',
            // })
    
            // myScene.add.tween({
            //     targets:this.coinImg,
            //     x:{value: 778, duration:800},
            //     y:{value:680, duration:800}
            // });
        }
    }

    stopGame(){

    }

    getCoins(){

    }

    /** получаем значения карт из myGameManager и заносим их в массив twoCardValue,
     *  показываем их на игровом поле
     */
    showTwoCard(){
        this.coinImg.setAlpha(1);

        // получаем значения карт из myGameManager и заносим их в массив twoCardValue
        this.twoCardValue.push(myScene.myGameManager.myUser.twoCardArr[0]);
        this.twoCardValue.push(myScene.myGameManager.myUser.twoCardArr[1]);

        this.coins = myScene.myGameManager.myUser.coins;

        //myScene.add.image(this.combiCard.x,this.combiCard.y,'card1');

        /** извлекаем данные нужного игрока */
        // let plr = playersArr.find((plr) => {
        //     if(plr.name == this.name) return true;
        //     return false;
        // });

        // показываем две карты
        this.twoCardImgArr.push(myScene.add.image(this.twoCardCoordArr[0].x,
            this.twoCardCoordArr[0].y, 'card'+this.twoCardValue[0]).setScale(0,1));
        this.twoCardImgArr.push(myScene.add.image(this.twoCardCoordArr[1].x,
            this.twoCardCoordArr[1].y, 'card'+this.twoCardValue[1]).setScale(0,1));

        myScene.add.tween({
            targets: [this.twoCardImgArr[0],this.twoCardImgArr[1]],
            props:{
                scaleX: {value:1, duration: 500}
            },
            ease: 'Linear'
        })

        myScene.add.tween({
            targets: [this.tagTxt],
            props:{
                scaleY: {value:0, duration: 500, yoyo:true},
                text: { value: this.coins, duration: 0, delay: 500 }
            },
            ease: 'Linear',
        })

        myScene.add.tween({
            targets:this.coinImg,
            x:{value: 778, duration:800},
            y:{value:680, duration:800}
        });
    }

    showFlop(){
        // this.coins = myScene.myGameManager.myUser.coins;
        // this.tagTxt.setText("" + this.coins);
        // myScene.add.tween({
        //     targets: [this.tagTxt],
        //     props:{
        //         scaleY: {value:0, duration: 500, yoyo:true},
        //         text: { value: this.coins, duration: 0, delay: 500 }
        //     },
        //     ease: 'Linear',
        // })
        
        // this.coinImg.setPosition(278,884);
        // myScene.add.tween({
        //     targets:this.coinImg,
        //     x:{value: 778, duration:800},
        //     y:{value:680, duration:800}
        // });

        let combiValArr:Array<number> = myScene.myGameManager.myUser.myCombi.combiArr;
        // this.combiImgArr[0] = myScene.add.image(572,858, "card" + combiValArr[0]). 
        //     setScale(0,1);
        // this.combiImgArr[1] = myScene.add.image(this.combiImgArr[0].x + 70,858,
        //     "card" + combiValArr[1]).setScale(0,1);
        // this.combiImgArr[2] = myScene.add.image(this.combiImgArr[1].x + 70,858,
        //     "card" + combiValArr[2]).setScale(0,1);
        // this.combiImgArr[3] = myScene.add.image(this.combiImgArr[2].x + 70,858,
        //     "card" + combiValArr[3]).setScale(0,1);
        // this.combiImgArr[4] = myScene.add.image(this.combiImgArr[3].x + 70,858,
        //     "card" + combiValArr[4]).setScale(0,1);

        this.combiImgArr[0].setTexture("card" + combiValArr[0]);
        this.combiImgArr[1].setTexture("card" + combiValArr[1]);
        this.combiImgArr[2].setTexture("card" + combiValArr[2]);
        this.combiImgArr[3].setTexture("card" + combiValArr[3]);
        this.combiImgArr[4].setTexture("card" + combiValArr[4]);

        myScene.add.tween({
            delay:1000,
            targets:[this.combiImgArr[0],this.combiImgArr[1],this.combiImgArr[2],
                        this.combiImgArr[3],this.combiImgArr[4]],
            props:{scaleX:{value:1, duration:500}}
        })
    }

    showTern(){
        let combiValArr:Array<number> = myScene.myGameManager.myUser.myCombi.combiArr;
        // сначала скрываем карты комбинации в первом твине, в следующем твине
        // открываем обновлённую комбинацию
        myScene.add.timeline([
            {
                at: 500,
                run: () => {
                    myScene.add.tween({
                        targets: [this.combiImgArr[0],this.combiImgArr[1],this.combiImgArr[2],
                                    this.combiImgArr[3],this.combiImgArr[4]],
                        props: {
                            scaleX: { value: 0, duration: 500},
                        },
                        ease: 'Linear',
                        onComplete: () => {
                            this.combiImgArr[0].setTexture("card" + combiValArr[0]);
                            this.combiImgArr[1].setTexture("card" + combiValArr[1]);
                            this.combiImgArr[2].setTexture("card" + combiValArr[2]);
                            this.combiImgArr[3].setTexture("card" + combiValArr[3]);
                            this.combiImgArr[4].setTexture("card" + combiValArr[4]);
                        }
                    })
                }
            },
            {
                from: 800,
                run: () => {
                    myScene.add.tween({
                        targets: [this.combiImgArr[0], this.combiImgArr[1], this.combiImgArr[2],
                        this.combiImgArr[3], this.combiImgArr[4]],
                        props: {
                            scaleX: { value: 1, duration: 500 },
                        },
                        ease: 'Linear',
                    })
                }
            }
        ]).play();
    }
}

class LeftBotView implements IPlayerView
{
    twoCardValue: number[];
    twoCardCoordArr: pointCoord[];
    twoCardImgArr: Phaser.GameObjects.Image[];
    playerImg: Phaser.GameObjects.Image;
    playerImgCM: Phaser.FX.ColorMatrix;
    handImg: Phaser.GameObjects.Image;
    handImgCM: Phaser.FX.ColorMatrix;
    coinImg:Phaser.GameObjects.Image;
    coinsImg: Phaser.GameObjects.Image;
    coinTagImg: Phaser.GameObjects.Image;
    tagTxt:Phaser.GameObjects.Text;
    combiCard: pointCoord;
    combiImgArr:Phaser.GameObjects.Image[];
    //tagTxt:pointCoord;
    name: string;
    coins: number;
    passTxt:Phaser.GameObjects.Text;

    /** аргументы - координаты двух карт, координата левой карты комбинации,
     * координата текста на бирке
     */
    constructor(name: string, coins:number ){
        this.twoCardValue = [];
        this.twoCardCoordArr = [{"x":284, "y":307}, {"x":352,"y":307}];
        this.combiCard = {"x":33,"y":126};
        //this.tagTxt = {"x":264,"y":548};
        this.twoCardImgArr = [];
        this.combiImgArr = [];
        this.name = name;
        this.coins = coins;
        this.playerImg = myScene.add.image(170,376,name).setDepth(-1).setAlpha(0);
        this.handImg = myScene.add.image(176,512, name + "Hand").setAlpha(0);
        this.coinImg = myScene.add.image(264,548,"coin").setAlpha(0);
        this.coinsImg = myScene.add.image(325,548,"coins").setAlpha(0);
        this.coinTagImg = myScene.add.image(264,548,"coinTag").setAlpha(0);
        this.tagTxt = myScene.add.text(264,548,"" + this.coins, { color: '#66120a', align: 'left',
            fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5).setScale(1,0);
        this.passTxt = myScene.add.text(294,266,"ПАС", { color: '#fff200', align: 'center',
            fontSize:"72px", fontStyle: "bold", fontFamily: "Arial, Roboto"})
            .setOrigin(0.5,0.5).setAlpha(0);

        this.playerImgCM = this.playerImg.preFX.addColorMatrix();
        this.handImgCM = this.handImg.preFX.addColorMatrix();

        this.combiImgArr[0] = myScene.add.image(32,126, "empty").setScale(0, 1);
        this.combiImgArr[1] = myScene.add.image(this.combiImgArr[0].x + 70, 126,
            "empty").setScale(0, 1);
        this.combiImgArr[2] = myScene.add.image(this.combiImgArr[1].x + 70, 126,
            "empty").setScale(0, 1);
        this.combiImgArr[3] = myScene.add.image(this.combiImgArr[2].x + 70, 126,
            "empty").setScale(0, 1);
        this.combiImgArr[4] = myScene.add.image(this.combiImgArr[3].x + 70, 126,
            "empty").setScale(0, 1);

        myScene.add.tween({
            targets: [this.playerImg, this.handImg, this.coinsImg, this.coinTagImg],
            alpha: 1,
            duration: 1500
        });

        myScene.add.tween({
            delay:1500,
            targets:this.tagTxt,
            scaleY: 1,
            duration:500
        });
    }

    doBet(){
        if(myScene.myGameManager.myLeftBot.playerState == PLAYERSTATE.PASSED){
            if(this.combiImgArr.length == 5){
                myScene.add.tween({
                    targets:[this.combiImgArr[0],this.combiImgArr[1],this.combiImgArr[2],
                                this.combiImgArr[3],this.combiImgArr[4]],
                    props:{scaleX:{value:0, duration:500}}
                })
            }
            myScene.add.tween({
                targets: this.passTxt,
                alpha:1,
                duration:500,
                onComplete: () => {
                    this.playerImgCM.blackWhite();
                    this.handImgCM.blackWhite();
                }
            })
        }else{
            this.coins = myScene.myGameManager.myLeftBot.coins;
            //this.tagTxt.setText("" + this.coins);
            myScene.add.tween({
                targets: [this.tagTxt],
                props: {
                    scaleY: { value: 0, duration: 500, yoyo: true },
                    text: { value: this.coins, duration: 0, delay: 500 }
                },
                ease: 'Linear',
            })

            this.coinImg.setPosition(264, 548);
            myScene.add.tween({
                targets: this.coinImg,
                x: { value: 778, duration: 800 },
                y: { value: 680, duration: 800 }
            });
        }
    }

    stopGame(){
        
    }

    getCoins(){
        
    }

    showTwoCard(){
        this.coinImg.setAlpha(1);

        this.twoCardValue.push(myScene.myGameManager.myLeftBot.twoCardArr[0]);
        this.twoCardValue.push(myScene.myGameManager.myLeftBot.twoCardArr[1]);

        this.coins = myScene.myGameManager.myLeftBot.coins;

        //myScene.add.image(this.combiCard.x,this.combiCard.y,'card2');

        // let plr = playersArr.find((plr) => {
        //     if(plr.name == this.name) return true;
        //     return false;
        // });

        this.twoCardImgArr.push(myScene.add.image(this.twoCardCoordArr[0].x,
            this.twoCardCoordArr[0].y, 'card'+this.twoCardValue[0]).setScale(0,1));
        this.twoCardImgArr.push(myScene.add.image(this.twoCardCoordArr[1].x,
            this.twoCardCoordArr[1].y, 'card'+this.twoCardValue[1]).setScale(0,1));

        myScene.add.tween({
            targets: [this.twoCardImgArr[0],this.twoCardImgArr[1]],
            props:{
                scaleX: {value:1, duration: 500}
            },
            delay:500,
            ease: 'Linear'
        })

        myScene.add.tween({
            targets: [this.tagTxt],
            props:{
                scaleY: {value:0, duration: 500, yoyo:true},
                text: { value: this.coins, duration: 0, delay: 500 }
            },
            ease: 'Linear',
        })

        myScene.add.tween({
            targets:this.coinImg,
            x:{value: 778, duration:800},
            y:{value:680, duration:600}
        });
    }

    showFlop(){
        // this.coins = myScene.myGameManager.myLeftBot.coins;
        // this.tagTxt.setText("" + this.coins);
        // myScene.add.tween({
        //     targets: [this.tagTxt],
        //     props: {
        //         scaleY: { value: 0, duration: 500, yoyo: true },
        //         text: { value: this.coins, duration: 0, delay: 500 }
        //     },
        //     ease: 'Linear',
        // })

        // this.coinImg.setPosition(264, 548);
        // myScene.add.tween({
        //     targets: this.coinImg,
        //     x: { value: 778, duration: 800 },
        //     y: { value: 680, duration: 800 }
        // });
        
        let combiValArr:Array<number> = myScene.myGameManager.myLeftBot.myCombi.combiArr;
        // this.combiImgArr[0] = myScene.add.image(32,126, "card" + combiValArr[0]). 
        //     setScale(0,1);
        // this.combiImgArr[1] = myScene.add.image(this.combiImgArr[0].x + 70,126,
        //     "card" + combiValArr[1]).setScale(0,1);
        // this.combiImgArr[2] = myScene.add.image(this.combiImgArr[1].x + 70,126,
        //     "card" + combiValArr[2]).setScale(0,1);
        // this.combiImgArr[3] = myScene.add.image(this.combiImgArr[2].x + 70,126,
        //     "card" + combiValArr[3]).setScale(0,1);
        // this.combiImgArr[4] = myScene.add.image(this.combiImgArr[3].x + 70,126,
        //     "card" + combiValArr[4]).setScale(0,1);

        this.combiImgArr[0].setTexture("card" + combiValArr[0]);
        this.combiImgArr[1].setTexture("card" + combiValArr[1]);
        this.combiImgArr[2].setTexture("card" + combiValArr[2]);
        this.combiImgArr[3].setTexture("card" + combiValArr[3]);
        this.combiImgArr[4].setTexture("card" + combiValArr[4]);

        myScene.add.tween({
            delay:1000,
            targets:[this.combiImgArr[0],this.combiImgArr[1],this.combiImgArr[2],
                        this.combiImgArr[3],this.combiImgArr[4]],
            props:{scaleX:{value:1, duration:500}}
        })
    }

    showTern(){
        let combiValArr:Array<number> = myScene.myGameManager.myLeftBot.myCombi.combiArr;
        // сначала скрываем карты комбинации в первом твине, в следующем твине
        // открываем обновлённую комбинацию
        myScene.add.timeline([
            {
                at: 500,
                run: () => {
                    myScene.add.tween({
                        targets: [this.combiImgArr[0],this.combiImgArr[1],this.combiImgArr[2],
                                    this.combiImgArr[3],this.combiImgArr[4]],
                        props: {
                            scaleX: { value: 0, duration: 500},
                        },
                        ease: 'Linear',
                        onComplete: () => {
                            this.combiImgArr[0].setTexture("card" + combiValArr[0]);
                            this.combiImgArr[1].setTexture("card" + combiValArr[1]);
                            this.combiImgArr[2].setTexture("card" + combiValArr[2]);
                            this.combiImgArr[3].setTexture("card" + combiValArr[3]);
                            this.combiImgArr[4].setTexture("card" + combiValArr[4]);
                        }
                    })
                }
            },
            {
                from: 800,
                run: () => {
                    myScene.add.tween({
                        targets: [this.combiImgArr[0], this.combiImgArr[1], this.combiImgArr[2],
                        this.combiImgArr[3], this.combiImgArr[4]],
                        props: {
                            scaleX: { value: 1, duration: 500 },
                        },
                        ease: 'Linear',
                    })
                }
            }
        ]).play();
    }
}

class RightBotView implements IPlayerView
{
    twoCardValue: number[];
    twoCardCoordArr: pointCoord[];
    twoCardImgArr: Phaser.GameObjects.Image[];
    playerImg: Phaser.GameObjects.Image;
    playerImgCM:Phaser.FX.ColorMatrix;
    handImg: Phaser.GameObjects.Image;
    handImgCM:Phaser.FX.ColorMatrix;
    coinsImg: Phaser.GameObjects.Image;
    coinTagImg: Phaser.GameObjects.Image;
    tagTxt:Phaser.GameObjects.Text;
    combiCard: pointCoord;
    combiImgArr:Phaser.GameObjects.Image[];
    //tagTxt:pointCoord;
    name: string;
    coins: number;
    coinImg: Phaser.GameObjects.Image;
    passTxt:Phaser.GameObjects.Text;

    /** аргументы - координаты двух карт, координата левой карты комбинации,
     * координата текста на бирке
     */
    constructor(name: string, coins:number){
        this.twoCardValue = [];
        this.twoCardCoordArr = [{"x":536, "y":356},{"x":602,"y":356}];
        this.combiCard = {"x":556,"y":158};
        //this.tagTxt = {"x":654,"y":520};
        this.twoCardImgArr = [];
        this.combiImgArr = [];
        this.name = name;
        this.coins = coins;
        
        this.playerImg = myScene.add.image(715,374,name).setDepth(-1).setAlpha(0);
        this.handImg = myScene.add.image(784,494, name + "Hand").setAlpha(0);
        this.coinImg = myScene.add.image(654,520,"coin").setAlpha(0);
        this.coinsImg = myScene.add.image(563,521,"coins").setAlpha(0);
        this.coinTagImg = myScene.add.image(654,520,"coinTag").setAlpha(0);
        this.tagTxt = myScene.add.text(654,520,"" + this.coins, { color: '#66120a', align: 'left',
            fontSize:"60px", fontStyle: "bold"}).setOrigin(0.5,0.5).setScale(1,0);
        this.passTxt = myScene.add.text(638,212,"ПАС", { color: '#fff200', align: 'center',
            fontSize:"72px", fontStyle: "bold", fontFamily: "Arial, Roboto"})
            .setOrigin(0.5,0.5).setAlpha(0);

        this.playerImgCM = this.playerImg.preFX.addColorMatrix();
        this.handImgCM = this.handImg.preFX.addColorMatrix();

        this.combiImgArr[0] = myScene.add.image(566,158, "empty").setScale(0, 1);
        this.combiImgArr[1] = myScene.add.image(this.combiImgArr[0].x + 70, 158,
            "empty").setScale(0, 1);
        this.combiImgArr[2] = myScene.add.image(this.combiImgArr[1].x + 70, 158,
            "empty").setScale(0, 1);
        this.combiImgArr[3] = myScene.add.image(this.combiImgArr[2].x + 70, 158,
            "empty").setScale(0, 1);
        this.combiImgArr[4] = myScene.add.image(this.combiImgArr[3].x + 70, 158,
            "empty").setScale(0, 1);

        myScene.add.tween({
            targets: [this.playerImg, this.handImg, this.coinsImg, this.coinTagImg],
            alpha: 1,
            duration: 1500
        });

        myScene.add.tween({
            delay:1500,
            targets:this.tagTxt,
            scaleY: 1,
            duration:500
        })
    }

    doBet(){
        if(myScene.myGameManager.myRightBot.playerState == PLAYERSTATE.PASSED){
            if(this.combiImgArr.length == 5){
                myScene.add.tween({
                    targets:[this.combiImgArr[0],this.combiImgArr[1],this.combiImgArr[2],
                                this.combiImgArr[3],this.combiImgArr[4]],
                    props:{scaleX:{value:0, duration:500}}
                })
            }
            myScene.add.tween({
                targets: this.passTxt,
                alpha:1,
                duration:500,
                onComplete: () => {
                    this.playerImgCM.blackWhite();
                    this.handImgCM.blackWhite();
                }
            })
        }else{
            this.coins = myScene.myGameManager.myRightBot.coins;
            //this.tagTxt.setText("" + this.coins);
            myScene.add.tween({
                targets: [this.tagTxt],
                props: {
                    scaleY: { value: 0, duration: 500, yoyo: true },
                    text: { value: this.coins, duration: 0, delay: 500 }
                },
                ease: 'Linear',
            })

            this.coinImg.setPosition(654, 520);
            myScene.add.tween({
                targets: this.coinImg,
                x: { value: 778, duration: 800 },
                y: { value: 680, duration: 800 }
            });
        }
    }

    stopGame(){
        
    }

    getCoins(){
        
    }

    showTwoCard(){
        this.coinImg.setAlpha(1);

        this.twoCardValue.push(myScene.myGameManager.myRightBot.twoCardArr[0]);
        this.twoCardValue.push(myScene.myGameManager.myRightBot.twoCardArr[1]);

        this.coins = myScene.myGameManager.myRightBot.coins;

        //myScene.add.image(this.combiCard.x,this.combiCard.y,'card3');

        // let plr = playersArr.find((plr) => {
        //     if(plr.name == this.name) return true;
        //     return false;
        // });

        this.twoCardImgArr.push(myScene.add.image(this.twoCardCoordArr[0].x,
            this.twoCardCoordArr[0].y, 'card'+this.twoCardValue[0]).setScale(0,1));
        this.twoCardImgArr.push(myScene.add.image(this.twoCardCoordArr[1].x,
            this.twoCardCoordArr[1].y, 'card'+this.twoCardValue[1]).setScale(0,1));

        myScene.add.tween({
            targets: [this.twoCardImgArr[0],this.twoCardImgArr[1]],
            props:{
                scaleX: {value:1, duration: 500}
            },
            delay:1000,
            ease: 'Linear',
        })

        myScene.add.tween({
            targets: [this.tagTxt],
            props:{
                scaleY: {value:0, duration: 500, yoyo:true},
                text: { value: this.coins, duration: 0, delay: 500 }
            },
            ease: 'Linear'
        })
        //654,520
        myScene.add.tween({
            targets:this.coinImg,
            x:{value: 778, duration:800},
            y:{value:680, duration:800}
        });
    }

    showFlop(){
        // this.coins = myScene.myGameManager.myRightBot.coins;
        // this.tagTxt.setText("" + this.coins);
        // myScene.add.tween({
        //     targets: [this.tagTxt],
        //     props:{
        //         scaleY: {value:0, duration: 500, yoyo:true},
        //         text: { value: this.coins, duration: 0, delay: 500 }
        //     },
        //     ease: 'Linear',
        // })

        // this.coinImg.setPosition(654,520);
        // myScene.add.tween({
        //     targets:this.coinImg,
        //     x:{value: 778, duration:800},
        //     y:{value:680, duration:800}
        // });

        let combiValArr:Array<number> = myScene.myGameManager.myRightBot.myCombi.combiArr;
        // this.combiImgArr[0] = myScene.add.image(566,158, "card" + combiValArr[0]). 
        //     setScale(0,1);
        // this.combiImgArr[1] = myScene.add.image(this.combiImgArr[0].x + 70,158,
        //     "card" + combiValArr[1]).setScale(0,1);
        // this.combiImgArr[2] = myScene.add.image(this.combiImgArr[1].x + 70,158,
        //     "card" + combiValArr[2]).setScale(0,1);
        // this.combiImgArr[3] = myScene.add.image(this.combiImgArr[2].x + 70,158,
        //     "card" + combiValArr[3]).setScale(0,1);
        // this.combiImgArr[4] = myScene.add.image(this.combiImgArr[3].x + 70,158,
        //     "card" + combiValArr[4]).setScale(0,1);

        this.combiImgArr[0].setTexture("card" + combiValArr[0]);
        this.combiImgArr[1].setTexture("card" + combiValArr[1]);
        this.combiImgArr[2].setTexture("card" + combiValArr[2]);
        this.combiImgArr[3].setTexture("card" + combiValArr[3]);
        this.combiImgArr[4].setTexture("card" + combiValArr[4]);
            
        myScene.add.tween({
            delay:1000,
            targets:[this.combiImgArr[0],this.combiImgArr[1],this.combiImgArr[2],
                        this.combiImgArr[3],this.combiImgArr[4]],
            props:{scaleX:{value:1, duration:500}}
        })
    }

    showTern(){
        let combiValArr:Array<number> = myScene.myGameManager.myRightBot.myCombi.combiArr;
        // сначала скрываем карты комбинации в первом твине, в следующем твине
        // открываем обновлённую комбинацию
        myScene.add.timeline([
            {
                at: 500,
                run: () => {
                    myScene.add.tween({
                        targets: [this.combiImgArr[0],this.combiImgArr[1],this.combiImgArr[2],
                                    this.combiImgArr[3],this.combiImgArr[4]],
                        props: {
                            scaleX: { value: 0, duration: 500},
                        },
                        ease: 'Linear',
                        onComplete: () => {
                            this.combiImgArr[0].setTexture("card" + combiValArr[0]);
                            this.combiImgArr[1].setTexture("card" + combiValArr[1]);
                            this.combiImgArr[2].setTexture("card" + combiValArr[2]);
                            this.combiImgArr[3].setTexture("card" + combiValArr[3]);
                            this.combiImgArr[4].setTexture("card" + combiValArr[4]);
                        }
                    })
                }
            },
            {
                from: 800,
                run: () => {
                    myScene.add.tween({
                        targets: [this.combiImgArr[0], this.combiImgArr[1], this.combiImgArr[2],
                        this.combiImgArr[3], this.combiImgArr[4]],
                        props: {
                            scaleX: { value: 1, duration: 500 },
                        },
                        ease: 'Linear',
                    })
                }
            }
        ]).play();
    }
}

class DomManager{
    // перечень комбинаций по возрастанию
    combiList:string;
    combiListEn:string;
    namesLst:{user:string, leftBot:string, rightBot:string};
    combiNames:Array<string>;

    constructor(){
        this.namesLst = {"user":"У Вас","leftBot": "У Ослика", "rightBot":"У Хрюши"};
        this.combiNames = ["Старшая карта", "Пара", "Две пары", "Стрит", "Тройка",
            "Фулл Хаус", "Флеш", "Каре", "Стрит Флеш", "Роял Флеш"];

        this.combiList = //`<div class="listDiv">
        `<hr style = "border-width:5px"><p style="text-align: center;">Комбинации по возрастанию</p>
        <ul id="combiLst"><li>Старшая карта - cамая слабая комбинация,
                победитель определяется по старшинству карты.</li>
            <li>Пара - две карты одного достоинства.</li> 
            <li>Две пары. </li> 
            <li>Сет или тройка - три карты одного достоинства</li> 
            <li>Стрит пять карт последовательного достоинства любых мастей.
                Пример: 5, 6, 7, 8, 9 разных мастей.</li> 
            <li>Флэш - пять карт одной масти любого достоинства. 
                Пример: Туз, 6, 8, Король, Дама одной масти.</li> 
            <li>Фулл Хаус - три карты одного достоинства и две карты другого достоинства. 
                Пример: Три Туза и две десятки.</li> 
            <li>Каре - четыре карты одного достоинства.</li> 
            <li>Стрит Флэш - пять карт последовательного достоинства и одной масти.
                Самый слабый Стрит Флэш - комбинация Туз,6,7,8,9 - </li> 
            <li>Роял Флэш - самая сильная комбинация в покере, которая состоит из пяти карт 
                последовательного достоинства от десятки до туза одной масти.</li> </ul>`
        //</div>`; 


        this.combiListEn = `High card
            Pair
            Two Pair
            Three of a Kind
            Straight
            Flush
            Full House
            Four of a Kind
            Straight Flush
            Royal Flush`;
    }

    /** первое приглашение в игру после загрузки приложения */
    inviteToApp(){
        // если данных об игроке нет, играем первый уровень
        if (globalThis.levelsData.length == 0 ||
            globalThis.levelsData[0].levelState != LEVELSTATE.COMPLETED) {
            globalThis.numLevel = 1
        }

        let str = `<div class="flexContainer">
            <div id="btnDiv"  name="doPlay"><button id="btnPlay" name="doPlay">
            <span class="playTxt" name="doPlaySpan">ИГРАТЬ</span></button></div>
                <div class="listDiv">
                <p id="spoil"> *Текст можно прокрутить! </p>
                    Вы на первом уровне. Ваши соперники Ослик и Хрюша. Ослик
                    делает ставки всегда пока есть монеты, Хрюша всё повторяет
                    за Вами - и ставку и пас. Используйте в игре кнопки "Пас" и
                    "Ставка".  Для получения информации жмите кнопку "?".
                    <p  >
                        Игра начинается с взноса перед игрой, после чего сдаётся
                        по две карты.
                    </p>`+
                    this.combiList +
                `</div>
            </div>`;
        
        myScene.domElement.setHTML(str);
        myScene.domElement.addListener('click');
        myScene.domElement.on('click', (evt) => {
            if((document.getElementById("btnDiv").contains(evt.target) ||
                evt.target.id == "doPlaySpan")){
                    myScene.domElement.removeAllListeners('click');
                    myScene.tweens.add({
                    targets: myScene.domElement,
                    y: -600,
                    duration: 1000,
                    ease: 'Sine.easeInOut',
                    loop: 0,
                    onComplete: () => {
                        myScene.missingState = GAMESTATE.GAME_START;
                    }
                });
            }
        });

        myScene.tweens.add({
            targets: myScene.domElement,
            y: 600,
            duration: 1000,
            ease: 'Sine.easeInOut',
            loop: 0,
            
        });
    }

    /**игроки расселись, монеты розданы, игроку предлагается сделать ставку,
     * чтобы начать игру
     */
    inviteToTwoCard(){
        let str;
        if(globalThis.numLevel == 1){
        str = `<div class="flexContainer">
                <div class="listDiv">
                    <p style="text-align: center;">Сделайте ставку (кнопка "Ставка"),
                     чтобы начать игру.</p>
                    <ul class ="ulEl">
                        <li>У Вас ` + myScene.myUserView.coins + ` монет.</li>
                        <li>У Ослика ` +myScene.myLeftBotView.coins+ ` монет. </li>
                        <li>У Хрюши ` +myScene.myRightBotView.coins+` монет.</li>
                    </ul>
                </div>
            </div> `
        }

        myScene.domElement.setHTML(str);
        myScene.add.timeline([
            {
                at: 100,
                run: () => {
                    myScene.tweens.add({
                        targets: myScene.domElement,
                        y: 900,
                        duration: 1000,
                        ease: 'Sine.easeInOut',
                        loop: 0
                    })
                }
            },
            {
                from: 3500,
                run: () => {
                    myScene.tweens.add({
                        targets: myScene.domElement,
                        y: -600,
                        duration: 1000,
                        ease: 'Sine.easeInOut',
                        loop: 0
                    })
                }
            },
            {
                from: 1000,
                run: () => {
                    myScene.setBetEnable(true);
                    myScene.setPasEnable(true);
                    myScene.setHelpEnable(true);
                }
            }
        ]).play();
    }

    inviteToFlop(){
        let row1 = `<li>`+ this.namesLst[myScene.myGameManager.playersCombiArr[0].player]+
            `: `+ this.combiNames[myScene.myGameManager.playersCombiArr[0].combi.combiName]+
            `</li>`;
        let row2 = `<li>`+ this.namesLst[myScene.myGameManager.playersCombiArr[1].player]+
            `: `+ this.combiNames[myScene.myGameManager.playersCombiArr[1].combi.combiName]+
            `</li>`;
        let row3 = `<li>`+ this.namesLst[myScene.myGameManager.playersCombiArr[2].player]+
            `: `+ this.combiNames[myScene.myGameManager.playersCombiArr[2].combi.combiName]+
            `</li>`;

        let str = `<div class="flexContainer">
                <div class="listDiv">
                    <ul class ="ulEl">`+
                        row1+row2+row3+
                    `</ul>
                    <p style="text-align: center;">Следующая стадия - Флоп. 
                     На столе открываются три карты и из этих трёх карт и двух
                     карт каждого игрока составляются комбинации. Вы должны сделать
                     выбор - "ПАС" или "СТАВКА".</p>
                    </div>
                </div> `;
        
        myScene.domElement.setHTML(str);
        myScene.add.timeline([
            {
                at: 100,
                run: () => {
                    myScene.tweens.add({
                        targets: myScene.domElement,
                        y: 900,
                        duration: 1000,
                        ease: 'Sine.easeInOut',
                        loop: 0
                    })
                }
            },
            {
                from: 3500,
                run: () => {
                    myScene.tweens.add({
                        targets: myScene.domElement,
                        y: -600,
                        duration: 1000,
                        ease: 'Sine.easeInOut',
                        loop: 0
                    })
                }
            },
            {
                from: 1000,
                run: () => {
                    myScene.setBetEnable(true);
                    myScene.setPasEnable(true);
                    myScene.setHelpEnable(true);
                }
            }
        ]).play();
    }

    inviteToTern(){
        let row1 = `<li>`+ this.namesLst[myScene.myGameManager.playersCombiArr[0].player]+
            `: `+ this.combiNames[myScene.myGameManager.playersCombiArr[0].combi.combiName]+
            `</li>`;
        let row2 = `<li>`+ this.namesLst[myScene.myGameManager.playersCombiArr[1].player]+
            `: `+ this.combiNames[myScene.myGameManager.playersCombiArr[1].combi.combiName]+
            `</li>`;
        let row3 = `<li>`+ this.namesLst[myScene.myGameManager.playersCombiArr[2].player]+
            `: `+ this.combiNames[myScene.myGameManager.playersCombiArr[2].combi.combiName]+
            `</li>`;

        let str = `<div class="flexContainer">
            <div class="listDiv">
                <ul class ="ulEl">`+
            row1 + row2 + row3 +
            `</ul>
                <p style="text-align: center;">Следующая стадия - Терн. 
                 Будет открыта ещё одна карта, которую можно будет добавить
                 в комбинацию. За Вами выбор - "ПАС" или "СТАВКА".</p>
                </div>
            </div> `;

            myScene.domElement.setHTML(str);
            myScene.add.timeline([
                {
                    at: 1000,
                    run: () => {
                        myScene.tweens.add({
                            targets: myScene.domElement,
                            y: 900,
                            duration: 1000,
                            ease: 'Sine.easeInOut',
                            loop: 0
                        })
                    }
                },
                {
                    from: 3500,
                    run: () => {
                        myScene.tweens.add({
                            targets: myScene.domElement,
                            y: -600,
                            duration: 1000,
                            ease: 'Sine.easeInOut',
                            loop: 0
                        })
                    }
                },
                {
                    from: 1000,
                    run: () => {
                        myScene.setBetEnable(true);
                        myScene.setPasEnable(true);
                        myScene.setHelpEnable(true);
                    }
                }
            ]).play();
    }
}