// MIT License:
//
// Copyright (c) 2010-2012, Joe Walnes
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/**
 * This behaves like a WebSocket in every way, except if it fails to connect,
 * or it gets disconnected, it will repeatedly poll until it succesfully connects
 * again.
 *
 * It is API compatible, so when you have:
 *   ws = new WebSocket('ws://....');
 * you can replace with:
 *   ws = new ReconnectingWebSocket('ws://....');
 *
 * The event stream will typically look like:
 *  onconnecting
 *  onopen
 *  onmessage
 *  onmessage
 *  onclose // lost connection
 *  onconnecting
 *  onopen  // sometime later...
 *  onmessage
 *  onmessage
 *  etc...
 *
 * It is API compatible with the standard WebSocket API.
 */



export class ReconnectingWebSocket {
    //These can be altered by calling code
    public debug: boolean = false;

    //Time to wait before attempting reconnect (after close)
    public reconnectInterval: number = 1000;

    // The maximum number of milliseconds to delay a reconnection attempt. 
    public maxReconnectInterval: number = 30000;

    // The rate of increase of the reconnect delay. Allows reconnect attempts to back off when problems persist. 
    public reconnectDecay: number = 1.5;

    //Time to wait for WebSocket to open (before aborting and retrying)
    public timeoutInterval: number = 2000;

    //The maximum number of reconnection attempts to make. Unlimited if null. 
    public maxReconnectAttempts: number | null = null;

    // The binary type, possible values 'blob' or 'arraybuffer', default 'blob'. 
    public binaryType: string = 'blob';

    //Should only be used to read WebSocket readyState
    public readyState: number;

    //Whether WebSocket was forced to close by this client
    private forcedClose: boolean = false;
    //Whether WebSocket opening timed out
    private timedOut: boolean = false;

    //List of WebSocket sub-protocols
    private protocols: string[] = [];

    //The underlying WebSocket
    private ws: WebSocket | null;
    private url: string;

    /** The number of attempted reconnects since starting, or the last successful connection. Read only. */
    private reconnectAttempts: number = 0;

    /**
     * A string indicating the name of the sub-protocol the server selected; this will be one of
     * the strings specified in the protocols parameter when creating the WebSocket object.
     * Read only.
     */
    readonly protocol: string | null = null;

    /**
     * Setting this to true is the equivalent of setting all instances of ReconnectingWebSocket.debug to true.
     */
    public static debugAll = false;

    // Set up the default 'noop' event handlers
    // Wire up "on*" properties as event handlers
    public onopen: (ev: Event) => void = function (event: Event) { };
    public onclose: (ev: CloseEvent) => void = function (event: CloseEvent) { };
    public onconnecting: () => void = function () { };
    public onmessage: (ev: MessageEvent) => void = function (event: MessageEvent) { };
    public onerror: (ev: Event) => void = function (event: Event) { };

    constructor(url: string, protocols: string[] = []) {
        this.url = url;
        this.protocols = protocols;
        this.readyState = WebSocket.CONNECTING;
        this.protocol = null;
    }


    public connect(reconnectAttempt: boolean) {
        this.ws = new WebSocket(this.url, this.protocols);
        this.ws.binaryType = this.binaryType;
        if (reconnectAttempt) {
            if (this.maxReconnectAttempts && this.reconnectAttempts > this.maxReconnectAttempts) {
                return;
            }
        } else {
            this.onconnecting();
            this.reconnectAttempts = 0;
        }
        this.log('ReconnectingWebSocket', 'attempt-connect', this.url);

        var localWs = this.ws;
        var timeout = setTimeout(() => {
            this.log('ReconnectingWebSocket', 'connection-timeout', this.url);
            this.timedOut = true;
            localWs.close();
            this.timedOut = false;
        }, this.timeoutInterval);

        this.ws.onopen = (event: Event) => {
            clearTimeout(timeout);
            this.log('ReconnectingWebSocket', 'onopen', this.url);
            this.readyState = WebSocket.OPEN;
            reconnectAttempt = false;
            this.reconnectAttempts = 0;
            this.onopen(event);
        };


        const tryReconnect = () => {
            this.readyState = WebSocket.CONNECTING;
            this.onconnecting();
            const timeout = this.reconnectInterval * Math.pow(this.reconnectDecay, this.reconnectAttempts);
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect(true);
            }, timeout > this.maxReconnectInterval ? this.maxReconnectInterval : timeout);
        };

        this.ws.onclose = (event: CloseEvent) => {
            this.onclose(event);
            clearTimeout(timeout);
            this.ws = null;            
            if (this.forcedClose) {
                this.readyState = WebSocket.CLOSED;                
            } else {
                if (!reconnectAttempt && !this.timedOut) {
                    this.log('ReconnectingWebSocket', 'onclose', this.url);                    
                }
                tryReconnect();
            }
        };
        this.ws.onmessage = (event) => {
            this.log('ReconnectingWebSocket', 'onmessage', this.url, event.data);
            this.onmessage(event);
        };
        this.ws.onerror = (event) => {
            this.log('ReconnectingWebSocket', 'onerror', this.url, event);
            this.onerror(event);
            this.close();
            tryReconnect();
        };
    }

    public sendJSON(x: any) {
        this.send(JSON.stringify(x));
    }

    public send(data: any) {
        if (this.ws) {
            this.log('ReconnectingWebSocket', 'send', this.url, data);


            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(data);
            } else {

                const f = this.ws.onopen;

                this.ws.onopen = (ev: Event) => {
                    f.apply(this.ws, ev);
                    this.ws.onopen = f;
                    this.ws.send(data);
                };
            }


        } else {
            throw 'INVALID_STATE_ERR : Pausing to reconnect websocket';
        }
    }

    /**
     * Returns boolean, whether websocket was FORCEFULLY closed.
     */
    public close(): boolean {
        if (this.ws) {
            this.forcedClose = true;
            this.ws.close();
            return true;
        }
        return false;
    }

    /**
     * Additional public API method to refresh the connection if still open (close, re-open).
     * For example, if the app suspects bad data / missed heart beats, it can try to refresh.
     *
     * Returns boolean, whether websocket was closed.
     */
    public refresh(): boolean {
        if (this.ws) {
            this.ws.close();
            return true;
        }
        return false;
    }

    private log(...args: any[]) {
        if (this.debug || ReconnectingWebSocket.debugAll) {
            console.debug.apply(console, args);
        }
    }
}




