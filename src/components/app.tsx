/// <reference types="react" />
/// <reference types="react-dom" />
import * as React from "react";
import {observer}  from "mobx-react";
import {Component}  from "react";
import { SportsMenu } from "./sports-menu";
import { Sport } from "./sport";
import { Alert } from "./alert";
import { spinnerLoading } from "./spinner-loading";
import { Navbar } from "./navbar";
import { Football } from "./football/football";
import { store  } from "../store/store";



@observer
class AppComponent extends Component<{}, {}> {
    content(){

        switch(store.route.type){
            case 'Football': 
                return <Football />;
            case 'Sport':
                return store.sports.has(store.route.sportID) ?
                    <Sport id={store.route.sportID}  /> :
                    spinnerLoading(`Данные считываются...`);
            default: 
                return <div>
                    Страница не найдена. Вернуться на <a href='#/'>главную</a>?
                </div>;
        }
    }
    render() {
        return <div>
            <Navbar />
            <div className='container'>
                <SportsMenu />
                {this.content()}
                {store.Message ? <Alert /> : null }
                
            </div>
        </div>;
    }
}


export const App = <AppComponent />;