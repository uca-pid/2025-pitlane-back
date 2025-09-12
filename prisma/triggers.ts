import postgres from "postgres";
import "dotenv/config";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("Couldn't find db url");
}
const sql = postgres(dbUrl);

async function main() {
  // Function: handle new user → insert into Profile
  await sql`
    create or replace function public.handle_new_user()
    returns trigger as $$
    begin
        begin
            insert into public."Profile" (id)
            values (new.id);
        exception when others then
            raise notice 'handle_new_user failed for user %, error: %', new.id, SQLERRM;
        end;
        return new;
    end;
    $$ language plpgsql security definer;
  `;

  // Trigger: after insert on auth.users
  await sql`
    create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute procedure public.handle_new_user();
  `;

  // Function: handle profile delete → delete user
  await sql`
    create or replace function public.handle_user_delete()
    returns trigger as $$
    begin
        begin
            delete from auth.users where id = old.id;
        exception when others then
            raise notice 'handle_user_delete failed for profile %, error: %', old.id, SQLERRM;
        end;
        return old;
    end;
    $$ language plpgsql security definer;
  `;

  // Trigger: after delete on Profile
  await sql`
    create or replace trigger on_Profile_user_deleted
    after delete on public."Profile"
    for each row
    execute procedure public.handle_user_delete();
  `;

  console.log("✅ Finished creating functions and triggers.");
  process.exit();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
