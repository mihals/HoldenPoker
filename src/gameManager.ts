enum COMBINATION  {BIGGEST_CARD, PAIR, TWO_PAIR, STREET, TRIPLE,
    FULL_HOUSE, FLASH, CARE, STREET_FLASH, ROYAL_FLASH };

/** результат - состояние после розыгрыша раунда, определился ли победитель
 *  или игра продолжается
  */
enum RESULT {CONTINUE, HAS_WINNER };

/** фазы игры флоп, терн, окончание розыгрыша END, результат прохождения уровня -
 *  LEVEL_WIN - уровень пройден, LEVEL_LOST - уровень не пройден, LEVEL_BEST -
 *  уровень пройден не впервые и улучшен предыдущий результат и т.п. */
enum GAMESTATE {APP_START, GAME_START, TWO_CARD_START, TWO_CARD, FLOP_START,
     FLOP,TERN_START, TERN, RIVER_START, RIVER, END, RESULT, CONTINUE, LEVEL_WIN,
     LEVEL_LOST, LEVEL_BEST};

enum PLAYERSTATE {INGAME, PASSED, OUTGAME, WIN};
type playersData = {"name":string, "money":number};
type combi = {"combiName":COMBINATION, "cardValue": number, "combiArr": Array<number> };

interface IPlayer{
    /** имя игрока */
    name:string;
    /** капитал игрока */
    coins:number;
    twoCardArr:Array<number>;
    playerState:PLAYERSTATE;
    myCombi:combi;

    /** сдаются две карты */
    setTwoCard(firstCard:number, secondCard:number):void;

    /** ставка перед началом игры */
    doBet(boolean):void

    /** очищает от данных для начала следуей игры(зозыгрыша банка) */
    completeGame()

    /** открываются три карты */
    flop():void;

    /** открылась четвёртая карта */
    tern():void;

    /** открылась пятая карта */
    river():void;
}

/** массив игроков */
//export let playersArr:Array<IPlayer>=[];

/** карты на столе */
let tableArr:Array<number>=[];

export class GameManager {
    /** массив перетасованных карт */
    shuffledArr: Array<number>;

    /** карты на столе */
    myTableArr:Array<number>;

    /** фаза игры - GAMESTATE */
    gameState: GAMESTATE;

    /** банк игры */
    gameBank: number = 0;

    myUser:IPlayer;
    myLeftBot:IPlayer;
    myRightBot:IPlayer;

    /** массив игроков */
    playersArr:Array<IPlayer>=[];

    /** массив комбинаций игроков */
    playersCombiArr:Array<{combi:combi, player:string}> =[];

    /** массив игроков продолжающих игру */
    playersInGame:Array<IPlayer> = [];

    /** игроки - победители розыгрыша */
    winnersPlayers:Array<IPlayer> =[];

    /** итоги игроков после прохождения уровня */
    lvlWinners:Array<IPlayer> = [];

    constructor() {

    }

    /** тасуем карты, в зависимости от номера уровня назначаем имена игрокам,
     * которые и определяют их стратегию, сдаём им по две карты
     */
    prepareGame(numLvl:number) {
        // let failedPlrsData: Array<playersData> = [];
        // plrsData.forEach((fPlr) => {
        //     if (fPlr.money < 50)
        //         failedPlrsData.push({ "name": fPlr.name, "money": fPlr.money });
        // });

        // if (failedPlrsData.length != 0) return failedPlrsData;

        // /** если все игроки при деньгах, создаём массив игроков в таком порядке:
        //  * user, oslik, khrusha - User, LeftBot, RightBot и тасуем карты
        //   */
        // let tmpData: Array<playersData>;
        // tmpData = plrsData.filter((plrData) => {
        //     if (plrData.name == "user") return true;
        //     return false;
        // });
        // this.playersArr.push(new User(tmpData[0].name, tmpData[0].money));

        // tmpData = plrsData.filter((plrData) => {
        //     if (plrData.name == "oslik") return true;
        //     return false;
        // });
        // this.playersArr.push(new LeftBot(tmpData[0].name, tmpData[0].money));

        // tmpData = plrsData.filter((plrData) => {
        //     if (plrData.name == "khrusha") return true;
        //     return false;
        // });
        // this.playersArr.push(new RightBot(tmpData[0].name, tmpData[0].money));

        this.playersArr = [];
        let cardsArr: Array<number> = [];

        for (let i = 0; i < 36; i++) {
            cardsArr.push(i);
        }

        this.shuffledArr = [...cardsArr];
        this.shuffledArr.sort(() => Math.random() - 0.5);

        switch(numLvl){
            case 1:
                this.myUser = new User("user",50);
                this.myLeftBot = new LeftBot("oslik",50);
                this.myRightBot = new RightBot("piggi",50);

                this.playersArr.push(this.myUser);
                this.playersArr.push(this.myLeftBot);
                this.playersArr.push(this.myRightBot);

                // this.playersArr.forEach(plr => {
                //     plr.setTwoCard(this.shuffledArr.shift(),this.shuffledArr.shift());
                // });
                break;
            case 2:
                this.myUser = new User("user",70);
                this.myLeftBot = new LeftBot("izabelle",70);
                this.myRightBot = new RightBot("pirate",70);

                this.playersArr.push(this.myUser);
                this.playersArr.push(this.myLeftBot);
                this.playersArr.push(this.myRightBot);
                break;
        }
    }

    /** проверяет не закончилась ли игра, определяет оставшихся
     * в игре персов
     */
    checkGameState() {
        this.playersInGame =[];

        // проверяем оставшихся в игре
        let activePlrs = this.playersArr.filter((plr) => {
            return (plr.playerState == PLAYERSTATE.INGAME);
        })

        activePlrs.forEach((plr) => {
            this.playersInGame.push(plr)
        })

        // если число непасовавших игроков больше одного, игру не
        // не останавливаем, выходим из функции
        if(activePlrs.length > 1)  return;

        this.gameState = GAMESTATE.END;
        //this.getResult();
    }

    /** проверяет не закончен ли уровень - это случается, если у хотя бы
     * одного из игроков закончились монеты
     */
    checkLevelState(){
        this.lvlWinners = [];

        this.playersArr.forEach((plr) => {
            this.lvlWinners.push(plr);
        })

        this.lvlWinners.sort((f,s) => {
            return s.coins - f.coins;
        })

        if(this.lvlWinners[this.lvlWinners.length - 1].coins == 0){
            
            if(this.myUser.coins == this.lvlWinners[0].coins){
                this.gameState = GAMESTATE.LEVEL_WIN;
                
            }else{
                this.gameState = GAMESTATE.LEVEL_LOST;
            }
        }
    }

    /** определяем победителей игры, заносим их в массив winnersPlayers,
     * вычисляем и начисляем выигрыш 
    */
    getResult(){
        let activePlrs = this.playersArr.filter((plr) => {
            return (plr.playerState == PLAYERSTATE.INGAME);
        })

        // если остался лишь один игрок, то он и получает банк
        if (activePlrs.length == 1) {
            activePlrs[0].coins += this.gameBank;
            //this.gameBank = 0;
            this.winnersPlayers.push(activePlrs[0]);
            return;
        }

        if (activePlrs.length != 0) {
            // если игру закончило несколько игроков, сортируем их по силе
            // комбинаций 
            activePlrs.sort((f, s) => {
                if (f.myCombi.combiName > s.myCombi.combiName) return 1;
                if (f.myCombi.combiName == s.myCombi.combiName) {
                    if (f.myCombi.cardValue % 9 > s.myCombi.cardValue % 9) return 1;
                    if (f.myCombi.cardValue % 9 < s.myCombi.cardValue % 9) return -1;
                    return 0;
                }
                return -1;
            });

            // упорядочиваем по убыванию
            activePlrs.reverse();

            // выбираем игроков с самой сильной комбинацией (их может быть
            // несколько)
            activePlrs.forEach((plr) => {
                if (plr.myCombi.combiName == activePlrs[0].myCombi.combiName &&
                    plr.myCombi.cardValue == activePlrs[0].myCombi.cardValue) {
                    this.winnersPlayers.push(plr);
                }
            });

            let price = Math.ceil(this.gameBank / this.winnersPlayers.length / 10) * 10;
            this.winnersPlayers.forEach((plr) => {
                plr.coins += price;
            })
            //this.gameBank = 0;
            return;
        }

        // если пасовали все, сортируем игроков по силе комбинаций,
        // ищем победителей из тех, кто пасовал последними, делим банк
        // если остались непасовавшие, выбираем из их числа
        //this.sortCombi();
        
        // если непасовавших нет, выбираем только что пасовавших
        activePlrs = this.playersArr.filter((plr) => {
            return (plr.playerState == PLAYERSTATE.PASSED);
        })

        // если последним пасовал только один, то он и выиграл
        if(activePlrs.length == 1){
            activePlrs[0].coins += this.gameBank;
            this.gameBank = 0;
            this.winnersPlayers.push(activePlrs[0]);
            return;
        }


        // если пасовало несколько игроков, ищем игрока с самой сильной
        // комбинацией и если игроков с равными комбинациями несколько, 
        // то делим выигрыш между ними
        activePlrs.forEach((plr) => {
            if(plr.myCombi.combiName == activePlrs[0].myCombi.combiName &&
                plr.myCombi.cardValue == activePlrs[0].myCombi.cardValue){
                    this.winnersPlayers.push(plr);
                }
        })

        let price = Math.ceil(this.gameBank/this.winnersPlayers.length/10)*10;
        this.winnersPlayers.forEach((plr) => {
            plr.coins+=price;
        })
        this.gameBank = 0;
    }

    /** сортирует комбинации игроков */
    sortCombi(){
        this.playersCombiArr = [] ;
        this.playersCombiArr.push({combi:this.myUser.myCombi, player: "user"},
            {combi:this.myLeftBot.myCombi, player: "leftBot"},
            {combi:this.myRightBot.myCombi, player: "rightBot"});

        this.playersCombiArr.sort((f,s) => {
            if(f.combi.combiName > s.combi.combiName) return 1;
            if(f.combi.combiName == s.combi.combiName){
                if(f.combi.cardValue%9 > s.combi.cardValue%9) return 1;
                if(f.combi.cardValue%9 < s.combi.cardValue%9) return -1;
                return 0;
            }
            return -1;
        });

        this.playersCombiArr.reverse();
        
        this.playersInGame.sort((f,s) => {
            if(f.myCombi.combiName > s.myCombi.combiName) return 1;
            if(f.myCombi.combiName == s.myCombi.combiName){
                if(f.myCombi.cardValue%9 > s.myCombi.cardValue%9) return 1;
                if(f.myCombi.cardValue%9 < s.myCombi.cardValue%9) return -1;
                return 0;
            }
            return -1;
        });

        this.playersInGame.reverse();
    }

    /** очищает от данных для начала следуей игры(розыгрыша банка) */
    completeGame(){
        this.playersArr.forEach((plr) => {
            plr.completeGame();
        })

        let cardsArr: Array<number> = [];

        for (let i = 0; i < 36; i++) {
            cardsArr.push(i);
        }

        this.shuffledArr = [...cardsArr];
        this.shuffledArr.sort(() => Math.random() - 0.5);

        this.playersCombiArr = [];
        this.winnersPlayers = [];
        this.gameBank = 0;
        this.myTableArr = [];
        tableArr = [];
    }

    /** снимает монеты с игроков, добавляет их в банк и сдаёт по две карты */
    setTwoCard() {
        this.playersArr.forEach((plr) => {
            plr.coins -= 10;
            this.gameBank += 10;
        })

        this.playersArr.forEach((plr) => {
            plr.setTwoCard(this.shuffledArr.pop(), this.shuffledArr.pop())
        })

        this.checkGameState();

        // ищем игроков, у которых закончились монеты
        // let nullCoinsArr = this.playersArr.filter((plr) => {
        //     if(plr.coins == 0) return true;
        // })

        // if(nullCoinsArr.length != 0){
        //    this.gameState = GAMESTATE.END;
        //    return;
        // } 
    }

    /** получает аргументом выбор игрока - пас или ставка, далее принимаются ставки,
    * если остался один не пасовавший, то он и забирает банк, если пасовали все,
    * то ищем сильнейшую комбинацию и определяем победителя, если в игре осталось
    * больше одного игрока, продолжаем - открываем первые три карты, переходим
    * к терну */
    playFlop(isBet: boolean) {
        if (this.playersArr[1].name == "oslik") {
            if (this.playersArr[1].coins >= 10) {
                this.playersArr[1].coins -= 10;
                this.gameBank += 10;
            } else {
                if (this.playersArr[1].playerState == PLAYERSTATE.PASSED)
                    this.playersArr[1].playerState = PLAYERSTATE.OUTGAME;

                if (this.playersArr[1].playerState == PLAYERSTATE.INGAME)
                    this.playersArr[1].playerState = PLAYERSTATE.PASSED;
            }
        }

        // если игрок пасовал
        if (!isBet) {
            if (this.playersArr[0].playerState == PLAYERSTATE.PASSED)
                this.playersArr[0].playerState = PLAYERSTATE.OUTGAME;

            if (this.playersArr[0].playerState == PLAYERSTATE.INGAME)
                this.playersArr[0].playerState = PLAYERSTATE.PASSED;

            if (this.playersArr[2].name == "piggi") {
                if (this.playersArr[2].playerState == PLAYERSTATE.PASSED)
                    this.playersArr[2].playerState = PLAYERSTATE.OUTGAME;

                if (this.playersArr[2].playerState == PLAYERSTATE.INGAME)
                    this.playersArr[2].playerState = PLAYERSTATE.PASSED;
            }
        } else {
            if (this.playersArr[0].coins >= 10) {
                this.playersArr[0].coins -= 10;
                this.gameBank += 10;
            } else {
                if (this.playersArr[0].playerState == PLAYERSTATE.PASSED)
                    this.playersArr[0].playerState = PLAYERSTATE.OUTGAME;

                if (this.playersArr[0].playerState == PLAYERSTATE.INGAME)
                    this.playersArr[0].playerState = PLAYERSTATE.PASSED;
            }

            if (this.playersArr[2].name == "piggi") {
                if (this.playersArr[2].coins >= 10) {
                    this.playersArr[2].coins -= 10;
                    this.gameBank += 10;
                } else {
                    if (this.playersArr[2].playerState == PLAYERSTATE.PASSED)
                        this.playersArr[2].playerState = PLAYERSTATE.OUTGAME;

                    if (this.playersArr[2].playerState == PLAYERSTATE.INGAME)
                        this.playersArr[2].playerState = PLAYERSTATE.PASSED;
                }
            }
        }
            
        this.checkGameState();

        if(this.gameState == GAMESTATE.END) return;

        this.gameState = GAMESTATE.FLOP;
        
            // let nullCoinsArr = this.playersArr.filter((plr) => {
            //     if(plr.coins == 0) return true;
            // })

            // if(nullCoinsArr.length != 0){
            //    this.gameState = GAMESTATE.END;
            //    return;
            // } 

        tableArr.push(this.shuffledArr.pop(), this.shuffledArr.pop(),
            this.shuffledArr.pop());
        tableArr.sort((a, b) => {
            if (a % 9 == b % 9) return a - b;
            return a % 9 - b % 9;
        })

        this.playersArr.forEach((plr) => {
            if (plr.playerState == PLAYERSTATE.INGAME)
                plr.flop();
        })

        this.myTableArr = tableArr;
    }

    playTern(isBet:boolean){
        if (this.playersArr[1].name == "oslik") {
            if (this.playersArr[1].coins >= 10) {
                this.playersArr[1].coins -= 10;
                this.gameBank += 10;
            } else {
                if (this.playersArr[1].playerState == PLAYERSTATE.PASSED)
                    this.playersArr[1].playerState = PLAYERSTATE.OUTGAME;

                if (this.playersArr[1].playerState == PLAYERSTATE.INGAME)
                    this.playersArr[1].playerState = PLAYERSTATE.PASSED;
            }
        }

        // если игрок пасовал
        if (!isBet) {
            if (this.playersArr[0].playerState == PLAYERSTATE.PASSED)
                this.playersArr[0].playerState = PLAYERSTATE.OUTGAME;

            if (this.playersArr[0].playerState == PLAYERSTATE.INGAME)
                this.playersArr[0].playerState = PLAYERSTATE.PASSED;

            if (this.playersArr[2].name == "piggi") {
                if (this.playersArr[2].playerState == PLAYERSTATE.PASSED)
                    this.playersArr[2].playerState = PLAYERSTATE.OUTGAME;

                if (this.playersArr[2].playerState == PLAYERSTATE.INGAME)
                    this.playersArr[2].playerState = PLAYERSTATE.PASSED;
            }
        } else {
            if (this.playersArr[0].coins >= 10) {
                this.playersArr[0].coins -= 10;
                this.gameBank += 10;
            } else {
                if (this.playersArr[0].playerState == PLAYERSTATE.PASSED)
                    this.playersArr[0].playerState = PLAYERSTATE.OUTGAME;

                if (this.playersArr[0].playerState == PLAYERSTATE.INGAME)
                    this.playersArr[0].playerState = PLAYERSTATE.PASSED;
            }

            if (this.playersArr[2].name == "piggi") {
                if (this.playersArr[2].coins >= 10) {
                    this.playersArr[2].coins -= 10;
                    this.gameBank += 10;
                } else {
                    if (this.playersArr[2].playerState == PLAYERSTATE.PASSED)
                        this.playersArr[2].playerState = PLAYERSTATE.OUTGAME;

                    if (this.playersArr[2].playerState == PLAYERSTATE.INGAME)
                        this.playersArr[2].playerState = PLAYERSTATE.PASSED;
                }
            }
        }
            
        this.checkGameState();

        if(this.gameState == GAMESTATE.END) return;

        this.gameState = GAMESTATE.TERN;

        tableArr.push(this.shuffledArr.pop());
        // tableArr.sort((a, b) => {
        //     if (a % 9 == b % 9) return a - b;
        //     return a % 9 - b % 9;
        // })

        this.playersArr.forEach((plr) => {
            if (plr.playerState == PLAYERSTATE.INGAME)
                plr.tern();
        })

        this.myTableArr = tableArr;
    }

    playRiver(isBet:boolean){
        if (this.playersArr[1].name == "oslik") {
            if (this.playersArr[1].coins >= 10) {
                this.playersArr[1].coins -= 10;
                this.gameBank += 10;
            } else {
                if (this.playersArr[1].playerState == PLAYERSTATE.PASSED)
                    this.playersArr[1].playerState = PLAYERSTATE.OUTGAME;

                if (this.playersArr[1].playerState == PLAYERSTATE.INGAME)
                    this.playersArr[1].playerState = PLAYERSTATE.PASSED;
            }
        }

        // если игрок пасовал
        if (!isBet) {
            if (this.playersArr[0].playerState == PLAYERSTATE.PASSED)
                this.playersArr[0].playerState = PLAYERSTATE.OUTGAME;

            if (this.playersArr[0].playerState == PLAYERSTATE.INGAME)
                this.playersArr[0].playerState = PLAYERSTATE.PASSED;

            if (this.playersArr[2].name == "piggi") {
                if (this.playersArr[2].playerState == PLAYERSTATE.PASSED)
                    this.playersArr[2].playerState = PLAYERSTATE.OUTGAME;

                if (this.playersArr[2].playerState == PLAYERSTATE.INGAME)
                    this.playersArr[2].playerState = PLAYERSTATE.PASSED;
            }
        } else {
            if (this.playersArr[0].coins >= 10) {
                this.playersArr[0].coins -= 10;
                this.gameBank += 10;
            } else {
                if (this.playersArr[0].playerState == PLAYERSTATE.PASSED)
                    this.playersArr[0].playerState = PLAYERSTATE.OUTGAME;

                if (this.playersArr[0].playerState == PLAYERSTATE.INGAME)
                    this.playersArr[0].playerState = PLAYERSTATE.PASSED;
            }

            if (this.playersArr[2].name == "piggi") {
                if (this.playersArr[2].coins >= 10) {
                    this.playersArr[2].coins -= 10;
                    this.gameBank += 10;
                } else {
                    if (this.playersArr[2].playerState == PLAYERSTATE.PASSED)
                        this.playersArr[2].playerState = PLAYERSTATE.OUTGAME;

                    if (this.playersArr[2].playerState == PLAYERSTATE.INGAME)
                        this.playersArr[2].playerState = PLAYERSTATE.PASSED;
                }
            }
        }

        //this.gameState == GAMESTATE.END;
            
        this.checkGameState();

        if(this.gameState == GAMESTATE.END) return;

        //this.gameState = GAMESTATE.TERN;

        tableArr.push(this.shuffledArr.pop());

        this.playersArr.forEach((plr) => {
            if (plr.playerState == PLAYERSTATE.INGAME)
                plr.river();
        })

        this.myTableArr = tableArr;
    }
}



// находим комбинации в наборе из пяти или двух карт 
function findCombi(setArr: Array<number>): combi {
    //setArr = [1,23,28,19,35];
    let retArr:Array<number> = [];
    // комбинации для двух карт
    if (setArr.length == 2) {
        if (setArr[0]%9 == setArr[1]%9){
            setArr.sort((a:number,b:number) => { return a-b } )
            return {
                "combiName": COMBINATION.PAIR, "cardValue": setArr[0],
                "combiArr": setArr.slice()
            };
        }
        if (setArr[0]%9 > setArr[1]%9) {
            return {
                "combiName": COMBINATION.BIGGEST_CARD, "cardValue": setArr[0],
                "combiArr": [setArr[1], setArr[0]]
            };
        } else {
            return {
                "combiName": COMBINATION.BIGGEST_CARD, "cardValue": setArr[1],
                "combiArr": [setArr[0], setArr[1]]
            };
        }
    }

    // комбинации из пяти карт
    // проверяем одинаковой ли масти карты
    let tmpArr: Array<number> = setArr.filter(card => card < 9);
    if (tmpArr.length < 5) {
        tmpArr = setArr.filter(card => card >= 9 && card < 18);
    }
    if (tmpArr.length < 5) {
        tmpArr = setArr.filter(card => card >= 18 && card < 27);
    }
    if (tmpArr.length < 5) {
        tmpArr = setArr.filter(card => card > 26);
    }

    // если одномастных карт пять - имеем флеш, проверяем дальше на
    // роял флеш и стрит-флеш, для этого сначала отсортируем по возрастанию
    if (tmpArr.length == 5) {
        tmpArr.sort((a, b) => { return a - b })
        // проверяем сначала на роял-флеш для всех мастей
        if ((tmpArr[4] == 8 && tmpArr[0] == 4) ||
            (tmpArr[4] == 17 && tmpArr[0] == 13) ||
            (tmpArr[4] == 26 && tmpArr[0] == 22) ||
            (tmpArr[4] == 35 && tmpArr[0] == 31)) {

            return { "combiName": COMBINATION.ROYAL_FLASH, "cardValue": tmpArr[4],
                "combiArr" : tmpArr };
        }

        // проверяем на флеш-стрит для всех мастей, сначала комбинацию 6,7,8,9,туз
        if ((tmpArr[0] == 0 && tmpArr[3] == 3 && tmpArr[4] == 8) ||
            (tmpArr[0] == 9 && tmpArr[3] == 12 && tmpArr[4] == 17) ||
            (tmpArr[0] == 18 && tmpArr[3] == 21 && tmpArr[4] == 26) ||
            (tmpArr[0] == 27 && tmpArr[3] == 30 && tmpArr[4] == 35)) {
            tmpArr.unshift(tmpArr[4]);
            tmpArr.pop();
            return {
                "combiName": COMBINATION.STREET_FLASH, "cardValue": tmpArr[4],
                "combiArr": tmpArr
            };
        }

        // проверяем на флеш-стрит для всех мастей для оставшихся вариантов
        if (tmpArr[4] - tmpArr[0] == 4) {
            return { 
                "combiName": COMBINATION.STREET_FLASH, "cardValue": tmpArr[4],
                "combiArr" : tmpArr
            };
        }

        return { 
            "combiName": COMBINATION.FLASH, "cardValue": tmpArr[4],
            "combiArr":tmpArr
        };
    }

    // если флеш не найден, продолжаем поиск каре, фулхауза, тройки
    tmpArr = [];
    // заносим в tmpArr номиналы карт и сортируем по номиналу
    setArr.forEach(val => { tmpArr.push(val % 9) })
    tmpArr.sort((a, b) => { return a - b });

    // ищем каре
    if (tmpArr[0] == tmpArr[3] || tmpArr[1] == tmpArr[4]){
        retArr = setArr.slice();
        let careValue = tmpArr[1];
        retArr.sort((a:number, b:number) => {
            if(a%9 == b%9) return a-b;
            if(a%9 != careValue) return -1;
            return 0;
        })
        return { "combiName": COMBINATION.CARE, "cardValue": tmpArr[3],
            "combiArr":retArr
        };
    }
    // ищем фулхаус
    if((tmpArr[0] == tmpArr[2] && tmpArr[3] == tmpArr[4])||
        (tmpArr[0] == tmpArr[1] && tmpArr[2] == tmpArr[4])){
        retArr=setArr.slice();
        retArr.sort((a:number, b:number) => {
            if(a%9 == b%9) return a-b;
            if(a%9 == tmpArr[2]) return 1;
            return -1;
        } )
        return { "combiName": COMBINATION.FULL_HOUSE, "cardValue": tmpArr[4],
            "combiArr": retArr
        };
    }

    // ищем тройку
    if (tmpArr[0] == tmpArr[2] || tmpArr[1] == tmpArr[3] ||
        tmpArr[2] == tmpArr[4]) {
        retArr = setArr.slice();
        retArr.sort((a:number, b:number) => {
            if(a%9 == b%9) return a-b;
            if(a%9 == tmpArr[2]) return 1;
            if(b%9 == tmpArr[2]) return -1;
            return a%9-b%9;
        })
        return { "combiName": COMBINATION.TRIPLE, "cardValue": tmpArr[2],
            "combiArr" : retArr
         };
    }

    // ищем стрит, сначала комбинацию туз,6,7,8,9
    if (tmpArr[0] == 0 && tmpArr[1] == 1 && tmpArr[2] == 2 &&
        tmpArr[3] == 3 && tmpArr[4] == 8){
        retArr = setArr.slice();
        retArr.sort((a:number, b:number) => {
            if(a%9 == 8) return -1;
            if(b%9 == 8) return 1;
            return a%9-b%9;
        })
        return { "combiName": COMBINATION.STREET, "cardValue": 3,
            "combiArr":retArr
         };
    }

    if ((tmpArr[0] == tmpArr[1] - 1) && (tmpArr[1] == tmpArr[2] - 1) &&
        (tmpArr[2] == tmpArr[3] - 1) && (tmpArr[3] == tmpArr[4] - 1)) {
        retArr = setArr.slice();
        retArr.sort((a:number, b:number) => {
            return a%9 - b%9;
        })

        return { "combiName": COMBINATION.STREET, "cardValue": tmpArr[4],
            "combiArr":retArr
         };
    }

    // ищем две пары
    if (tmpArr[0] == tmpArr[1] && tmpArr[2] == tmpArr[3]){
        retArr = setArr.slice();
        retArr.sort((a:number, b:number) => {
            if(a%9 == tmpArr[4]) return -1;
            if(b%9 == tmpArr[4]) return 1;
            if(a%9 == b%9) return a-b;
            return a%9 - b%9;
        })
        return { "combiName": COMBINATION.TWO_PAIR, "cardValue": tmpArr[3],
            "combiArr":retArr
        };
    }

    if (tmpArr[0] == tmpArr[1] && tmpArr[3] == tmpArr[4]){
        retArr = setArr.slice();
        retArr.sort((a:number, b:number) => {
            if(a%9 == tmpArr[2]) return -1;
            if(b%9 == tmpArr[2]) return 1;
            if(a%9 == b%9) return a-b;
            return a%9 - b%9;
        })
        return { "combiName": COMBINATION.TWO_PAIR, "cardValue": tmpArr[4],
            "combiArr":retArr
        };
    }
    
    if (tmpArr[1] == tmpArr[2] && tmpArr[3] == tmpArr[4]){
        retArr = [];
        retArr = setArr.slice();
        retArr.sort((a:number, b:number) => {
            if(a%9 == tmpArr[0]) return -1;
            if(b%9 == tmpArr[0]) return 1;
            return a%9 - b%9;
        })
        return { "combiName": COMBINATION.TWO_PAIR, "cardValue": tmpArr[4],
            "combiArr":retArr
        };
    }

    // ищем пару
    if (tmpArr[0] == tmpArr[1] || tmpArr[1] == tmpArr[2]){
        retArr = setArr.slice();
        retArr.sort((a:number, b:number) => {
            if(a%9 == b%9) return a-b;
            if(a%9 == tmpArr[1]) return 1;
            if(b%9 == tmpArr[1]) return -1;
            return a%9 - b%9;
        })
        return { "combiName": COMBINATION.PAIR, "cardValue": tmpArr[1],
            "combiArr":retArr
         };
    }
        

    if (tmpArr[2] == tmpArr[3] || tmpArr[3] == tmpArr[4]){
        retArr = setArr.slice();
        retArr.sort((a:number, b:number) => {
            if(a%9 == b%9) return a-b;
            if(a%9 == tmpArr[3]) return 1;
            if(b%9 == tmpArr[3]) return -1;
            return a%9 - b%9;
        })
        return { "combiName": COMBINATION.PAIR, "cardValue": tmpArr[3],
            "combiArr":retArr
         };
    }

    retArr = setArr.slice();
    retArr.sort((a:number, b:number) => {
        return a%9- b%9;
    })
    return { "combiName": COMBINATION.BIGGEST_CARD, "cardValue": tmpArr[4],
        "combiArr":retArr
     };
    // если флеш-стритов нет, заносим в userCombi флеш
    //userCombi.flash = tmpArr.slice(tmpArr[tmpArr.length-5],tmpArr[tmpArr.length-1]);
}


class User implements IPlayer
{
    name: string;
    coins:number;
    playerState:PLAYERSTATE;
    twoCardArr:Array<number>;
    myCombi:combi;

    constructor(name: string, coins:number)
    {
        this.name = name;
        this.coins =coins;
        this.twoCardArr=[];
        this.playerState = PLAYERSTATE.INGAME;
    }

    doBet(bool:boolean):boolean{
        if(!bool && this.playerState == PLAYERSTATE.PASSED)
        {
            this.playerState = PLAYERSTATE.OUTGAME;
            return;
        }

        if(bool){
            this.coins-=10;
            
        }

        if(this.coins >= 50){
            this.coins-=50;
            return true;
        }

        this.playerState = PLAYERSTATE.PASSED;
        return false;
    }

    /** очищает от данных для начала следуей игры(зозыгрыша банка) */
    completeGame(){
        this.twoCardArr = [];
        this.playerState = PLAYERSTATE.INGAME;
    }

    /** сдаются две карты */
    setTwoCard(firstCard:number, secondCard:number){
        this.myCombi = findCombi([firstCard,secondCard])
        this.twoCardArr.push(this.myCombi.combiArr[0],this.myCombi.combiArr[1]);
    }

    /** открываются три карты */
    flop(){
        this.myCombi = findCombi(this.twoCardArr.concat(tableArr));
    }

    /** открылась четвёртая карта */
    tern(){
        let newCombi:combi ;
        let bestCombi:combi = this.myCombi;

        // для теста
        //tableArr = [19,28,5,14];

        let tmpArr:Array<number> = tableArr.slice();

        // для теста
        //tmpArr = [19,28,5,14];
        //this.twoCardArr = [20,17];

        for(let i=0; i<4; i++){
            tmpArr.splice(i,1);
            newCombi = findCombi(this.twoCardArr.concat(tmpArr));
            if((newCombi.combiName > bestCombi.combiName) ||
                (newCombi.combiName == bestCombi.combiName &&
                newCombi.cardValue > bestCombi.cardValue))
            {
                bestCombi = newCombi;
            }
            tmpArr = tableArr.slice();
        }

        // если комбинация улучшилась, будет какая-то анимация и
        // замена карт
        if ((bestCombi.combiName > this.myCombi.combiName) ||
            (bestCombi.combiName == this.myCombi.combiName &&
                bestCombi.cardValue > this.myCombi.cardValue)) {
            this.myCombi = bestCombi;
        }
    }

    /** открылась пятая карта */
    river(){
        let newCombi:combi ;
        let tmpArr:Array<number> ;
        let bestCombi:combi = this.myCombi;
        let preTmpArr:Array<number> = tableArr.slice();
        
        for (let i = 0; i < 5; i++) {
            preTmpArr.splice(i, 1);
            tmpArr = preTmpArr.slice();
            for (let j = 0; j < 4; j++) {
                tmpArr.splice(j, 1)
                newCombi = findCombi(this.twoCardArr.concat(tmpArr));
                if ((newCombi.combiName > bestCombi.combiName) ||
                    (newCombi.combiName == bestCombi.combiName &&
                        newCombi.cardValue > bestCombi.cardValue)) {
                    bestCombi = newCombi;
                }
                tmpArr = preTmpArr.slice();
            }
            preTmpArr = tableArr.slice();
        }

        // если комбинация улучшилась, будет какая-то анимация и
        // замена карт
        if ((bestCombi.combiName > this.myCombi.combiName) ||
            (bestCombi.combiName == this.myCombi.combiName &&
                bestCombi.cardValue > this.myCombi.cardValue)) {
            this.myCombi = bestCombi;
        }
    }
}

class  LeftBot implements IPlayer
{
    name: string;
    coins:number;
    playerState:PLAYERSTATE;
    twoCardArr:Array<number>;
    myCombi:combi;

    constructor(name: string, coins:number)
    {
        this.name = name;
        this.coins =coins;
        this.twoCardArr = [];
        this.playerState = PLAYERSTATE.INGAME;
    }

    doBet():boolean{
        if(this.playerState == PLAYERSTATE.PASSED) return false;

        if(this.coins >= 50){
            this.coins -= 50;
            return true;
        }

        this.playerState = PLAYERSTATE.PASSED;
        return false;
    }

    /** очищает от данных для начала следуей игры(зозыгрыша банка) */
    completeGame(){
        this.twoCardArr = [];
        this.playerState = PLAYERSTATE.INGAME;
    }

    /** сдаются две карты */
    setTwoCard(firstCard:number, secondCard:number){
        this.myCombi = findCombi([firstCard,secondCard])
        this.twoCardArr.push(this.myCombi.combiArr[0],this.myCombi.combiArr[1]);
    }

    /** ищем комбинации с тремя открытыми картами */
    flop(){
        this.myCombi = findCombi(this.twoCardArr.concat(tableArr));
    }

    /** ищем комбинации с четырьмя открытыми картами */
    tern(){
        let newCombi:combi ;
        let bestCombi:combi = this.myCombi;
        let tmpArr:Array<number> = tableArr.slice();
        for(let i=0; i<4; i++){
            tmpArr.splice(i,1);
            newCombi = findCombi(this.twoCardArr.concat(tmpArr));
            if((newCombi.combiName > bestCombi.combiName) ||
                (newCombi.combiName == bestCombi.combiName &&
                newCombi.cardValue > bestCombi.cardValue))
            {
                bestCombi = newCombi;
            }
            tmpArr = tableArr.slice();
        }

        // если комбинация улучшилась, будет какая-то анимация и
        // замена карт
        if ((bestCombi.combiName > this.myCombi.combiName) ||
            (bestCombi.combiName == this.myCombi.combiName &&
                bestCombi.cardValue > this.myCombi.cardValue)) {
            this.myCombi = bestCombi;
        }
    }

    /** ищем комбинации с пятью открытыми картами */
    river(){
        let newCombi:combi ;
        let tmpArr:Array<number> ;
        let bestCombi:combi = this.myCombi;
        let preTmpArr:Array<number> = tableArr.slice();
        
        for (let i = 0; i < 5; i++) {
            preTmpArr.splice(i, 1);
            tmpArr = preTmpArr.slice();
            for (let j = 0; j < 4; j++) {
                tmpArr.splice(j, 1)
                newCombi = findCombi(this.twoCardArr.concat(tmpArr));
                if ((newCombi.combiName > bestCombi.combiName) ||
                    (newCombi.combiName == bestCombi.combiName &&
                        newCombi.cardValue > bestCombi.cardValue)) {
                    bestCombi = newCombi;
                }
                tmpArr = preTmpArr.slice();
            }
            preTmpArr = tableArr.slice();
        }

        // если комбинация улучшилась, будет какая-то анимация и
        // замена карт
        if ((bestCombi.combiName > this.myCombi.combiName) ||
            (bestCombi.combiName == this.myCombi.combiName &&
                bestCombi.cardValue > this.myCombi.cardValue)) {
            this.myCombi = bestCombi;
        }
    }
}

class  RightBot implements IPlayer
{
    name: string;
    coins:number;
    playerState:PLAYERSTATE;
    twoCardArr:Array<number>;
    myCombi:combi;

    constructor(name: string, coins:number)
    {
        this.name = name;
        this.coins =coins;
        this.twoCardArr = [];
        this.playerState = PLAYERSTATE.INGAME;
    }

    doBet():boolean{
        if(this.playerState == PLAYERSTATE.PASSED) return false;

        if(this.coins >= 50){
            this.coins -= 50;
            return true;
        }

        this.playerState = PLAYERSTATE.PASSED;
        return false;
    }

    /** очищает от данных для начала следуей игры(зозыгрыша банка) */
    completeGame(){
        this.twoCardArr = [];
        this.playerState = PLAYERSTATE.INGAME;
    }

    /** сдаются две карты */
    setTwoCard(firstCard:number, secondCard:number){
        this.myCombi = findCombi([firstCard,secondCard])
        this.twoCardArr.push(this.myCombi.combiArr[0],this.myCombi.combiArr[1]);
    }

    /** ищем комбинации с тремя открытыми картами */
    flop(){
        this.myCombi = findCombi(this.twoCardArr.concat(tableArr));
    }

    /** ищем комбинации с четырьмя открытыми картами */
    tern(){
        let newCombi:combi ;
        let bestCombi:combi = this.myCombi;
        let tmpArr:Array<number> = tableArr.slice();
        for(let i=0; i<4; i++){
            tmpArr.splice(i,1);
            newCombi = findCombi(this.twoCardArr.concat(tmpArr));
            if((newCombi.combiName > bestCombi.combiName) ||
                (newCombi.combiName == bestCombi.combiName &&
                newCombi.cardValue > bestCombi.cardValue))
            {
                bestCombi = newCombi;
            }
            tmpArr = tableArr.slice();
        }

        // если комбинация улучшилась, будет какая-то анимация и
        // замена карт
        if ((bestCombi.combiName > this.myCombi.combiName) ||
            (bestCombi.combiName == this.myCombi.combiName &&
                bestCombi.cardValue > this.myCombi.cardValue)) {
            this.myCombi = bestCombi;
        }
    }

    /** ищем комбинации с пятью открытыми картами */
    river(){
        let newCombi:combi ;
        let tmpArr:Array<number> ;
        let bestCombi:combi = this.myCombi;
        let preTmpArr:Array<number> = tableArr.slice();
        
        for (let i = 0; i < 5; i++) {
            preTmpArr.splice(i, 1);
            tmpArr = preTmpArr.slice();
            for (let j = 0; j < 4; j++) {
                tmpArr.splice(j, 1)
                newCombi = findCombi(this.twoCardArr.concat(tmpArr));
                if ((newCombi.combiName > bestCombi.combiName) ||
                    (newCombi.combiName == bestCombi.combiName &&
                        newCombi.cardValue > bestCombi.cardValue)) {
                    bestCombi = newCombi;
                }
                tmpArr = preTmpArr.slice();
            }
            preTmpArr = tableArr.slice();
        }

        // если комбинация улучшилась, будет какая-то анимация и
        // замена карт
        if ((bestCombi.combiName > this.myCombi.combiName) ||
            (bestCombi.combiName == this.myCombi.combiName &&
                bestCombi.cardValue > this.myCombi.cardValue)) {
            this.myCombi = bestCombi;
        }
    }
}