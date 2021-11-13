import { hardwareDescriptors, IHwClientType, IHwClientMeta, HardwareId } from '@ktaicoder/hw-proto'
import { firstValueFrom } from 'rxjs'
import { DeviceCtlResponse, KitConnector } from './KitConnector'

const DEBUG = true

function nextRequestId() {
    return Math.random().toString(36).substring(2) + Date.now()
}

export class HwClientProxySocketIo {
    constructor(private connector: KitConnector) {}

    private waitResponse = async (requestId: string): Promise<DeviceCtlResponse> => {
        return await firstValueFrom(this.connector.observeDeviceCtlResponseV2(requestId))
    }

    private runCmd = async (clientMeta: IHwClientMeta, hwId: string, cmd: string, args: unknown[]): Promise<any> => {
        const requestId = nextRequestId()
        const succ = await this.connector.sendDeviceCtlMsgV2({
            requestId,
            clientMeta,
            hwId,
            cmd,
            args,
        })

        if (!succ) {
            const errmsg = `send fail: ${hwId}.${cmd}`
            console.log(errmsg)
            throw new Error(errmsg)
        }

        try {
            const { success, error, body } = await this.waitResponse(requestId)
            if (DEBUG) console.log('response=', { success, body, error })
            if (success === true) {
                return body
            } else {
                throw new Error(error)
            }
        } catch (err: any) {
            console.log(err)
            throw err
        }
    }

    bindClientInterface = <T>(hwId: HardwareId): T => {
        const { commands } = hardwareDescriptors[hwId]
        if (!commands) {
            console.log('unknown hwId:' + hwId)
            throw new Error('unknown hwId:' + hwId)
        }
        return this._bindHw({
            commands,
            hwId,
            clientType: 'blockcoding',
        })
    }

    /**
     * 함수 호출을 웹소켓 요청으로 바인딩한다
     * @param hwId
     * @param commands
     * @returns
     */
    private _bindHw = <T>(params: { clientType?: IHwClientType; hwId: string; commands: string[] }): T => {
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
                    return (...arguments_: unknown[]) => this.runCmd(clientMeta, hwId, cmd, arguments_)
                },
            })
        })

        return result as T
    }
}
