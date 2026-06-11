use soroban_sdk::{contracttype, Address, Env};

use crate::interest::RateParams;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolConfig {
    pub admin: Address,
    pub asset: Address,
    pub rate_params: RateParams,
    pub reserve_factor: i128,
    pub ltv_ratio: i128,
    pub liquidation_threshold: i128,
    pub liquidation_penalty: i128,
    pub decimals: u32,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolState {
    pub total_supply: i128,
    pub total_borrow: i128,
    pub total_reserves: i128,
    pub supply_index: i128,
    pub borrow_index: i128,
    pub last_update_timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserSupply {
    pub shares: i128,
    pub principal: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserBorrow {
    pub principal: i128,
    pub interest_index: i128,
    pub accrued_interest: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    PoolConfig,
    PoolState,
    UserSupply(Address),
    UserBorrow(Address),
    STokenContract,
    CollateralManagerContract,
}

pub fn has_pool_config(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::PoolConfig)
}

pub fn write_pool_config(env: &Env, config: &PoolConfig) {
    env.storage().instance().set(&DataKey::PoolConfig, config);
}

pub fn read_pool_config(env: &Env) -> PoolConfig {
    env.storage()
        .instance()
        .get(&DataKey::PoolConfig)
        .expect("pool not initialized")
}

pub fn write_pool_state(env: &Env, state: &PoolState) {
    env.storage().instance().set(&DataKey::PoolState, state);
}

pub fn read_pool_state(env: &Env) -> PoolState {
    env.storage()
        .instance()
        .get(&DataKey::PoolState)
        .expect("pool state not found")
}

pub fn write_user_supply(env: &Env, user: &Address, supply: &UserSupply) {
    env.storage()
        .instance()
        .set(&DataKey::UserSupply(user.clone()), supply);
}

pub fn read_user_supply(env: &Env, user: &Address) -> Option<UserSupply> {
    env.storage()
        .instance()
        .get(&DataKey::UserSupply(user.clone()))
}

pub fn write_user_borrow(env: &Env, user: &Address, borrow: &UserBorrow) {
    env.storage()
        .instance()
        .set(&DataKey::UserBorrow(user.clone()), borrow);
}

pub fn read_user_borrow(env: &Env, user: &Address) -> Option<UserBorrow> {
    env.storage()
        .instance()
        .get(&DataKey::UserBorrow(user.clone()))
}

pub fn write_stoken_contract(env: &Env, contract: &Address) {
    env.storage()
        .instance()
        .set(&DataKey::STokenContract, contract);
}

pub fn read_stoken_contract(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::STokenContract)
        .expect("sToken contract not set")
}

pub fn has_stoken_contract(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::STokenContract)
}

pub fn write_collateral_manager(env: &Env, contract: &Address) {
    env.storage()
        .instance()
        .set(&DataKey::CollateralManagerContract, contract);
}

pub fn read_collateral_manager(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::CollateralManagerContract)
        .expect("collateral manager not set")
}

pub fn has_collateral_manager(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::CollateralManagerContract)
}
