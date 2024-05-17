import Long from 'long';

import {
    initialize,
    writeConfig,
    subscribeState,
    decodeState,
    checkStatus,
    startLnd,
    stopLnd,
    checkICloudEnabled,
    checkApplicationSupportExists,
    checkLndFolderExists,
    createIOSApplicationSupportAndLndDirectories,
    gossipSync,
    cancelGossipSync,
    TEMP_moveLndToApplicationSupport,
    excludeLndICloudBackup,
    queryRoutes,
    addInvoice,
    cancelInvoice,
    connectPeer,
    disconnectPeer,
    decodePayReq,
    getRecoveryInfo,
    listUnspent,
    resetMissionControl,
    getNodeInfo,
    getNetworkInfo,
    getInfo,
    lookupInvoice,
    listPeers,
    readLndLog,
    sendPaymentSync,
    sendPaymentV2Sync,
    IReadLndLogResponse,
    listPayments,
    listInvoices,
    subscribeChannelGraph,
    sendKeysendPaymentV2,
    fundingStateStep,
    sendCustomMessage,
    subscribeCustomMessages,
    decodeCustomMessage
} from './index';
import {
    channelBalance,
    closeChannel,
    listChannels,
    openChannel,
    openChannelSync,
    openChannelAll,
    pendingChannels,
    subscribeChannelEvents,
    channelAcceptor,
    channelAcceptorResponse,
    decodeChannelAcceptRequest,
    decodeChannelEvent,
    decodeOpenStatusUpdate,
    exportAllChannelBackups,
    restoreChannelBackups,
    abandonChannel,
    getChanInfo,
    closedChannels
} from './channel';
import {
    getTransactions,
    newAddress,
    sendCoins,
    sendCoinsAll,
    walletBalance,
    subscribeTransactions
} from './onchain';
import {
    decodeInvoiceResult,
    genSeed,
    initWallet,
    subscribeInvoices,
    unlockWallet,
    deriveKey,
    derivePrivateKey,
    verifyMessageNodePubkey,
    signMessage,
    signMessageNodePubkey,
    bumpFee,
    fundPsbt,
    signPsbt,
    finalizePsbt,
    publishTransaction,
    listAccounts,
    importAccount
} from './wallet';
import { status, modifyStatus, queryScores, setScores } from './autopilot';
import { checkScheduledSyncWorkStatus } from './scheduled-sync'; // TODO(hsjoberg): This could be its own injection "LndMobileScheduledSync"
import {
    lnrpc,
    signrpc,
    invoicesrpc,
    autopilotrpc,
    routerrpc,
    walletrpc
} from '../proto/lightning';
import type { WorkInfo } from './LndMobile.d.ts';

export interface ILndMobileInjections {
    index: {
        initialize: () => Promise<{ data: string } | number>;
        writeConfig: (config: string) => Promise<string>;
        subscribeState: () => Promise<string>;
        decodeState: (data: string) => lnrpc.SubscribeStateResponse;
        checkStatus: () => Promise<number>;
        startLnd: (
            args: string,
            isTorEnabled?: boolean,
            isTestnet?: boolean
        ) => Promise<string>;
        stopLnd: () => Promise<string>;
        gossipSync: (
            serviceUrl: string,
            networkType: string
        ) => Promise<{ data: string }>;
        cancelGossipSync: () => void;
        checkICloudEnabled: () => Promise<boolean>;
        checkApplicationSupportExists: () => Promise<boolean>;
        checkLndFolderExists: () => Promise<boolean>;
        createIOSApplicationSupportAndLndDirectories: () => Promise<boolean>;
        TEMP_moveLndToApplicationSupport: () => Promise<boolean>;
        excludeLndICloudBackup: () => Promise<boolean>;

        addInvoice: ({
            amount,
            amount_msat,
            memo,
            expiry,
            is_amp,
            is_private,
            preimage,
            route_hints
        }: {
            amount?: number;
            amount_msat?: number;
            memo: string;
            expiry?: number;
            is_amp?: boolean;
            is_private?: boolean;
            preimage?: string;
            route_hints?: lnrpc.IRouteHint[] | null;
        }) => Promise<lnrpc.AddInvoiceResponse>;
        cancelInvoice: (
            paymentHash: string
        ) => Promise<invoicesrpc.CancelInvoiceResp>;
        connectPeer: (
            pubkey: string,
            host: string,
            perm?: boolean
        ) => Promise<lnrpc.ConnectPeerResponse>;
        disconnectPeer: (
            pubkey: string
        ) => Promise<lnrpc.DisconnectPeerResponse>;
        decodePayReq: (bolt11: string) => Promise<lnrpc.PayReq>;
        getRecoveryInfo: () => Promise<lnrpc.GetRecoveryInfoResponse>;
        listUnspent: ({
            account
        }: {
            account?: string;
        }) => Promise<lnrpc.ListUnspentResponse>;
        resetMissionControl: () => Promise<routerrpc.ResetMissionControlResponse>;
        getInfo: () => Promise<lnrpc.GetInfoResponse>;
        getNetworkInfo: () => Promise<lnrpc.NetworkInfo>;
        getNodeInfo: (pubKey: string) => Promise<lnrpc.NodeInfo>;
        lookupInvoice: (rHash: string) => Promise<lnrpc.Invoice>;
        listPeers: () => Promise<lnrpc.ListPeersResponse>;
        listInvoices: () => Promise<lnrpc.ListInvoiceResponse>;
        readLndLog: () => Promise<IReadLndLogResponse>;
        sendPaymentSync: (
            paymentRequest: string,
            amount?: Long,
            tlvRecordName?: string | null
        ) => Promise<lnrpc.SendResponse>;
        sendPaymentV2Sync: ({
            payment_request,
            amt,
            max_shard_size_msat,
            max_parts = 1,
            fee_limit_sat,
            last_hop_pubkey,
            message,
            cltv_limit,
            outgoing_chan_id,
            allow_self_payment,
            multi_path,
            route_hints,
            dest_custom_records,
            payment_hash,
            amp,
            dest
        }: {
            payment_request?: string;
            amt?: Long;
            max_shard_size_msat?: string;
            max_parts?: number;
            fee_limit_sat?: number;
            last_hop_pubkey?: string;
            message?: string;
            cltv_limit?: any;
            outgoing_chan_id?: string;
            allow_self_payment?: boolean;
            multi_path?: boolean;
            route_hints?: lnrpc.IRouteHint[];
            dest_custom_records?: any;
            payment_hash: string;
            amp: boolean;
            dest: string;
        }) => Promise<lnrpc.Payment>;
        queryRoutes: (
            pubkey: string,
            amount?: Long,
            routeHints?: lnrpc.IRouteHint[]
        ) => Promise<lnrpc.QueryRoutesResponse>;
        listPayments: () => Promise<lnrpc.ListPaymentsResponse>;
        subscribeChannelGraph: () => Promise<string>;
        sendKeysendPaymentV2: ({
            amt,
            max_shard_size_msat,
            max_parts = 1,
            fee_limit_sat,
            message,
            cltv_limit,
            payment_hash,
            amp,
            dest,
            dest_custom_records
        }: {
            amt?: Long;
            max_shard_size_msat?: string;
            max_parts?: number;
            fee_limit_sat?: number;
            message?: string;
            cltv_limit?: any;
            payment_hash: string;
            amp: boolean;
            dest: string;
            dest_custom_records?: any;
        }) => Promise<lnrpc.Payment>;
        fundingStateStep: ({
            shim_register,
            shim_cancel,
            psbt_verify,
            psbt_finalize
        }: any) => Promise<lnrpc.FundingStateStepResp>;
        sendCustomMessage: (
            peer: Uint8Array | null,
            type: number | null,
            data: Uint8Array | null
        ) => Promise<lnrpc.SendCustomMessageResponse>;
        subscribeCustomMessages: () => Promise<lnrpc.CustomMessage>;
        decodeCustomMessage: (data: string) => lnrpc.CustomMessage;
    };
    channel: {
        channelBalance: () => Promise<lnrpc.ChannelBalanceResponse>;
        channelAcceptor: () => Promise<string>;
        decodeChannelAcceptRequest: (data: any) => lnrpc.ChannelAcceptRequest;
        channelAcceptorResponse: (
            pending_chan_id: Uint8Array,
            accept: boolean,
            zero_conf?: boolean
        ) => Promise<void>;
        closeChannel: (
            fundingTxId: string,
            outputIndex: number,
            force?: boolean,
            sat_per_vbyte?: number,
            delivery_address?: string
        ) => Promise<string>;
        listChannels: () => Promise<lnrpc.ListChannelsResponse>;
        openChannel: (
            pubkey: string,
            amount: number,
            privateChannel: boolean,
            feeRateSat?: number,
            scidAlias?: boolean,
            min_confs?: number,
            spend_unconfirmed?: boolean,
            simpleTaprootChannel?: boolean,
            fund_max?: boolean,
            utxos?: Array<string>,
            funding_shim?: any
        ) => Promise<string>;
        openChannelSync: (
            pubkey: string,
            amount: number,
            privateChannel: boolean,
            feeRateSat?: number,
            scidAlias?: boolean,
            min_confs?: number,
            spend_unconfirmed?: boolean,
            simpleTaprootChannel?: boolean,
            fund_max?: boolean,
            utxos?: Array<string>
        ) => Promise<lnrpc.ChannelPoint>;
        openChannelAll: (
            pubkey: string,
            privateChannel: boolean,
            feeRateSat?: number
        ) => Promise<lnrpc.ChannelPoint>;
        pendingChannels: () => Promise<lnrpc.PendingChannelsResponse>;
        closedChannels: () => Promise<lnrpc.ClosedChannelsResponse>;
        getChanInfo: (chanId: string) => Promise<lnrpc.ChannelEdge>;
        subscribeChannelEvents: () => Promise<string>;
        decodeChannelEvent: (data: string) => lnrpc.ChannelEventUpdate;
        decodeOpenStatusUpdate: (data: string) => lnrpc.OpenStatusUpdate;
        exportAllChannelBackups: () => Promise<lnrpc.ChanBackupSnapshot>;
        restoreChannelBackups: (
            data: Uint8Array
        ) => Promise<lnrpc.RestoreBackupResponse>;
        abandonChannel: (
            fundingTxId: string,
            outputIndex: number
        ) => Promise<lnrpc.AbandonChannelResponse>;
    };
    onchain: {
        getTransactions: () => Promise<lnrpc.TransactionDetails>;
        newAddress: (
            type: lnrpc.AddressType,
            account?: string
        ) => Promise<lnrpc.NewAddressResponse>;
        sendCoins: (
            address: string,
            sat: number,
            feeRate?: number,
            spend_unconfirmed?: boolean,
            send_all?: boolean
        ) => Promise<lnrpc.SendCoinsResponse>;
        sendCoinsAll: (
            address: string,
            feeRate?: number
        ) => Promise<lnrpc.SendCoinsResponse>;
        walletBalance: ({
            account
        }: {
            account?: string;
        }) => Promise<lnrpc.WalletBalanceResponse>;
        subscribeTransactions: () => Promise<string>;
    };
    wallet: {
        decodeInvoiceResult: (data: string) => lnrpc.Invoice;
        genSeed: (
            passphrase: string | undefined
        ) => Promise<lnrpc.GenSeedResponse>;
        initWallet: (
            seed: string[],
            password: string,
            recoveryWindow?: number,
            channelBackupsBase64?: string,
            aezeedPassphrase?: string
        ) => Promise<void>;
        subscribeInvoices: () => Promise<string>;
        unlockWallet: (password: string) => Promise<void>;
        deriveKey: (
            keyFamily: number,
            keyIndex: number
        ) => Promise<signrpc.KeyDescriptor>;
        derivePrivateKey: (
            keyFamily: number,
            keyIndex: number
        ) => Promise<signrpc.KeyDescriptor>;
        verifyMessageNodePubkey: (
            signature: string,
            msg: Uint8Array
        ) => Promise<lnrpc.VerifyMessageResponse>;
        signMessage: (
            keyFamily: number,
            keyIndex: number,
            msg: Uint8Array
        ) => Promise<signrpc.SignMessageResp>;
        signMessageNodePubkey: (
            msg: Uint8Array
        ) => Promise<lnrpc.SignMessageResponse>;
        bumpFee: ({
            outpoint,
            target_conf,
            force,
            sat_per_vbyte
        }: {
            outpoint: lnrpc.OutPoint;
            target_conf?: number;
            force?: boolean;
            sat_per_vbyte?: Long;
        }) => Promise<walletrpc.BumpFeeResponse>;
        fundPsbt: ({
            account,
            psbt,
            raw,
            spend_unconfirmed,
            sat_per_vbyte
        }: {
            account?: string;
            psbt?: Uint8Array;
            raw: walletrpc.TxTemplate;
            spend_unconfirmed?: boolean;
            sat_per_vbyte?: Long;
        }) => Promise<walletrpc.FundPsbtResponse>;
        signPsbt: ({
            funded_psbt
        }: {
            funded_psbt?: Uint8Array;
        }) => Promise<walletrpc.SignPsbtResponse>;
        finalizePsbt: ({
            funded_psbt
        }: {
            funded_psbt: Uint8Array;
        }) => Promise<walletrpc.FinalizePsbtResponse>;
        publishTransaction: ({
            tx_hex
        }: {
            tx_hex: Uint8Array;
        }) => Promise<walletrpc.PublishResponse>;
        listAccounts: () => Promise<walletrpc.ListAccountsResponse>;
        importAccount: ({
            name,
            extended_public_key,
            master_key_fingerprint,
            address_type,
            dry_run
        }: {
            name: string;
            extended_public_key: string;
            master_key_fingerprint?: Uint8Array;
            address_type?: number;
            dry_run: boolean;
        }) => Promise<walletrpc.ImportAccountResponse>;
    };
    autopilot: {
        status: () => Promise<autopilotrpc.StatusResponse>;
        modifyStatus: (
            enable: boolean
        ) => Promise<autopilotrpc.ModifyStatusResponse>;
        queryScores: () => Promise<autopilotrpc.QueryScoresResponse>;
        setScores: (scores: any) => Promise<autopilotrpc.SetScoresResponse>;
    };
    scheduledSync: {
        checkScheduledSyncWorkStatus: () => Promise<WorkInfo>;
    };
}

export default {
    index: {
        initialize,
        writeConfig,
        checkStatus,
        subscribeState,
        decodeState,
        startLnd,
        stopLnd,
        gossipSync,
        cancelGossipSync,
        checkICloudEnabled,
        checkApplicationSupportExists,
        checkLndFolderExists,
        createIOSApplicationSupportAndLndDirectories,
        TEMP_moveLndToApplicationSupport,
        excludeLndICloudBackup,

        addInvoice,
        cancelInvoice,
        connectPeer,
        disconnectPeer,
        decodePayReq,
        getRecoveryInfo,
        listUnspent,
        resetMissionControl,
        getNodeInfo,
        getNetworkInfo,
        getInfo,
        lookupInvoice,
        listPeers,
        readLndLog,
        sendPaymentSync,
        sendPaymentV2Sync,
        queryRoutes,
        listPayments,
        listInvoices,
        subscribeChannelGraph,
        sendKeysendPaymentV2,
        fundingStateStep,
        sendCustomMessage,
        subscribeCustomMessages,
        decodeCustomMessage
    },
    channel: {
        channelBalance,
        closeChannel,
        listChannels,
        openChannel,
        openChannelSync,
        openChannelAll,
        pendingChannels,
        subscribeChannelEvents,
        decodeChannelEvent,
        decodeOpenStatusUpdate,
        exportAllChannelBackups,
        restoreChannelBackups,
        abandonChannel,
        channelAcceptor,
        decodeChannelAcceptRequest,
        channelAcceptorResponse,
        getChanInfo,
        closedChannels
    },
    onchain: {
        getTransactions,
        newAddress,
        sendCoins,
        sendCoinsAll,
        walletBalance,
        subscribeTransactions
    },
    wallet: {
        decodeInvoiceResult,
        genSeed,
        initWallet,
        subscribeInvoices,
        unlockWallet,
        deriveKey,
        derivePrivateKey,
        verifyMessageNodePubkey,
        signMessage,
        signMessageNodePubkey,
        bumpFee,
        fundPsbt,
        signPsbt,
        finalizePsbt,
        publishTransaction,
        listAccounts,
        importAccount
    },
    autopilot: {
        status,
        modifyStatus,
        queryScores,
        setScores
    },
    scheduledSync: {
        checkScheduledSyncWorkStatus
    }
} as ILndMobileInjections;
