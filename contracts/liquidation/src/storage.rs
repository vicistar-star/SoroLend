use soroban_sdk::{contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    ProtocolTreasury,
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

pub fn write_protocol_treasury(env: &Env, treasury: &Address) {
    env.storage().instance().set(&DataKey::ProtocolTreasury, treasury);
}

pub fn read_protocol_treasury(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::ProtocolTreasury).expect("treasury not set")
}
