use soroban_sdk::{contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    FeeBps,
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

pub fn write_fee_bps(env: &Env, fee_bps: i128) {
    env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
}

pub fn read_fee_bps(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::FeeBps).expect("fee not set")
}
