/// <reference types="react" />
import * as React from "react";
import { observer } from "mobx-react";
import { store  } from "../../store/store";

import { FootballData } from "../../data/football";
import { getCountryNameByCode } from "../../utils/country-code";


type OddF = keyof (FootballData.Odds);
const oddsF : OddF [] = [ 'win1', 'win2', 'draw1', 'draw2', 'lose1', 'lose2'];

@observer
export class FootballGame extends React.Component<{key:number, game:FootballData.Game},{}>{
    render(){
        let game = this.props.game;
        const event = store.events.get(game.event_id);
        const country = event ? getCountryNameByCode(event.country_code) : '';

        function maybeChanged<T>(
            f : (_:FootballData.GameChanges) => T | undefined ) : (string | undefined) {
                    return game.changes ? 
                        ( f(game.changes) ? 'changed animated zoomIn' : undefined ) : 
                        undefined;
                }

        const odd = (  k:OddF) => {
            return <td key={k} 
                className = {maybeChanged(  (a) => a[k] )} 
                style={{textAlign:"right"}}>
                {game[k]}
            </td>;
        };
        
        return <tr>
        <td className = {maybeChanged( (a) => a.page || a.order)} >
            { `${game.page}.${game.order}`}
            </td>

        <td>
            { country }
        </td>
        
        <td>
            {game.home}
            </td>
        
        <td className = {maybeChanged( (a) => a.result )}>
            {game.result}                            
            </td>

        <td>
            {game.away}
        </td>
        <td className = {maybeChanged( (a) => a.time )}>
            {game.time}
        </td>
        
        {  oddsF .map( (s) => odd(s) ) }

        </tr>;
    }

}