use soroban_sdk::{contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Keeper(Address),
    Price(Address),
    LastUpdate(Address),
    CumulativePrice(Address),
    CumulativeTime(Address),
    DeviationThreshold,
    MinInterval,
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

pub fn set_keeper(env: &Env, keeper: &Address, is_keeper: bool) {
    env.storage().instance().set(&DataKey::Keeper(keeper.clone()), &is_keeper);
}

pub fn is_keeper(env: &Env, addr: &Address) -> bool {
    env.storage().instance().get(&DataKey::Keeper(addr.clone())).unwrap_or(false)
}

pub fn write_price(env: &Env, asset: &Address, price: i128) {
    env.storage().instance().set(&DataKey::Price(asset.clone()), &price);
}

pub fn read_price(env: &Env, asset: &Address) -> i128 {
    env.storage().instance().get(&DataKey::Price(asset.clone())).unwrap_or(0)
}

pub fn write_last_update(env: &Env, asset: &Address, timestamp: u64) {
    env.storage().instance().set(&DataKey::LastUpdate(asset.clone()), &timestamp);
}

pub fn read_last_update(env: &Env, asset: &Address) -> u64 {
    env.storage().instance().get(&DataKey::LastUpdate(asset.clone())).unwrap_or(0)
}

pub fn write_cumulative_price(env: &Env, asset: &Address, cumulative: i128) {
    env.storage().instance().set(&DataKey::CumulativePrice(asset.clone()), &cumulative);
}

pub fn read_cumulative_price(env: &Env, asset: &Address) -> i128 {
    env.storage().instance().get(&DataKey::CumulativePrice(asset.clone())).unwrap_or(0)
}

pub fn write_cumulative_time(env: &Env, asset: &Address, cumulative: u64) {
    env.storage().instance().set(&DataKey::CumulativeTime(asset.clone()), &cumulative);
}

pub fn read_cumulative_time(env: &Env, asset: &Address) -> u64 {
    env.storage().instance().get(&DataKey::CumulativeTime(asset.clone())).unwrap_or(0)
}

pub fn write_deviation_threshold(env: &Env, threshold: i128) {
    env.storage().instance().set(&DataKey::DeviationThreshold, &threshold);
}

pub fn read_deviation_threshold(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::DeviationThreshold).expect("deviation threshold not set")
}

pub fn write_min_interval(env: &Env, interval: u64) {
    env.storage().instance().set(&DataKey::MinInterval, &interval);
}

pub fn read_min_interval(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::MinInterval).unwrap_or(0)
}
