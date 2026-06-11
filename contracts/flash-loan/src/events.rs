use soroban_sdk::{Address, Env, Symbol};

pub fn emit_flash_loan(
    env: &Env,
    caller: &Address,
    receiver: &Address,
    asset: &Address,
    amount: i128,
    fee: i128,
) {
    env.events().publish(
        (
            Symbol::new(env, "flash_loan"),
            caller.clone(),
            receiver.clone(),
        ),
        (asset.clone(), amount, fee),
    );
}

pub fn emit_fee_updated(env: &Env, admin: &Address, old_fee_bps: i128, new_fee_bps: i128) {
    env.events().publish(
        (Symbol::new(env, "fee_updated"), admin.clone()),
        (old_fee_bps, new_fee_bps),
    );
}
