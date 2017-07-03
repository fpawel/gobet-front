

export type Route = 
    { 
        type: 'Football' 
    } | 
    {
        type : 'Sport', 
        sportID:number
    } | 
    {
        type : 'Event',
        eventID:number,
    } | 
    {
        type: 'Unknown'
    };

export const getSportID = (route : Route )  => {
    switch (route.type) {
        case 'Sport':
            return route.sportID;
        case 'Football':
            return 1;
        default:
            return null;
    }
}

export const getEventID = (route : Route )  => {
    switch (route.type) {
        case 'Event':
            return route.eventID;
        default:
            return null;
    }
}

export function parseLocationHash (lcoationHash:string) : Route {
    if( lcoationHash ==='#/' || 
        lcoationHash ==='/' || 
        lcoationHash ==='' || 
        (/^#\/football\/?$/g).test(lcoationHash) )
    {        
        return { type: 'Football' };
    }
    {
        const a = (/^#\/sport\/(\d+)\/?$/g).exec(lcoationHash);
        if( a!==undefined && a!==null && a.length===2){
            
            const sport_id  =  parseInt(a[1]);
            if (sport_id !== NaN){                        
                return {
                    type : 'Sport', 
                    sportID: sport_id
                };
            }            
        }
    }
    {        
        const a = (/^#\/event\/(\d+)\/?$/g).exec(lcoationHash);
        if( a!==undefined && a!==null && a.length===2){
            const event_id  =  parseInt(a[1]);
            if ( event_id !== NaN) {
                return {
                    type : 'Event',
                    eventID:event_id,
                };
            }
        }
    }
    return { type: 'Unknown'};
};
        
