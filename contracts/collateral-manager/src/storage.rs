use soroban_sdk::{contracttype, Address, Env, Map};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Collateral(Address),
    LiquidationThreshold(Address),
    Price(Address),
    Admin,
    OracleAddress,
}

pub fn write_collateral(env: &Env, user: Address, asset: Address, amount: i128) {
    let mut user_collateral = read_collateral(env, user.clone());
    user_collateral.set(asset, amount);
    env.storage().instance().set(&DataKey::Collateral(user), &user_collateral);
}

pub fn read_collateral(env: &Env, user: Address) -> Map<Address, i128> {
    env.storage()
        .instance()
        .get(&DataKey::Collateral(user))
        .unwrap_or_else(|| Map::new(env))
}

pub fn write_liquidation_threshold(env: &Env, asset: Address, threshold: i128) {
    env.storage().instance().set(&DataKey::LiquidationThreshold(asset), &threshold);
}

pub fn read_liquidation_threshold(env: &Env, asset: Address) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::LiquidationThreshold(asset))
        .unwrap_or(0)
}

pub fn write_price(env: &Env, asset: Address, price: i128) {
    env.storage().instance().set(&DataKey::Price(asset), &price);
}

pub fn read_price(env: &Env, asset: Address) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::Price(asset))
        .unwrap_or(0)
}

pub fn write_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn read_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).expect("admin not set")
}

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn write_oracle(env: &Env, oracle: &Address) {
    env.storage().instance().set(&DataKey::OracleAddress, oracle);
}

pub fn read_oracle(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::OracleAddress).expect("oracle not set")
}

pub fn has_oracle(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::OracleAddress)
}
