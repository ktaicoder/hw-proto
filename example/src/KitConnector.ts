import { IHwClientMeta } from '@ktaicoder/hw-proto'
import { BehaviorSubject, firstValueFrom, merge, Observable, Subject, Subscription } from 'rxjs'
import { distinctUntilChanged, filter, map, take, takeUntil, tap } from 'rxjs/operators'
import io, { Socket } from 'socket.io-client'
import { KitGpioPinData, KitGpioPinNumber } from './common'

const DEBUG = true

const DEVICE_CTL_REQUEST_V2 = 'deviceCtlMsg_v2:request'
const DEVICE_CTL_RESPONSE_V2 = 'deviceCtlMsg_v2:response'

export type KitState = 'FIRST' | 'PREPARING' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED'

export type KitSocketState = 'FIRST' | 'CONNECTED' | 'DISCONNECTED'

export type KitKeyState = 'FIRST' | 'OK' | 'NO_DEV_KEY'

type PredicateFunc<T> = (data: T) => boolean

export type DeviceCtlResponse = {
    requestId: string
    success: boolean
    error?: string
    body?: any
}

const isNullish = (v: any | undefined | null): boolean => {
    return typeof v === 'undefined' || v === null
}

const asGpioPinData = (frame: any | undefined | null): KitGpioPinData | undefined => {
    if (frame['Type'] !== 'ktaimk_gpio_data') return undefined

    const frameData = frame['Data']
    if (isNullish(frameData)) return undefined
    const pin = frameData['pin']
    const value = frameData['value']
    if (typeof pin === 'number' && typeof value === 'boolean') {
        return { pin, value }
    }
    return undefined
}

export class KitConnector {
    private _state$ = new BehaviorSubject<KitState>('FIRST')
    private _devKeyState$ = new BehaviorSubject<KitKeyState>('FIRST')
    private _socketState$ = new BehaviorSubject<KitSocketState>('FIRST')
    private _gpioPinValue$ = new BehaviorSubject<Record<number, boolean>>({})
    private _data$ = new Subject<any>()
    private _deviceCtlResponseV2$ = new Subject<DeviceCtlResponse>()
    private _buttonPush$ = new BehaviorSubject<number>(0)
    private _subscription: Subscription | null = null

    private sock: Socket | null = null
    constructor(public destroy$: Observable<void>, public websocketUrl: string) {}

    observeState = (): Observable<KitState> => {
        this.connect()
        return this._state$.asObservable().pipe(takeUntil(this.destroy$))
    }

    observeData = (): Observable<any> => {
        this.connect()
        return this._data$.asObservable().pipe(takeUntil(this.destroy$))
    }

    observeDeviceCtlResponseV2 = (requestId: string): Observable<DeviceCtlResponse> => {
        this.connect()
        return this._deviceCtlResponseV2$.asObservable().pipe(
            filter((it) => it.requestId === requestId),
            takeUntil(this.destroy$),
        )
    }

    observeGpioPinValue = (pin: KitGpioPinNumber): Observable<boolean> => {
        this.connect()
        return this._gpioPinValue$.pipe(
            filter((it) => typeof it[pin] === 'boolean'),
            map((it) => it[pin]),
            distinctUntilChanged(),
            takeUntil(this.destroy$),
        )
    }

    getGpioPinValue = (pin: KitGpioPinNumber): boolean | null => {
        this.connect()
        const values = this._gpioPinValue$.value
        return typeof values[pin] === 'boolean' ? values[pin] : null
    }

    /**
     * 버튼이 눌린 시간을 발행
     * @returns 눌린적이 없으면 0, 눌린적이 있으면 눌린 시간을 발행
     */
    observeButtonPush = (): Observable<number> => {
        this.connect()
        return this._buttonPush$.asObservable().pipe(takeUntil(this.destroy$))
    }

    /**
     * 상태가 정상일때 소켓을 발행한다
     */
    observeSocket = (): Observable<Socket | null> => {
        this.connect()
        return this._state$.pipe(
            map((it) => (it === 'CONNECTED' ? this.sock! : null)),
            takeUntil(this.destroy$),
        )
    }

    send = async (msgBody: any): Promise<boolean> => {
        this.connect()
        const src$ = this.observeSocket().pipe(
            filter((sock) => sock !== null),
            tap((sock) => {
                console.log('_send deviceCtlMsg', msgBody)
                sock?.emit('deviceCtlMsg', msgBody)
            }),
            takeUntil(this.destroy$),
        )

        try {
            await firstValueFrom(src$)
            return true
        } catch (err: any) {
            console.log(err)
        }
        return false
    }

    sendDeviceCtlMsgV2 = async (params: {
        requestId: string
        clientMeta: IHwClientMeta
        hwId: string
        cmd: string
        args?: any[]
    }): Promise<void> => {
        this.connect()
        const src$ = this.observeSocket().pipe(
            filter((sock) => sock !== null),
            tap((sock) => {
                const frame = params
                if (DEBUG) console.log(`_send ${DEVICE_CTL_REQUEST_V2}`, frame)
                sock?.emit(DEVICE_CTL_REQUEST_V2, frame)
            }),
            takeUntil(this.destroy$),
        )

        await firstValueFrom(src$)
    }

    private _notifyState = (state: KitState) => {
        if (this._state$.value !== state) {
            this._state$.next(state)
        }
    }

    private _onConnect = () => {
        console.log('connected')
        this._socketState$.next('CONNECTED')
    }

    private _onDisconnect = () => {
        console.log('disconnected')
        this._socketState$.next('DISCONNECTED')
    }

    private _onHasDevKey = () => {
        console.log('hasDevKey')
        this._devKeyState$.next('OK')
    }

    private _onNoHasDevKey = () => {
        console.log('noHasDevKey')
        // this._socketState$.next('DISCONNECTED')
        this._devKeyState$.next('NO_DEV_KEY')
    }

    private _onReceiveData = (msg: any) => {
        console.log('kit receiveData', msg)
        if (msg['Type'] === 'ktaimk_button_push') {
            this._buttonPush$.next(Date.now())
            return
        }

        const gpioData = asGpioPinData(msg)
        if (gpioData) {
            const data = { ...this._gpioPinValue$ }
            data[gpioData.pin] = gpioData.value
            this._gpioPinValue$.next(data)
            return
        }

        if (msg['Type'] === 'ktaimk_gpio_data') {
            this._buttonPush$.next(Date.now())
        } else {
            this._data$.next(msg)
        }
    }

    private _onResponseDeviceCtlMsgV2 = (msg: any) => {
        console.log('_onResponseDeviceCtlMsgV2', msg)
        const valid = typeof msg['requestId'] === 'string' && typeof msg['success'] === 'boolean'
        if (valid) {
            this._deviceCtlResponseV2$.next(msg as DeviceCtlResponse)
        } else {
            console.warn('unknown DeviceCtlResponse', msg)
        }
    }

    private _onError = (msg: any) => {
        console.log('_onError', msg)
    }

    get isConnected(): boolean {
        return this.sock?.connected === true
    }

    connect = () => {
        this._open()
    }

    disconnect = () => {
        this._close()
    }

    private _initListener = () => {
        const src$ = this._socketState$
        this._subscription = src$.pipe(filter((it) => it != null)).subscribe((state) => {
            if (state) {
                this._notifyState(state)
            }
        })
    }

    private _open = () => {
        if (this.sock !== null) {
            return
        }
        this._devKeyState$.next('FIRST')
        this._socketState$.next('FIRST')
        this._initListener()
        this.sock = io(this.websocketUrl, {
            autoConnect: true,
            path: '/socket.io',
        })
        const s = this.sock
        s.on('connect', this._onConnect)
        s.on('disconnect', this._onDisconnect)
        s.on('hasDevKey', this._onHasDevKey)
        s.on('noHasDevKey', this._onNoHasDevKey)
        s.on('receiveData', this._onReceiveData)
        s.on(DEVICE_CTL_RESPONSE_V2, this._onResponseDeviceCtlMsgV2)
        s.on('error', this._onError)
    }

    private _close = () => {
        console.log('kit socket closed')
        if (this.sock !== null) {
            this.sock.disconnect()
            this.sock = null
        }
        this._subscription?.unsubscribe()
        this._subscription = null
    }
}
