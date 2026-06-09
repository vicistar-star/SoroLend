#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

mod storage;
mod math;

use crate::storage::*;
use crate::math::{mul_div};

#[contract]
pub struct SToken;

#[contractimpl]
impl SToken {
    pub fn initialize(env: Env, admin: Address, asset: Address) {
        if env.storage().instance().has(&crate::storage::DataKey::Admin) {
            panic!("already initialized");
        }
        write_admin(&env, &admin);
        write_asset(&env, &asset);
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin = read_admin(&env);
        admin.require_auth();

        let total_shares = read_total_shares(&env);
        let balance = read_balance(&env, to.clone());
        
        write_balance(&env, to, balance + amount);
        write_total_shares(&env, total_shares + amount);
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        let admin = read_admin(&env);
        admin.require_auth();

        let total_shares = read_total_shares(&env);
        let balance = read_balance(&env, from.clone());
        
        if balance < amount {
            panic!("insufficient balance");
        }
        
        write_balance(&env, from, balance - amount);
        write_total_shares(&env, total_shares - amount);
    }

    pub fn balance_of(env: Env, addr: Address) -> i128 {
        read_balance(&env, addr)
    }

    pub fn total_shares(env: Env) -> i128 {
        read_total_shares(&env)
    }

    pub fn convert_to_shares(env: Env, assets: i128, total_assets: i128) -> i128 {
        let total_shares = read_total_shares(&env);
        if total_shares == 0 || total_assets == 0 {
            return assets;
        }
        mul_div(assets, total_shares, total_assets)
    }

    pub fn convert_to_assets(env: Env, shares: i128, total_assets: i128) -> i128 {
        let total_shares = read_total_shares(&env);
        if total_shares == 0 {
            return shares;
        }
        mul_div(shares, total_assets, total_shares)
    }
}
