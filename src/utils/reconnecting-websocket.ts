
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


const webSocketCloseCodeStr = new Map<number, string>(
    [
        [1000, "Normal closure, meaning that the purpose for which the connection was established has been fulfilled"],
        [1001, "An endpoint is \"going away\", such as a server going down or a browser having navigated away from a page."],
        [1002, "An endpoint is terminating the connection due to a protocol error"],
        [1003, "An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message)."],
        [1004, "Reserved. The specific meaning might be defined in the future."],
        [1005, "No status code was actually present."],
        [1006, "The connection was closed abnormally, e.g., without sending or receiving a Close control frame"],
        [1007, "An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message)."],
        [1008, "An endpoint is terminating the connection because it has received a message that \"violates its policy\". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy."],
        [1009, "An endpoint is terminating the connection because it has received a message that is too big for it to process."],
        [1010, "An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn't return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: "],
        [1011, "A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request."],
        [1015, "The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified)."],
    ]);

const webSocketCloseCodeToString = (code:number) => {
    const r = webSocketCloseCodeStr.get(code);
    return r ? r : `unknown close code '${code}'`
} ;


export class ReconnectingWebSocket {

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
        console.log('WebSocket connecting...', this.url);

        var localWs = this.ws;
        var timeout = setTimeout(() => {
            console.error('WebSocket connection timeout', this.timeoutInterval);
            this.timedOut = true;
            localWs.close();
            this.timedOut = false;
        }, this.timeoutInterval);

        this.ws.onopen = (event: Event) => {
            clearTimeout(timeout);
            console.log('WebSocket opened', this.url);
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
                    console.error('websocket closed: ', webSocketCloseCodeToString(event.code));
                }
                tryReconnect();
            }
        };
        this.ws.onmessage = (event) => {
            this.onmessage(event);
        };
        this.ws.onerror = (event) => {
            console.error('WebSocket error ocured:', this.url);
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


}




