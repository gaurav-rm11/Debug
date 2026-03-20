-- Execute this file in the Supabase SQL Editor to initialize your "Debug" platform database.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS Table
create table if not exists users (
    wallet_address text primary key,
    role text not null check (role in ('researcher', 'organization')),
    total_earned numeric default 0,
    reputation_score integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: We add Name and Email columns to support the newly built Onboarding module.
alter table users add column if not exists name text;
alter table users add column if not exists email text;

-- BOUNTIES Table
create table if not exists bounties (
    id uuid default uuid_generate_v4() primary key,
    org_address text not null,
    company_name text,
    title text not null,
    description text not null,
    escrow_amount numeric not null,
    contract_address text not null,
    is_active boolean default true,
    
    -- Reward Matrix
    reward_type text default 'Fixed',
    min_reward numeric default 0,
    max_reward numeric default 0,
    reward_critical numeric default 0,
    reward_high numeric default 0,
    reward_medium numeric default 0,
    reward_low numeric default 0,
    
    -- Scope & Assets
    domains text[] default '{}',
    in_scope text,
    out_of_scope text,
    allowed_vulns text[] default '{}',
    
    -- Policies & Guidelines
    rules text,
    policy text,
    safe_harbor text,
    guidelines text,
    timeline text,

    visibility text default 'public' check (visibility in ('public', 'private')),
    invited_users text[] default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MIGRATION: Run these if your table already exists and you get "column not found" errors:
-- alter table bounties add column if not exists company_name text;
-- alter table bounties add column if not exists reward_type text default 'Fixed';
-- alter table bounties add column if not exists min_reward numeric default 0;
-- alter table bounties add column if not exists max_reward numeric default 0;
-- alter table bounties add column if not exists reward_critical numeric default 0;
-- alter table bounties add column if not exists reward_high numeric default 0;
-- alter table bounties add column if not exists reward_medium numeric default 0;
-- alter table bounties add column if not exists reward_low numeric default 0;
-- alter table bounties add column if not exists domains text[] default '{}';
-- alter table bounties add column if not exists in_scope text;
-- alter table bounties add column if not exists out_of_scope text;
-- alter table bounties add column if not exists allowed_vulns text[] default '{}';
-- alter table bounties add column if not exists rules text;
-- alter table bounties add column if not exists policy text;
-- alter table bounties add column if not exists safe_harbor text;
-- alter table bounties add column if not exists guidelines text;
-- alter table bounties add column if not exists timeline text;
-- alter table bounties add column if not exists visibility text default 'public';
-- alter table bounties add column if not exists invited_users text[] default '{}';

-- VULNERABILITY REPORTS Table
create table if not exists reports (
    id uuid default uuid_generate_v4() primary key,
    bounty_id uuid references bounties(id) on delete set null,
    researcher_address text not null,
    org_address text not null,
    report_desc text not null,
    claimed_severity text not null,
    ai_is_valid boolean,
    ai_evaluated_severity text,
    ai_confidence_score numeric,
    ai_feedback text,
    status text default 'submitted' check (status in ('submitted', 'accepted', 'resolved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MIGRATION: Run these if your reports table already exists:
-- alter table reports add column if not exists org_address text;
-- alter table reports add column if not exists status text default 'submitted';
-- alter table reports add column if not exists ai_feedback text;

-- MIGRATION: Fix status check constraint if it fails:
-- alter table reports drop constraint if exists reports_status_check;
-- alter table reports add constraint reports_status_check check (status in ('submitted', 'accepted', 'resolved', 'rejected'));

-- NOTIFICATIONS Table
create table if not exists notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id text not null,
    type text not null,
    message text not null,
    bounty_id uuid references bounties(id) on delete cascade,
    report_id uuid references reports(id) on delete cascade,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- We enable RLS and set extremely permissive policies for simplified development of this Prototype.
-- IN PRODUCTION: You must constrain these policies to `auth.uid() == user_id` tied to a Web3Auth provider!

alter table users enable row level security;
alter table bounties enable row level security;
alter table reports enable row level security;

create policy "Public read access for users" on users for select using (true);
create policy "Public insert access for users" on users for insert with check (true);
create policy "Public update access for users" on users for update using (true);

create policy "Public read access for bounties" on bounties for select using (true);
create policy "Public insert access for bounties" on bounties for insert with check (true);
create policy "Public update access for bounties" on bounties for update using (true);

create policy "Public read access for reports" on reports for select using (true);
create policy "Public insert access for reports" on reports for insert with check (true);
create policy "Public update access for reports" on reports for update using (true);

alter table notifications enable row level security;
create policy "Public read access for notifications" on notifications for select using (true);
create policy "Public insert access for notifications" on notifications for insert with check (true);
create policy "Public update access for notifications" on notifications for update using (true);
