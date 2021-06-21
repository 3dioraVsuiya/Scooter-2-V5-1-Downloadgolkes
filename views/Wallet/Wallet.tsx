import * as React from 'react';
import { Linking, Text, View } from 'react-native';
import { ButtonGroup } from 'react-native-elements';
import Transactions from './Transactions';
import Payments from './Payments';
import Invoices from './Invoices';
import Channels from './Channels';
import MainPane from './MainPane';
import { inject, observer } from 'mobx-react';
import PrivacyUtils from './../../utils/PrivacyUtils';
import { localeString } from './../../utils/LocaleUtils';

import BalanceStore from './../../stores/BalanceStore';
import ChannelsStore from './../../stores/ChannelsStore';
import FeeStore from './../../stores/FeeStore';
import InvoicesStore from './../../stores/InvoicesStore';
import NodeInfoStore from './../../stores/NodeInfoStore';
import PaymentsStore from './../../stores/PaymentsStore';
import SettingsStore from './../../stores/SettingsStore';
import FiatStore from './../../stores/FiatStore';
import TransactionsStore from './../../stores/TransactionsStore';
import UnitsStore from './../../stores/UnitsStore';
import LayerBalances from './../../components/LayerBalances';

import handleAnything from './../../utils/handleAnything';

interface WalletProps {
    enterSetup: any;
    exitTransaction: any;
    navigation: any;
    BalanceStore: BalanceStore;
    ChannelsStore: ChannelsStore;
    FeeStore: FeeStore;
    InvoicesStore: InvoicesStore;
    NodeInfoStore: NodeInfoStore;
    PaymentsStore: PaymentsStore;
    SettingsStore: SettingsStore;
    TransactionsStore: TransactionsStore;
    UnitsStore: UnitsStore;
    FiatStore: FiatStore;
}

interface WalletState {
    units: String;
    selectedIndex: number;
}

@inject(
    'BalanceStore',
    'ChannelsStore',
    'InvoicesStore',
    'NodeInfoStore',
    'FeeStore',
    'PaymentsStore',
    'SettingsStore',
    'TransactionsStore',
    'UnitsStore',
    'FiatStore'
)
@observer
export default class Wallet extends React.Component<WalletProps, WalletState> {
    state = {
        units: 'sats',
        selectedIndex: 0
    };

    componentDidMount() {
        Linking.getInitialURL()
            .then(url => {
                if (url) {
                    handleAnything(url).then(([route, props]) => {
                        this.props.navigation.navigate(route, props);
                    });
                }
            })
            .catch(err =>
                console.error(localeString('views.Wallet.Wallet.error'), err)
            );
    }

    UNSAFE_componentWillMount = () => {
        this.getSettingsAndRefresh();
    };

    UNSAFE_componentWillReceiveProps = (nextProps: any) => {
        const { navigation } = nextProps;
        const refresh = navigation.getParam('refresh', null);

        if (refresh) {
            this.getSettingsAndRefresh();
        }
    };

    async getSettingsAndRefresh() {
        const {
            SettingsStore,
            NodeInfoStore,
            BalanceStore,
            PaymentsStore,
            InvoicesStore,
            TransactionsStore,
            ChannelsStore
        } = this.props;

        NodeInfoStore.reset();
        BalanceStore.reset();
        PaymentsStore.reset();
        InvoicesStore.reset();
        TransactionsStore.reset();
        ChannelsStore.reset();

        // This awaits on settings, so should await on Tor being bootstrapped before making requests
        await SettingsStore.getSettings().then(() => {
            this.refresh();
        });
    }

    refresh = () => {
        const {
            NodeInfoStore,
            BalanceStore,
            TransactionsStore,
            ChannelsStore,
            InvoicesStore,
            PaymentsStore,
            FeeStore,
            SettingsStore,
            FiatStore
        } = this.props;
        const {
            settings,
            implementation,
            username,
            password,
            login
        } = SettingsStore;
        const { fiat } = settings;

        if (implementation === 'lndhub') {
            login({ login: username, password }).then(() => {
                BalanceStore.getLightningBalance();
                PaymentsStore.getPayments();
                InvoicesStore.getInvoices();
            });
        } else {
            NodeInfoStore.getNodeInfo();
            BalanceStore.getBlockchainBalance();
            BalanceStore.getLightningBalance();
            PaymentsStore.getPayments();
            InvoicesStore.getInvoices();
            TransactionsStore.getTransactions();
            ChannelsStore.getChannels();
            FeeStore.getFees();
        }

        if (implementation === 'lnd') {
            FeeStore.getForwardingHistory();
        }

        if (!!fiat && fiat !== 'Disabled') {
            FiatStore.getFiatRates();
        }
    };

    updateIndex = (selectedIndex: number) => {
        this.setState({ selectedIndex });
    };

    changeUnits = () => {
        const { units } = this.state;
        this.setState({
            units: units == 'sats' ? 'bitcoin' : 'sats'
        });
    };

    render() {
        const {
            ChannelsStore,
            InvoicesStore,
            NodeInfoStore,
            PaymentsStore,
            TransactionsStore,
            UnitsStore,
            BalanceStore,
            SettingsStore,
            navigation
        } = this.props;
        const { selectedIndex } = this.state;

        const { transactions } = TransactionsStore;
        const { payments } = PaymentsStore;
        const { invoices, invoicesCount } = InvoicesStore;
        const { channels } = ChannelsStore;
        const { settings, implementation } = SettingsStore;
        const { theme } = settings;

        const paymentsCount = (payments && payments.length) || 0;
        const paymentsButtonCount = PrivacyUtils.sensitiveValue(
            paymentsCount,
            2,
            true
        );

        const invoicesCountValue = invoicesCount || 0;
        const invoicesButtonCount = PrivacyUtils.sensitiveValue(
            invoicesCountValue,
            2,
            true
        );

        const transactionsCount = (transactions && transactions.length) || 0;
        const transactionsButtonCount = PrivacyUtils.sensitiveValue(
            transactionsCount,
            2,
            true
        );

        const channelsCount = (channels && channels.length) || 0;
        const channelsButtonCount = PrivacyUtils.sensitiveValue(
            channelsCount,
            2,
            true
        );

        const paymentsButton = () => (
            <React.Fragment>
                <Text style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                    {paymentsButtonCount}
                </Text>
                <Text style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                    {localeString('views.Wallet.Wallet.payments')}
                </Text>
            </React.Fragment>
        );

        const invoicesButton = () => (
            <React.Fragment>
                <Text style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                    {invoicesButtonCount}
                </Text>
                <Text style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                    {localeString('views.Wallet.Wallet.invoices')}
                </Text>
            </React.Fragment>
        );

        const transactionsButton = () => (
            <React.Fragment>
                <Text style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                    {transactionsButtonCount}
                </Text>
                <Text style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                    {localeString('views.Wallet.Wallet.onchain')}
                </Text>
            </React.Fragment>
        );

        const channelsButton = () => (
            <React.Fragment>
                <Text style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                    {channelsButtonCount}
                </Text>
                <Text style={{ color: theme === 'dark' ? 'white' : 'black' }}>
                    {localeString('views.Wallet.Wallet.channels')}
                </Text>
            </React.Fragment>
        );

        const buttons = [
            { element: paymentsButton },
            { element: invoicesButton },
            { element: transactionsButton },
            { element: channelsButton }
        ];

        const lndHubButtons = [
            { element: paymentsButton },
            { element: invoicesButton }
        ];

        const selectedButtons =
            implementation === 'lndhub' ? lndHubButtons : buttons;

        return (
            <View style={{ flex: 1 }}>
                <MainPane
                    navigation={navigation}
                    NodeInfoStore={NodeInfoStore}
                    UnitsStore={UnitsStore}
                    BalanceStore={BalanceStore}
                    SettingsStore={SettingsStore}
                />

                <LayerBalances
                    BalanceStore={BalanceStore}
                    UnitsStore={UnitsStore}
                />
            </View>
        );
    }
}
