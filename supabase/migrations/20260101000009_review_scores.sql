-- review_id hem birincil anahtar hem de yabancı anahtardır: her review
-- tam olarak bir puanlama satırına sahiptir (1-1 ilişki), bu yüzden ayrı
-- bir uuid id sütununa gerek yoktur.
create table review_scores (
  review_id uuid primary key references reviews (id) on delete cascade,
  incentive_score smallint not null check (incentive_score between 1 and 5),
  colleague_score smallint not null check (colleague_score between 1 and 5),
  management_score smallint not null check (management_score between 1 and 5),
  city_score smallint not null check (city_score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table review_scores is
  'Her review için 1-1 puanlama satırı, 1-5 arası. review_id hem PK hem FK olduğundan ayrı id sütunu yoktur.';

create trigger set_review_scores_updated_at
  before update on review_scores
  for each row
  execute function set_updated_at();
