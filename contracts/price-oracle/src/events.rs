use soroban_sdk::{Address, Env, Symbol};

pub fn emit_price_update(env: &Env, keeper: &Address, asset: &Address, old_price: i128, new_price: i128) {
    env.events().publish(
        (Symbol::new(env, "price_update"), keeper.clone(), asset.clone()),
        (old_price, new_price),
    );
}

pub fn emit_keeper_set(env: &Env, admin: &Address, keeper: &Address, is_keeper: bool) {
    env.events().publish(
        (Symbol::new(env, "keeper_set"), admin.clone()),
        (keeper.clone(), is_keeper),
    );
}
