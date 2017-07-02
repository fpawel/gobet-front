const dateToTimeString = (x:Date) => {
    const f = (a:number) => `${a<10 ? '0' : ''}${a}`;
    return `${f(x.getHours())}:${f(x.getMinutes())}`;
};
sortColHelper(header:string, sortCol:SortColumn) {
    let color = 'lightgrey';
    let ch = '↕';
    if (this.state.sortColumn === sortCol){
        color = 'black';
        ch = this.state.sortDirection === 'ASC' ? '↓' : '↑';
    }
    return <th onClick = { () =>
    this.setState({
        sortColumn: sortCol,
        sortDirection: this.state.sortDirection === 'ASC' ? 'DESC' : 'ASC',
    })
} >
    {header}
    <span style={{color: color}}> {ch} </span>
    </th>;
}

function compare<T,R>( x:T, y:T, f? : (u:T) => R) {
    if (f){
        let a = f(x);
        let b = f(y);
        return a===b ? 0 : (a < b ? -1 : 1) ;
    }
    return x===y ? 0 : (x < y ? -1 : 1) ;
}


const sortEvents = (events:ApiNgData.Event[], sortColumn:SortColumn, sortDirection:SortDirection) => {

        return events.sort( (x,y) => {
            let r = 0;
            switch (sortColumn){
                case 'date':
                    r = compare(x,y, (a) => a.open_date);
                    break;
                case 'country':
                    r = compare(x,y, (a) => getCountryNameByCode(a.country_code));
                    break;
                case 'name':
                    r = compare(x,y, (a) => splitAwayTeam(a.name)[0]);
                    break;
                case 'awayTeam':
                    r = compare(x,y, (a) => {
                        let x = splitAwayTeam(a.name)[1];
                        return x ? x : "";
                    });
                    break;
            }
            return r * (sortDirection === 'ASC' ? -1 : 1);
        } );
    };