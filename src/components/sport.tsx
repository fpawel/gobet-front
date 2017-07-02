/// <reference types="react" />
/// <reference types="react-virtualized" />
import * as React from "react";
import {observer} from "mobx-react";
import {store} from "../store/store";
import {ApiNgData} from "../data/aping";
import {getCountryNameByCode} from "../utils/country-code";
import {spinnerLoading} from "./spinner-loading";

import {Column, Table } from "react-virtualized";
//import * as css from 'react-virtualized/styles.css'; // only needs to be imported once
//console.log(css);

type SortColumn = 'date' | 'country' | 'name' | 'awayTeam';
const sortColumnValues: SortColumn [] =
    ['date', 'country', 'name' ];


const eventToViewData = (x: ApiNgData.Event) => {
    let d = new Date(Date.parse(x.open_date));
    let sx = x.name.split(/ [v@\\-] /);
    return {
        id: x.id,
        date: d.toLocaleDateString(),
        country: getCountryNameByCode(x.country_code),
        name: sx.length > 1 ? sx[0] : x.name,
        away: sx.length > 1 ? sx[1] : '' ,
    };
};

const linkEvent = (id:number, text:string) =>{
    return <a href={`#/event/${id}`} > {text} </a>;
}

@observer
export class Sport extends React.Component<{ id: number }, {
    sortDirection: 'ASC' | 'DESC',
    sortColumn: SortColumn,
}> {
    constructor() {
        super();
        this.state = {sortColumn: 'date', sortDirection: 'ASC'};
    }

    render() {
        let viewData = this.getViewData();
        if (!viewData || viewData.length === 0) {
            let str = store.SportOfRoute ? store.SportOfRoute.name : this.props.id;
            return spinnerLoading(`Загружаются данные по виду спорта: '${str}'...`);
        }
        let hasAway = viewData.find((x) => { return x.away !== ''; } );
        let hasCountry = viewData.find((x) => { return x.country !== ''; } );

        const {sortColumn : sortCol, sortDirection : sortDir} = this.state;
        return <Table
            width={hasAway ? 700 : 500}
            height={screen.availHeight - 300}
            rowHeight={25}
            rowCount={viewData.length}
            headerHeight={30}
            rowGetter={({index}) => viewData[index]}
            sortDirection={this.state.sortDirection}
            sortBy={this.state.sortColumn}
            rowClassName={(x) => {
                if (x.index < 0) {
                    return "headerRow";
                } else {
                    return x.index % 2 === 0 ? "evenRow" : "oddRow";
                }
            }}
            sort={(x) => {
                let col = sortColumnValues.find((y) => `${y}` === x.sortBy);
                if (col ) {
                    this.setState({
                        sortColumn: col,
                        sortDirection : col !== sortCol ? sortDir :
                            (sortDir === 'ASC' ? 'DESC' : 'ASC')
                    })
                }
            }}
            onHeaderClick={ (x) => {
                let col = sortColumnValues.find((y) => `${y}` === x.dataKey);
                if (col ) {
                    this.setState({
                        sortColumn: col,
                        sortDirection : col !== sortCol ? sortDir :
                            (sortDir === 'ASC' ? 'DESC' : 'ASC')
                    })
                }
            }}

        >
            <Column label='Дата' dataKey='date' width={100}/>
            {hasCountry ? <Column label='Страна' dataKey='country' width={200} /> : null }
            <Column
                label= { hasAway ? 'Дома' : 'Событие' }
                dataKey='name' width={200}
                cellRenderer={(x) => {
                    return linkEvent(viewData[x.rowIndex].id, x.cellData) ;
                }}
            />
                { ! hasAway ? null :
                    <Column
                        label='В гостях' dataKey='away' width={200}
                        cellRenderer={(x) => {
                            return linkEvent(viewData[x.rowIndex].id, x.cellData) ;
                        }}
                    />
                }
        </Table >
    }



    getViewData() {
        return store
            .getEventsBySportID(this.props.id)
            .map((x) => eventToViewData(x))
            .sort((ax, ay) => {
                let x = (ax as any)[this.state.sortColumn];
                let y = (ay as any)[this.state.sortColumn];
                let r = x === y ? 0 : (x < y ? -1 : 1);
                return r * (this.state.sortDirection === 'ASC' ? -1 : 1);
            })
            .map((x) =>{
                return {
                    id : x.id,
                    date : x.date,
                    country: x.country,
                    name: x.name,
                    away: x.away,
                };
            });
    }
    setSortCol(dataKey:string){
        let col = sortColumnValues.find((y) => `${y}` === dataKey);
        if (col ) {
            this.setState({...this.state, sortColumn: col})
        }
    }
}

/*


* */