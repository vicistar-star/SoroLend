use soroban_sdk::{Address, Env, Symbol};

pub fn emit_liquidation(
    env: &Env,
    liquidator: &Address,
    borrower: &Address,
    debt_asset: &Address,
    collateral_asset: &Address,
    debt_covered: i128,
    collateral_seized: i128,
    liquidation_bonus: i128,
) {
    env.events().publish(
        (
            Symbol::new(env, "liquidation"),
            liquidator.clone(),
            borrower.clone(),
        ),
        (
            debt_asset.clone(),
            collateral_asset.clone(),
            debt_covered,
            collateral_seized,
            liquidation_bonus,
        ),
    );
}
