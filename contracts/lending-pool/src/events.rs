use soroban_sdk::{Address, Env, Symbol};

pub fn emit_supply(env: &Env, caller: &Address, asset: &Address, amount: i128, shares: i128) {
    env.events().publish(
        (Symbol::new(env, "supply"), caller.clone(), asset.clone()),
        (amount, shares),
    );
}

pub fn emit_withdraw(env: &Env, caller: &Address, asset: &Address, amount: i128, shares: i128) {
    env.events().publish(
        (Symbol::new(env, "withdraw"), caller.clone(), asset.clone()),
        (amount, shares),
    );
}

pub fn emit_borrow(env: &Env, caller: &Address, asset: &Address, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "borrow"), caller.clone(), asset.clone()),
        (amount,),
    );
}

pub fn emit_repay(env: &Env, caller: &Address, asset: &Address, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "repay"), caller.clone(), asset.clone()),
        (amount,),
    );
}

pub fn emit_liquidation(
    env: &Env,
    borrower: &Address,
    liquidator: &Address,
    debt_asset: &Address,
    collateral_asset: &Address,
    debt_covered: i128,
    collateral_seized: i128,
) {
    env.events().publish(
        (
            Symbol::new(env, "liquidation"),
            borrower.clone(),
            liquidator.clone(),
        ),
        (
            debt_asset.clone(),
            collateral_asset.clone(),
            debt_covered,
            collateral_seized,
        ),
    );
}

pub fn emit_interest_accrued(
    env: &Env,
    asset: &Address,
    borrow_rate: i128,
    supply_rate: i128,
    total_borrow: i128,
    total_supply: i128,
) {
    env.events().publish(
        (Symbol::new(env, "interest_accrued"), asset.clone()),
        (borrow_rate, supply_rate, total_borrow, total_supply),
    );
}
