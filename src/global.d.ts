declare global{
    var gYsdk;
    var gPlayer;
    var gData;
    var lang: string;

    enum LEVELSTATE{COMPLETED, ENABLE, DISABLE}

    type PlayerData = {
        name:string,
        coins: number
    }

    type LevelData = {
        playersData: Array<PlayerData>,
        levelState: LEVELSTATE
    }
    
    type LevelsData = Array<LevelData>; 

    /** данные о достижениях игрока в виде массива с данными уровней*/
    var levelsData:LevelsData;

    /** номер уровня, уровень либо выбирается пользователем, если он уже проходился,
     * либо равен 1, если ни один уровень ещё не пройден
      */
    var numLevel:number;
}
export {}