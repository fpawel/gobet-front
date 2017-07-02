/// <reference types="react" />
/// <reference types="mobx-react" />
import * as React from "react";
import { observer } from "mobx-react";
import { FootballGame } from "./game";
import { spinnerLoading } from "../spinner-loading";
import { store  } from "../../store/store";

const footbalTable = () => {
    return <table className={'table table-condensed table-football'}>
        <thead>
        <tr>{ [ "п/п" , "Страна" , "Дома" , "Счёт" ,
            "В гостях" , "Время" ,
            "П1+", "П1-", "Н+", "Н-", "П2+", "П2-"]
            .map((s) => <th key={s}> {s} </th>) }
        </tr>
        </thead>


        <tbody>
        { store.football.map((game, n) =>
            <FootballGame game={game} key={ game.event_id } /> )
        }
        </tbody>

    </table>;
} ;

@observer
export class Football extends React.Component<{}, {}> {
    render() {
        return store.football.length === 0 ?
            spinnerLoading('Считываются футбольные матчи')  :
            footbalTable();
    }
}

