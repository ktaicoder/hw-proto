import ReconnectingWebSocket from 'reconnecting-websocket'
import { WebSocket } from 'ws'
import { IHwClientMeta, IHwClientType } from './types'
import { sendAndWait } from './websocket-helper'

const DEBUG = true

export class HwClientProxy {
    constructor(private socket: WebSocket | ReconnectingWebSocket) {}

    private runCmd = async (clientMeta: IHwClientMeta, hwId: string, cmd: string, args: unknown[]): Promise<any> => {
        try {
            const { success, error, body } = await sendAndWait({
                socket: this.socket,
                clientMeta,
                hwId,
                cmd,
                args,
            })
            if (DEBUG) console.log('response=', { success, body, error })
            if (success === true) {
                return body
            } else {
                throw new Error(error)
            }
        } catch (err: any) {
            console.log(err)
            // TODO error wrapping
            throw err
        }
    }

    /**
     * 함수 호출을 웹소켓 요청으로 바인딩한다
     * @param hwId
     * @param commands
     * @returns
     */
    bindCommands = <T>(params: { clientType?: IHwClientType; hwId: string; commands: string[] }): T => {
        const { clientType = 'normal', hwId, commands } = params

        if (commands.length === 0) {
            console.warn('bind commands is empty')
        }

        const clientMeta = { clientType } as IHwClientMeta

        const result = {}
        //const { commands, hwId } = serviceDescriptor
        commands.forEach((cmd) => {
            Object.defineProperty(result, cmd, {
                enumerable: true,
                get: () => {
                    if (DEBUG && this.socket.readyState !== WebSocket.OPEN) {
                        console.log(`called property: ${cmd}, readyState = ${this.socket.readyState}`)
                    }
                    return (...arguments_: unknown[]) => this.runCmd(clientMeta, hwId, cmd, arguments_)
                },
            })
        })

        return result as T
    }
}
