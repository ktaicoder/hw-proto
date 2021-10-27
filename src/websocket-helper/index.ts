import ReconnectingWebSocket from 'reconnecting-websocket'
import { sendAndWaitByReconnectWebSocket } from './reconnect-ws-helper'
import { sendAndWaitByWebSocket } from './ws-helper'
import { IHwClientMeta } from '../types'
import { WebSocket } from 'ws'

export async function sendAndWait(params: {
    socket: ReconnectingWebSocket | WebSocket
    hwId: string
    clientMeta: IHwClientMeta
    cmd: string
    args: unknown[]
    requestTimeout?: number
}): Promise<any> {
    const { socket, hwId, clientMeta, cmd, args, requestTimeout } = params
    if (typeof params.socket['retryCount'] === 'undefined') {
        return sendAndWaitByWebSocket({
            socket: socket as WebSocket,
            hwId,
            clientMeta,
            cmd,
            args,
            requestTimeout,
        })
    } else {
        return sendAndWaitByReconnectWebSocket({
            socket: socket as ReconnectingWebSocket,
            hwId,
            clientMeta,
            cmd,
            args,
            requestTimeout,
        })
    }
}
