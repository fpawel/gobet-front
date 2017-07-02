import {ApiNgData} from "./aping";
import {numberToCompare} from "../utils/utils";
    
export namespace FootballData {      
    export interface Odds  {
        win1?: number;
        win2?: number;
        draw1?: number;
        draw2?: number;
        lose1?: number;
        lose2?: number;
    }

    export interface  Live extends Odds {	
        page : number;
        order: number;
        time?: string;
        result?: string;
    }

    export interface Game extends Live {
        event_id: number;
        market_id:number;
        home:string;
        away:string;	
        changes?: GameChanges;
    }
    export interface GameChanges  {
        event_id: number;
        page?: number;
        order?: number;
        time?: string;
        result?: string;

        win1 : number | null | undefined;
        win2 : number | null | undefined;
        draw1 : number | null | undefined;
        draw2 : number | null | undefined;
        lose1 : number | null | undefined;
        lose2 : number | null | undefined;
    }

    export interface GamesChanges {
        inplay? : Game[];
        outplay? : number[];
        game_changes? : GameChanges[];
        events? : ApiNgData.Event[]
    }

    const formatGame = (x:Game) => `${x.page}.${x.order} ${x.home} ${x.away}`;

    const getGamesChanges = (x:GamesChanges) => {
        let r : {
            outplays : Set<number>,
            inplays : Map<number, Game>,
            changes : Map<number, GameChanges>,
        } = {
            outplays : new Set<number>(),
            inplays : new Map<number, Game>(),
            changes : new Map<number, GameChanges>(),
        };
        
        
        if (x.outplay){
            for (let value of x.outplay){
                r.outplays.add(value);
            }                
        }

        if (x.inplay){
            for (let value of x.inplay){
                r.inplays.set(value.event_id,value);
            } 
        }
        
        if (x.game_changes){
            for (let value of x.game_changes){
                r.changes.set(value.event_id, value);
            }
        }
        return r;
    };

    const applyGameChanges = (game:Game, x?:GameChanges) => {
        if(!x){
            return game;
        }
        game.page = x.page ? x.page : game.page;
        game.order = x.order ? x.order : game.order;
        game.result = x.result ? x.result : game.result;
        game.time = x.time ? x.time : game.time;
        game.win1 = x.win1 === undefined ? game.win1 : (x.win1 === null ? undefined : x.win1) ;
        game.win2 = x.win2 === undefined ? game.win2 : (x.win2 === null ? undefined : x.win2) ;
        game.draw1 = x.draw1 === undefined ? game.draw1 : (x.draw1 === null ? undefined : x.draw1) ;
        game.draw2 = x.draw2 === undefined ? game.draw2 : (x.draw2 === null ? undefined : x.draw2) ;
        game.lose1 = x.lose1 === undefined ? game.lose1 : (x.lose1 === null ? undefined : x.lose1) ;
        game.lose2 = x.lose2 === undefined ? game.lose2 : (x.lose2 === null ? undefined : x.lose2) ;
        game.changes = x;
        return game;
    };

    


    export const updateGames = ( games: Game[], gamesChanges:GamesChanges) => {

        const {outplays, inplays, changes} = getGamesChanges(gamesChanges);

        let updatedGames = 
            games.filter( (game) => {
                return outplays.has(game.event_id) || inplays.has(game.event_id)  ? false : true;
            }).map( (game) => {
                const gameChanges = changes.get(game.event_id);                  
                return gameChanges ? applyGameChanges(game, gameChanges) : game;
            } );

        
        let nextGames : Game [] = [];
        updatedGames.forEach((game) => nextGames.push(game) );      
        for(let [_,value] of Array.from(inplays) ) {
            nextGames.push(value);
        }
        nextGames.forEach((game) => game.changes = changes.get(game.event_id) );
        nextGames.sort( (x,y) => {
            switch (numberToCompare(x.page - y.page) ){
                case -1: return -1;
                case 1: return 1;
                case 0: return numberToCompare(x.order - y.order);            
            }
        } );

        if(!testUniqueEventID(nextGames)){
            console.log("bad changes:", gamesChanges);
        }
        
        return nextGames;
    };

    const testUniqueEventID = (games:Game[]) => {
        let ids = new Map<number,Game>();
        return games.filter((x) => {
            const y = ids.get(x.event_id);
            if (y) {                
                console.log(`Dublicate id: ${formatGame(x)} and ${formatGame(y)}`);                     
                return true;
            }
            ids.set(x.event_id,x);
            return false;
        }).length === 0;
    };
}
