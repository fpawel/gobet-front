/// <reference types="react" />
/// <reference types="react-dom" />
import * as React from "react";
import {observer}  from "mobx-react";
import {Component}  from "react";
import { store  } from "../store/store";

@observer
export class Alert extends Component<{}, {}> {

    render(){
        if(!store.Message){
            return null;
        }
        let s1 = 'alert-info';
        if( store.Message.type==='ServerError' ||
            store.Message.type==='ConnectionError') {
            s1 = 'alert-danger';
        }
        let classAttr = "alert alert-dismissable " + s1;

        let closeElem =
            store.Message.type === 'Info' ?
                <a className="close" {...{'aria-label':'alert'} }
                    style= { {marginLeft : '10px'} } onClick={() => store.Message = null}>×</a>
                : null;

        return <div className={classAttr}
                    style={ { position:'fixed', bottom:'20px', right:'20px'} }>
            {closeElem}
            <strong style={{marginRight: '10px'}}>
                {store.Message.title}
            </strong>
            {store.Message.text}

        </div>;
    }
}
