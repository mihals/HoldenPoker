enum COMBINATION  {BIGGEST_CARD, PAIR, TWO_PAIR, STREET, TRIPLE,
    FULL_HOUSE, FLASH, CARE, STREET_FLASH, ROYAL_FLASH };
enum STEP {BET, PASS};
enum GAMESTATE {BEGINNING, TWO_CARD, FLOP, TERN, RIVER, END};
enum PLAYERSTATE {INGAME, PASSED};
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
    doBet():boolean

    /** открываются три карты */
    flop():void;

    /** открылась четвёртая карта */
    tern():void;

    /** открылась пятая карта */
    river():void;
}

/** массив игроков */
export let playersArr:Array<IPlayer>=[];

/** карты на столе */
let tableArr:Array<number>=[];

export class GameManager {
    /** массив перетасованных карт */
    shuffledArr: Array<number>;

    //tableArr:Array<number>;

    /** фаза игры - GAMESTATE */
    gameState: GAMESTATE;

    /** банк игры */
    gameBank: number = 0;

    constructor() {

    }

    /** проверяем платёжеспособность игроков и, если все при деньгах 
     * тасуем карты и возвращаем пустой массив, в противном случае возвращаем
     * массив объектов с данными неплатёжеспособных игроков
     */
    prepareGame(plrsData: Array<playersData>): Array<playersData> {
        let failedPlrsData: Array<playersData> = [];
        plrsData.forEach((fPlr) => {
            if (fPlr.money < 50)
                failedPlrsData.push({ "name": fPlr.name, "money": fPlr.money });
        });

        if (failedPlrsData.length != 0) return failedPlrsData;

        /** если все игроки при деньгах, создаём массив игроков в таком порядке:
         * user, oslik, khrusha - User, LeftBot, RightBot и тасуем карты
          */
        let tmpData: Array<playersData>;
        tmpData = plrsData.filter((plrData) => {
            if (plrData.name == "user") return true;
            return false;
        });
        playersArr.push(new User(tmpData[0].name, tmpData[0].money));

        tmpData = plrsData.filter((plrData) => {
            if (plrData.name == "oslik") return true;
            return false;
        });
        playersArr.push(new LeftBot(tmpData[0].name, tmpData[0].money));

        tmpData = plrsData.filter((plrData) => {
            if (plrData.name == "khrusha") return true;
            return false;
        });
        playersArr.push(new RightBot(tmpData[0].name, tmpData[0].money));

        let cardsArr: Array<number> = [];

        for (let i = 0; i < 36; i++) {
            cardsArr.push(i);
        }

        this.shuffledArr = [...cardsArr];
        this.shuffledArr.sort(() => Math.random() - 0.5);
        return failedPlrsData;
    }

    /** проверяем состояние игры - у всех ли игроков хватает средств, чтобы
     * продолжить игру, сколько осталось непасовавших игроков
     */
    checkGameState() {
        let failedPlrsData: Array<playersData> = [];
        playersArr.forEach((fPlr) => {
            if (fPlr.coins < 50)
                failedPlrsData.push({ "name": fPlr.name, "money": fPlr.coins });
        });

        return failedPlrsData;
    }

    /** снимает монеты с игроков, добавляет их в банк и сдаёт по две карты */
    setTwoCard() {
        playersArr.forEach((plr) => {
            plr.coins -= 5;
            this.gameBank += 5;
        })

        playersArr.forEach((plr) => {
            plr.setTwoCard(this.shuffledArr.pop(), this.shuffledArr.pop())
        })
    }

    /** получает аргументом выбор игрока - пас или ставка, далее принимаются ставки,
 * если остался один не пасовавший, то он и забирает банк, если пасовали все,
 * то ищем сильнейшую комбинацию и определяем победителя, если в игре осталось
 * больше одного игрока, продолжаем - открываем первые три карты, переходим
 * к терну */
    playFlop(playerState: PLAYERSTATE) {
        // если игрок пасовал
        if (playerState == PLAYERSTATE.PASSED) {
            playersArr[0].playerState = PLAYERSTATE.PASSED;
        }

        // игроки делают ставки или пасуют
        playersArr.forEach((plr) => plr.doBet());

        // проверяем оставшихся в игре
        let activePlrs = playersArr.filter((plr) => {
            return (plr.playerState == PLAYERSTATE.INGAME);
        })

        // если остался лишь один игрок, то он и получает банк
        if (activePlrs.length == 1) {
            activePlrs[0].coins += this.gameBank;
            this.gameBank = 0;
            this.gameState = GAMESTATE.END;
            return;
        }

        // если пасовали все, ищем победителей, делим банк
        if (activePlrs.length == 0) {
            let winners = findBestCombi();
            let profit = this.gameBank / winners.length;
            winners.forEach((plr) => {
                plr.coins += profit;
            })
            this.gameBank = 0;
            this.gameState = GAMESTATE.END;
            return;
        }


        tableArr.push(this.shuffledArr.pop(), this.shuffledArr.pop(),
            this.shuffledArr.pop());
        tableArr.sort((a, b) => {
            if (a % 9 == b % 9) return a - b;
            return a % 9 - b % 9;
        })
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

    doBet():boolean{
        if(this.playerState == PLAYERSTATE.PASSED) return false;

        if(this.coins >= 50){
            this.coins-=50;
            return true;
        }

        this.playerState = PLAYERSTATE.PASSED;
        return false;
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