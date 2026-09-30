-- Scholarship Monitoring System schema (run in Supabase SQL Editor)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('admin','staff','scholar'))
);

create table scholarship_programs (
  id bigint generated always as identity primary key,
  program_name text not null unique,
  required_gwa numeric(3,2) not null check (required_gwa between 1 and 5), -- max allowed GWA (1.0 best)
  min_units int not null check (min_units >= 0),
  allow_failing_grade boolean not null default false,
  active boolean not null default true
);

create table scholars (
  id bigint generated always as identity primary key,
  student_id text not null unique check (length(trim(student_id)) > 0),
  full_name text not null,
  degree_program text,
  year_level int check (year_level between 1 and 6),
  scholarship_id bigint not null references scholarship_programs(id),
  status text not null default 'Active'
);

create table grade_submissions (
  id bigint generated always as identity primary key,
  scholar_id bigint not null references scholars(id),
  academic_year text not null,
  semester text not null,
  gwa numeric(3,2) not null check (gwa between 1 and 5),
  units_enrolled int not null check (units_enrolled >= 0),
  failed_subjects int not null default 0 check (failed_subjects >= 0),
  incomplete_subjects int not null default 0 check (incomplete_subjects >= 0),
  submission_status text not null default 'Pending' check (submission_status in ('Pending','Verified','Returned')),
  evaluation_result text,
  submitted_at timestamptz not null default now(),
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  unique (scholar_id, academic_year, semester)   -- BR-03
);

-- auto-create profile on signup
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles(id, full_name) values (new.id, new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create function public.is_staff() returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','staff')) $$;

-- Row Level Security (BR-04, BR-10)
alter table profiles enable row level security;
alter table scholarship_programs enable row level security;
alter table scholars enable row level security;
alter table grade_submissions enable row level security;

create policy "own profile" on profiles for select using (id = auth.uid());
create function public.is_admin() returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;
create policy "staff read programs" on scholarship_programs for select using (is_staff());
create policy "admin manage programs" on scholarship_programs for all using (is_admin()) with check (is_admin());
create policy "staff all scholars" on scholars for all using (is_staff()) with check (is_staff());
create policy "staff all submissions" on grade_submissions for all using (is_staff()) with check (is_staff());

-- sample rules (different GWA per program)
insert into scholarship_programs(program_name, required_gwa, min_units, allow_failing_grade) values
 ('Academic Excellence Grant', 1.75, 18, false),
 ('Government Scholarship', 2.50, 15, false),
 ('Private Sponsor Grant', 3.00, 12, true);
