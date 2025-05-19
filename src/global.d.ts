declare global{
    var gYsdk;
    var gPlayer;
    var gData;
    var lang: string;

    enum LEVELSTATE{COMPLETED=0, ENABLE=1, DISABLE=2}

    type PlayerData = {
        name:string,
        coins: number
    }

    type LevelData = {
        numLvl: number,
        coins: number,
        levelState: LEVELSTATE
    }
    
    type LevelsData = { playerName:string, playerAchiev: Array<LevelData>}; 

    /** данные о достижениях игрока в виде массива с данными уровней*/
    var levelsData:LevelsData;

    /** номер уровня, уровень либо выбирается пользователем, если он уже проходился,
     * либо равен 1, если ни один уровень ещё не пройден
      */
    var numLevel:number;
}
export {}