import { IWiseXboardControl } from '@ktaicoder/hw-proto';
import { firstValueFrom, Subject } from 'rxjs';
import { HwClientProxySocketIo } from './HwClientProxySocketIo';
import { DeviceCtlResponse, KitConnector } from './KitConnector';

function nextRequestId() {
    return Math.random().toString(36).substring(2);
}

const WEBSOCKET_URL = 'ws://192.168.114.95:3001'
const destroyTrigger$ = new Subject<any>()
const connector = new KitConnector(destroyTrigger$, WEBSOCKET_URL)
const proxy = new HwClientProxySocketIo(connector)
const wiseXboard = proxy.bindClientInterface<IWiseXboardControl>('wiseXboard')

async function send() {
    const requestId = nextRequestId()
    console.log('try send', requestId)
    await connector.sendDeviceCtlMsgV2({
        clientMeta: { clientType: 'blockcoding' },
        requestId,
        hwId: 'wise-xboard',
        cmd: 'digitalWrite',
        args: [1, 1],
    })
    console.log('sent success, wait')
    const response: DeviceCtlResponse = await firstValueFrom(connector.observeDeviceCtlResponseV2(requestId))
    console.log(response)
}

async function send2() {
    await wiseXboard.digitalWrite(1, 1)
    const pinValues = await wiseXboard.digitalRead()
    console.log('end response = ', pinValues)
}

setTimeout(() => {
    send2()
}, 1000)
