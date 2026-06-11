use soroban_sdk::{Address, Env, Symbol};

pub fn emit_collateral_deposit(env: &Env, user: &Address, asset: &Address, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "collateral_deposit"), user.clone(), asset.clone()),
        (amount,),
    );
}

pub fn emit_collateral_withdraw(env: &Env, user: &Address, asset: &Address, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "collateral_withdraw"), user.clone(), asset.clone()),
        (amount,),
    );
}

pub fn emit_collateral_seized(env: &Env, caller: &Address, borrower: &Address, asset: &Address, amount: i128) {
    env.events().publish(
        (Symbol::new(env, "collateral_seized"), caller.clone(), borrower.clone()),
        (asset.clone(), amount),
    );
}
