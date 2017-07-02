/// <reference types="react" />
import * as React from "react";
import {observer} from "mobx-react";
import {ApiNgData} from "../data/aping";
import {numberToCompare} from "../utils/utils";
import {spinnerLoading} from "./spinner-loading";
import {store} from "../store/store";


@observer
export class SportsMenu extends React.Component<{}, {}> {
    render() {
        if (!store.sports) {
            return spinnerLoading('Загрузка меню...');
        }
        const sports =
            Array.from(store.sports.values()).sort((x, y) =>
                numberToCompare(y.market_count - x.market_count));
        const xs1 = sports.filter((_, n) => n < 6);
        let xs2 = sports.filter((_, n) => n > 5);
        let xs2Title = xs2.length > 0 ? xs2[0].name : '';
        const sportOfRoute = store.SportOfRoute;
        if (sportOfRoute) {
            for (let n = 0; n < xs2.length; n++) {
                if (xs2[n].id === sportOfRoute.id) {
                    xs2Title = xs2[n].name;
                    break;
                }
            }
        }

        return <ul className='nav nav-tabs'>
            {xs1.map((sport) => {
                return <LinkSport sport={sport} key={sport.id}/>;
            })}
            <SportsDropdownMenu sports={xs2} title={xs2Title}/>
        </ul>;

    }
}

@observer
class SportsDropdownMenu extends React.Component<{
    sports: ApiNgData.EventType[],
    title : string,
}, {}> {

    render() {
        let class_ = 'dropdown';
        if (store.SportOfRoute && this.props.sports.find((x) => x.id === store.SportOfRoute.id)) {
            class_ += ' active';
        }
        return this.props.sports.length === 0 ? null : <li className={class_}>
            <a className='dropdown-toggle'
               {...{'data-toggle': 'dropdown'}}
               style={{color: '#337ab7'}}>
                {this.props.title}
                <span className='caret'/>

            </a>
            <ul className='dropdown-menu'>
                {this.props.sports.map((sport) => {
                    return <LinkSport sport={sport} key={sport.id}/>;
                })}
            </ul>
        </li>;
    }
}


@observer
class LinkSport extends React.Component<{ sport: ApiNgData.EventType }, {}> {

    isActive() {

        switch (store.route.type) {
            case 'Sport':
                return this.props.sport.id === store.route.sportID;
            case 'Football':
                return this.props.sport.id === 1;
            default:
                return false;
        }
        ;

    }

    render() {
        const to = this.props.sport.id === 1 ? 'football' : `sport/${this.props.sport.id}`;

        return <li className={this.isActive() ? 'active' : undefined }>
            <a href={ '#/' + to }>
                {this.props.sport.name}
            </a>
        </li>;
    }
}
