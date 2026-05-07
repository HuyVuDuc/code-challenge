interface WalletBalance {
    currency: string;
    amount: number;
    blockchain: string;
}

interface FormattedWalletBalance extends WalletBalance {
    formatted: string;
    priority: number;
}

interface Props extends BoxProps {}

const PRIORITY_BY_BLOCKCHAIN: Record<string, number> = {
    Osmosis: 100,
    Ethereum: 50,
    Arbitrum: 30,
    Zilliqa: 20,
    Neo: 20,
};

const getPriority = (blockchain: string): number => {
    return PRIORITY_BY_BLOCKCHAIN[blockchain] ?? -99;
};

const WalletPage: React.FC<Props> = (props) => {
    const { children, ...rest } = props;

    const balances = useWalletBalances();
    const prices = usePrices();

    const formattedBalances = useMemo<FormattedWalletBalance[]>(() => {
        return balances
            .map((balance) => ({
                ...balance,
                priority: getPriority(balance.blockchain),
                formatted: balance.amount.toFixed(),
            }))
            .filter((balance) => balance.priority > -99 && balance.amount > 0)
            .sort((lhs, rhs) => rhs.priority - lhs.priority);
    }, [balances]);

    const rows = useMemo(() => {
        return formattedBalances.map((balance) => {
            const usdValue = (prices[balance.currency] ?? 0) * balance.amount;

            return (
                <WalletRow
                    key={`${balance.blockchain}-${balance.currency}`}
            className={classes.row}
            amount={balance.amount}
            usdValue={usdValue}
            formattedAmount={balance.formatted}
            />
        );
        });
    }, [formattedBalances, prices]);

    return (
        <Box {...rest}>
        {rows}
    {children}
    </Box>
);
};