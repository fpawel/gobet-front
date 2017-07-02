/**
 * Created by binf on 27.06.2017.
 */
/// <reference types="react" />
/// <reference types="react-dom" />

import * as React from "react";
import {observer} from "mobx-react";
import {store} from "../store/store";


const footballMenu = () => {
    const f = store.route.type === 'Football';
    return <ul className="nav navbar-nav" >
        <li className="active"><a>Футбол</a></li>
        <li className= { f ? "active" : "" }>
            <a href= { f ? undefined : "#/football"} >
                Сегодня
            </a>
        </li>
        <li className= { f ? undefined : "active" }>
            <a href= { f ? "#/sport/1" : ""}>
                Все футбольные рынки
            </a>
        </li>
    </ul>;
};

const sportName = () => {
    const sport = store.SportOfRoute;
    if (!sport) return null;
    if (sport.id === 1)
        return footballMenu();
    return <ul className="nav navbar-nav" >
        <li className="active">
            <a> {sport.name}</a>
        </li>
    </ul>;
};

@observer
export class Navbar extends React.Component<{}, {}> {

    render() {
        return <nav className="navbar navbar-inverse"
                    style={{
                        backgroundColor: '#5f5f5f',
                        borderColor: '#5f5f5f',
                        fontFamily: '"Segoe UI",Arial,sans-serif',
                        fontSize: '17px',
                    }}>
            <div className="container-fluid">
                <div className="navbar-header">
                    <a className="navbar-brand" style={{color:'#fff'}} >Gobet</a>
                </div>
                { sportName() }
            </div>
        </nav>;
    }
}
