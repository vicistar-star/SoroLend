use soroban_sdk::{contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Asset,
    Balance(Address),
    TotalShares,
}

pub fn write_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn read_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).expect("admin not set")
}

pub fn write_asset(env: &Env, asset: &Address) {
    env.storage().instance().set(&DataKey::Asset, asset);
}

pub fn read_asset(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Asset).expect("asset not set")
}

pub fn write_balance(env: &Env, addr: Address, amount: i128) {
    env.storage().instance().set(&DataKey::Balance(addr), &amount);
}

pub fn read_balance(env: &Env, addr: Address) -> i128 {
    env.storage().instance().get(&DataKey::Balance(addr)).unwrap_or(0)
}

pub fn write_total_shares(env: &Env, amount: i128) {
    env.storage().instance().set(&DataKey::TotalShares, &amount);
}

pub fn read_total_shares(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0)
}
