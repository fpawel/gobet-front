export namespace ApiNgData {
        
    export interface Event  {

        // The unique id for the event
        id:number,

        // The name of the event
        name: string,

        // The ISO-2 code for the event.
        // A list of ISO-2 codes is available via
        // http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
        country_code:string,

        // This is timezone in which the event is taking place./
        time_zone: string,

        // The scheduled start date and time of the event.
        // This is Europe/London (GMT) by default
        open_date : string,

        // Count of markets associated with this event
        market_count? : number,

        event_type? : EventType
        
    }

    export interface EventType  {
        id:number,
        name:string,
        market_count? : number,
    }

}