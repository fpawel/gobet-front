/// <reference types="mobx" />
import {computed, observable, action } from "mobx";

import {ApiNgData} from "../data/aping";
import {FootballData} from "../data/football";
import {ReconnectingWebSocket} from "../utils/reconnecting-websocket";
import {parseLocationHash, getSportID, getEventID} from "../data/route";

const webSocketURL = () => {
    return `${document.location.protocol.replace("http", "ws")}//${document.location.host}/d`;
};

type MessageType = 'ConnectionError' | 'ServerError' | 'Info';

class Store {
    @observable sports = new Map<number, ApiNgData.EventType>();
    @observable sportEvents  = new Map<number, number[]>();

    public getEventsBySportID(sportID : number){
        let xs = this.sportEvents.get(sportID);
        if(!xs){
            xs = []
        }
        return xs.map( (x) => this.events.get(x) ).filter((x) => x);
    }

    @observable hasSportEvents  = new Set<number>();
    @observable events  = new Map<number, ApiNgData.Event>();

    @observable markets  = new Map<number, any>();

    @observable football: FootballData.Game[] = [];
    @observable route  = parseLocationHash(window.location.hash);    
    @observable
    private message: { title: string, text: string, type: MessageType } = null;
    private messageTimeoutHandle: number = NaN;
    

    public set Message(value) {
        this.message = value;
        clearTimeout(this.messageTimeoutHandle);
        this.messageTimeoutHandle = NaN;
        if (value && value.type === 'Info') {
            this.messageTimeoutHandle = setTimeout(() => {
                this.Message = null;
            }, 60000);
        }
    }

    @computed
    public get Message() {
        return this.message;
    }


    private ws = new ReconnectingWebSocket(webSocketURL());

    constructor() {
        this.route = parseLocationHash(window.location.hash);
        window.addEventListener('hashchange', this.handleLocationChanged);
        this.setupWebsocket();
    }

    readonly setupWebsocket = () => {
        this.ws.onmessage = (event) => {
            this.handleWebData(JSON.parse(event.data));
        };

        this.ws.onclose = (event) => {
            this.Message = {
                title: 'Нет связи',
                type: 'ConnectionError',
                text: 'Произошёл обрыв соединеия с сервером. Выполяется попытка восстановить соединение.'
            };
        };

        this.ws.onopen = (event) => {
            if (this.Message && this.Message.type === 'ConnectionError') {
                this.Message = null;
            }
            this.initializeStore();
        };
        this.ws.connect(false);
    }

    readonly initializeStore = () => {
        this.ws.sendJSON({ListEventTypes: {}});
        this.ws.sendJSON({SubscribeFootball: this.route.type === 'Football'});
        if (this.route.type === 'Sport') {
            this.ensureEventTypeEvents(this.route.sportID);
        }
        if (this.route.type === 'Event') {
            this.ensureEventMarkets(this.route.eventID);
        }

    }

    readonly handleWebData = (x: WebData) => {

        if (x.Error) {
            console.error('Error from server:', x.Error);
            this.Message = {
                title: 'Ошибка сервера',
                type: 'ServerError',
                text: 'Что-то пошло не так :('
            };
            return;
        }

        if (this.Message && this.Message.type === 'ServerError') {
            this.Message = null;
        }

        if (x.Football) {
            this.updateFootball(x.Football);
            return;
        }

        if (x.EventTypes) {
            for (let n = 0; n < x.EventTypes.length; n++ ){
                let sport = x.EventTypes[n];
                this.sports.set(sport.id, sport);
            }
            return;
        }

        if (x.EventType) {
            this.sportEvents.set(x.EventType.ID, x.EventType.Events.map((x) => x.id));
            this.hasSportEvents.add(x.EventType.ID);
            x.EventType.Events.forEach((x) => this.events.set(x.id, x) );
            return;
        }

        if (x.Event) {
            this.addNewEvent(x.Event);
            return;
        }

        console.error('Unknown data from server:', x);

    }



    @action
    private addNewEvent(newEvent:ApiNgData.Event){
        this.events.set(newEvent.id, newEvent);
        let sportEvents = this.sportEvents.get(newEvent.event_type.id);
        sportEvents = sportEvents ? Array.from(sportEvents) : [];
        sportEvents.push(newEvent.id);
        this.sportEvents.set(newEvent.event_type.id, sportEvents);
    }

    private updateFootball(upd : UpdateFootball){
        this.ws.send(JSON.stringify({
            Football: {
                ConfirmHashCode: upd.HashCode,
            },
        }));
        this.football = FootballData.updateGames(this.football, upd.Changes);
        if (upd.Changes.events) {
            upd.Changes.events.forEach((event) => {
                event.event_type = {
                    id:1,
                    name:'Футбол',
                };
                this.addNewEvent(event);
            });
        }
    }

    private ensureEventTypeEvents (id: number) {
        if (!this.hasSportEvents.has(id)) {
            this.ws.sendJSON({
                ListEventType: id,
            });
        }
    }

    private ensureEventMarkets (eventID: number) {
        if (!this.markets.has(eventID)) {
            this.ws.sendJSON({
                ListEvent: eventID,
            });
        }
    }

    readonly handleLocationChanged = () => {
        const prevRoute = this.route;
        const prevRouteFootball = this.route.type === 'Football';
        this.route = parseLocationHash(window.location.hash);
        const thisRouteFootball = this.route.type === 'Football';

        if (prevRouteFootball !== thisRouteFootball) {
            this.ws.sendJSON({
                SubscribeFootball: thisRouteFootball
            });
        }
        if (this.route === prevRoute) {
            return;
        }
        if(this.route.type === 'Sport'){
            this.ensureEventTypeEvents(this.route.sportID);
        }

        if( this.route.type === 'Event' ){
            this.ensureEventMarkets(this.route.eventID);
        }
    }

    @computed public get SportOfRoute()  {
        const sportID = getSportID(this.route);
        return sportID ? this.sports.get( sportID ) : null;
    }

    @computed public get EventOfRoute()  {
        const eventID = getEventID(this.route);
        return eventID ? this.events.get( eventID ) : null;
    }


}

export const store = new Store();

interface WebData {
    Football?: UpdateFootball,
    EventTypes?: ApiNgData.EventType[],
    EventType?: {
        Events: ApiNgData.Event[],
        ID: number,
    },

    Event?: ApiNgData.Event,
    Error?: any,
}

interface UpdateFootball {    
    Changes: FootballData.GamesChanges,
    HashCode: string,    
}






