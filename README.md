# Plus1 Rewards Platform

A comprehensive cashback rewards system that helps members earn medical cover through shopping at partner stores.

## What is Plus1 Rewards?

Plus1 Rewards is a dual-platform ecosystem:

- **Plus1 Rewards**: Members shop at partner stores, earn cashback that funds their medical cover plans
- **Plus1-Go**: Delivery service layer where members can order from partners and earn cashback on purchases

## How It Works

Members register and get assigned a default cover plan (R390 target). When they shop at partner stores, cashback is earned and allocated to their cover plan. Once the plan reaches its target amount, it becomes active for 30 days. Extra cashback becomes overflow balance, which can be used to upgrade to higher plans (R500, R750) or sponsor dependants.

## Key Roles

- **Members**: Shop and earn cashback toward cover plans
- **Partners**: Shops offering cashback (3-40%)
- **Agents**: Recruit partners and earn commission
- **Insurers**: Medical cover providers
- **Drivers**: Deliver Plus1-Go orders
- **Admin**: System control center

## Cashback Split

When a partner offers cashback:
- 1% → System
- 1% → Agent
- Remainder → Member's cover plan

## Using Supabase MCP Power to Check Database

To inspect or query the database, use the Supabase MCP power:

```
kiroPowers action="activate" powerName="supabase-hosted"
```

Then use tools like:
- `execute_sql` - Run SQL queries
- `list_tables` - See all tables and schema
- `get_project` - Check project details

This helps refresh memory on current database state without needing to manually check files.

## Key Features

- Member dashboard with cover plan progress tracking
- Admin control center for platform management
- Chat system for member support and top-up requests
- Partner invoice and commission tracking
- Dispute resolution system
- QR code generation for in-store transactions

## Current Status

- Members table cleared (starting fresh)
- 1 Insurer in system
- Admin dashboard operational
- Chat and top-up systems ready
