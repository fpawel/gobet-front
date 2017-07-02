var _this = this;
var dateToTimeString = function (x) {
    var f = function (a) { return "" + (a < 10 ? '0' : '') + a; };
    return f(x.getHours()) + ":" + f(x.getMinutes());
};
sortColHelper(header, string, sortCol, SortColumn);
{
    var color = 'lightgrey';
    var ch = '↕';
    if (this.state.sortColumn === sortCol) {
        color = 'black';
        ch = this.state.sortDirection === 'ASC' ? '↓' : '↑';
    }
    return <th onClick={function () {
        return _this.setState({
            sortColumn: sortCol,
            sortDirection: _this.state.sortDirection === 'ASC' ? 'DESC' : 'ASC',
        });
    }}>
    {header}
    <span style={{ color: color }}> {ch} </span>
    </th>;
}
function compare(x, y, f) {
    if (f) {
        var a = f(x);
        var b = f(y);
        return a === b ? 0 : (a < b ? -1 : 1);
    }
    return x === y ? 0 : (x < y ? -1 : 1);
}
var sortEvents = function (events, sortColumn, sortDirection) {
    return events.sort(function (x, y) {
        var r = 0;
        switch (sortColumn) {
            case 'date':
                r = compare(x, y, function (a) { return a.open_date; });
                break;
            case 'country':
                r = compare(x, y, function (a) { return getCountryNameByCode(a.country_code); });
                break;
            case 'name':
                r = compare(x, y, function (a) { return splitAwayTeam(a.name)[0]; });
                break;
            case 'awayTeam':
                r = compare(x, y, function (a) {
                    var x = splitAwayTeam(a.name)[1];
                    return x ? x : "";
                });
                break;
        }
        return r * (sortDirection === 'ASC' ? -1 : 1);
    });
};
