#![allow(deprecated)]
use soroban_sdk::{Address, Env, Symbol};

pub struct LiquidationParams<'a> {
    pub liquidator: &'a Address,
    pub borrower: &'a Address,
    pub debt_asset: &'a Address,
    pub collateral_asset: &'a Address,
    pub debt_covered: i128,
    pub collateral_seized: i128,
    pub liquidation_bonus: i128,
}

pub fn emit_liquidation(env: &Env, p: &LiquidationParams) {
    env.events().publish(
        (
            Symbol::new(env, "liquidation"),
            p.liquidator.clone(),
            p.borrower.clone(),
        ),
        (
            p.debt_asset.clone(),
            p.collateral_asset.clone(),
            p.debt_covered,
            p.collateral_seized,
            p.liquidation_bonus,
        ),
    );
}
