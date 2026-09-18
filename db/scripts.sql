-- Define manufacturer types
create type manufacturer_role as enum ('aircraft', 'engine', 'both');
-- Define notification classifications
create type notification_type as enum ('Safety Alert', 'Service Bulletin', 'Information Notice');
-- 1. Manufacturers Table
create table manufacturers (
id uuid default gen_random_uuid() primary key,
created_at timestamp with time zone default timezone('utc'::text, now()) not null,
name text not null unique,
website_url text,
maintenance_doc_url text,
role manufacturer_role default 'aircraft'::manufacturer_role not null
);
-- 2. Engine Models Table
create table engine_models (
id uuid default gen_random_uuid() primary key,
created_at timestamp with time zone default timezone('utc'::text, now()) not null,
manufacturer_id uuid references manufacturers(id) on delete cascade not null,
model_name text not null,
horsepower integer,
unique (manufacturer_id, model_name)
);
-- 3. Aircraft Models Table
create table aircraft_models (
id uuid default gen_random_uuid() primary key,
created_at timestamp with time zone default timezone('utc'::text, now()) not null,
manufacturer_id uuid references manufacturers(id) on delete cascade not null,
model_name text not null,
engine_model_id uuid references engine_models(id) on delete set null,
cruise_speed_knots integer,
max_takeoff_weight_lbs integer,
useful_load_lbs integer,
unique (manufacturer_id, model_name)
);

-- 4. Notifications Table (Safety Alerts & Service Bulletins)
create table notifications (
id uuid default gen_random_uuid() primary key,
created_at timestamp with time zone default timezone('utc'::text, now()) not null,
title text not null,
document_number text not null unique, -- e.g., "SB-2026-01"
type notification_type default 'Service Bulletin'::notification_type not null,
issue_date date not null default current_date,
file_url text, -- Link to actual PDF notice
-- Target scoping (Null fields mean the alert doesn't apply to that type)
aircraft_model_id uuid references aircraft_models(id) on delete cascade,
engine_model_id uuid references engine_models(id) on delete cascade,
-- Validation logic rule ensuring a notice belongs to at least something
constraint check_notification_target check (
aircraft_model_id is not null or engine_model_id is not null
)
);
-- Enable Row Level Security (RLS) on all tables
alter table manufacturers enable row level security;
alter table engine_models enable row level security;
alter table aircraft_models enable row level security;
alter table notifications enable row level security;
-- Establish open Public Read Policies for your client applications
create policy "Allow public read on manufacturers" on manufacturers for select using (true);
create policy "Allow public read on engine_models" on engine_models for select using (true);
create policy "Allow public read on aircraft_models" on aircraft_models for select using (true);
create policy "Allow public read on notifications" on notifications for select using (true);

-- Setup Enums for data uniformity
create type compliance_status_type as enum ('Pending', 'Complied', 'Not
Applicable');
create type inspection_type_enum as enum ('100 Hour', 'Annual');
-- 1. Fleet Table (The actual aircraft you own or maintain)
create table fleet_aircraft (
id uuid default gen_random_uuid() primary key,
registration_number text not null unique, -- e.g., N123LS
aircraft_model_id uuid references aircraft_models(id) on delete restrict
not null,
engine_serial_number text,
current_airframe_hours numeric(7,2) not null default 0.00,
current_engine_hours numeric(7,2) not null default 0.00,
owner_user_id uuid, -- Optional link to Supabase auth.users
created_at timestamp with time zone default timezone('utc'::text, now())
not null
);



-- 2. Notification Compliance Tracker
-- Links general manufacturer notifications to specific real-world airplanes
create table notification_compliance (
id uuid default gen_random_uuid() primary key,
fleet_aircraft_id uuid references fleet_aircraft(id) on delete cascade not
null,
notification_id uuid references notifications(id) on delete cascade not
null,
status compliance_status_type not null default 'Pending',
compliance_date date,
complied_at_hours numeric(7,2), -- Airframe hours when mechanic signed off
signature_mechanic_id text, -- ID or license number of sign-off authority
updated_at timestamp with time zone default timezone('utc'::text, now())
not null,
unique (fleet_aircraft_id, notification_id)
);

-- 3. Maintenance Inspections Logger & Tracker
create table inspections (
id uuid default gen_random_uuid() primary key,
fleet_aircraft_id uuid references fleet_aircraft(id) on delete cascade not
null,
inspection_type inspection_type_enum not null,
date_performed date not null,
airframe_hours_at_inspection numeric(7,2) not null,
next_due_date date, -- Calculated or manual (Annual = +12 calendar months)
next_due_hours numeric(7,2), -- Calculated or manual (100 Hr = Current +100)
is_completed boolean not null default true,
notes text,
sign_off_mechanic text not null
);


create policy "Allow public read on fleet_aircraft" on fleet_aircraft for select using (true);
create policy "Allow public read on notification_compliance" on notification_compliance for select using (true);
create policy "Allow public read on inspections" on inspections for select using (true);

create or replace function public.link_new_notification_to_fleet()
returns trigger as $$
begin
-- Find all tail numbers that match either the aircraft model or engine
model of the notice
insert into public.notification_compliance (fleet_aircraft_id,
notification_id, status)
select fa.id, new.id, 'Pending'
from public.fleet_aircraft fa
join public.aircraft_models am on fa.aircraft_model_id = am.id
where am.id = new.aircraft_model_id or am.engine_model_id =
new.engine_model_id
on conflict (fleet_aircraft_id, notification_id) do nothing;
return new;
end;
$$ language plpgsql;

create trigger on_new_notification_published
after insert on public.notifications
for each row execute function public.link_new_notification_to_fleet();

create or replace view fleet_notification_summary as
select 
  fa.id as fleet_aircraft_id,
  fa.registration_number,
  count(case when n.type = 'Safety Alert' then 1 end) as total_safety_alerts,
  count(case when n.type = 'Service Bulletin' then 1 end) as total_service_bulletins,
  count(case when nc.status = 'Pending' then 1 end) as pending_compliance_count
from fleet_aircraft fa
left join notification_compliance nc on fa.id = nc.fleet_aircraft_id
left join notifications n on nc.notification_id = n.id
group by fa.id, fa.registration_number;
/**
// Read past work and view future parameters for physical tracking limits
const { data: inspectionHistory, error } = await supabase
.from('inspections')
.select('inspection_type, date_performed, airframe_hours_at_inspection,
next_due_date, next_due_hours')
.eq('fleet_aircraft_id', 'YOUR_FLEET_AIRCRAFT_UUID')
.order('date_performed', { ascending: false });
**/

ALTER TABLE manufacturers 
DROP COLUMN IF EXISTS maintenance_doc_url; -- Adjust name if it was slightly different

CREATE TABLE maintenance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    aircraft_model_id UUID NOT NULL,
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    
    -- This links the document to your existing aircraft_models table
    CONSTRAINT fk_aircraft_model
        FOREIGN KEY (aircraft_model_id) 
        REFERENCES aircraft_models(id) 
        ON DELETE CASCADE
);

create policy "Allow public read on maintenance_documents" on maintenance_documents for select using (true);
