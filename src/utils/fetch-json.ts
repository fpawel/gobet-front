interface Arg<T> { 
    what: string; 
    url: string; 
    method:string;
    handleError?: (error:string)=>void; 
    handleData: (x:T)=>void; 
};

export const fetchJson = <T>(x: Arg<T>) => {

    var xhr = new XMLHttpRequest();
    xhr.open(x.method, x.url, true);
    xhr.send();
    var y : {ok? : T; errror? : string} = {};
    const onError = (s:string) => {
        console.error( `error fetching ${x.what}`,'response:',y,s); 
        if (x.handleError){
            x.handleError(s);
        }        
    };

    xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) {
            return;
        } 
            
        if (xhr.status !== 200) {            
            onError( `${xhr.status}: ${xhr.statusText}` ); 
            return;
        } 
        const y : {ok? : T; errror? : string} = JSON.parse(xhr.responseText);
        if(y.ok !== undefined){
            x.handleData(y.ok);
        } else if (y.errror !== undefined){
            onError(`data error: ${y.errror}`);
        } else{
            onError('unexpected response');
        }            
    };
};
