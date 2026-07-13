import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split("\n").filter(l=>l.includes("=")&&!l.trim().startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,"")];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const EMAIL="admin-t2@acta.local", PASS="TestAdmin123!";
const { data: ex } = await sb.from("admin_users").select("user_id").eq("email",EMAIL).maybeSingle();
if (ex){ await sb.from("admin_users").delete().eq("email",EMAIL); await sb.auth.admin.deleteUser(ex.user_id).catch(()=>{}); }
const { data } = await sb.auth.admin.createUser({ email:EMAIL, password:PASS, email_confirm:true });
await sb.from("admin_users").insert({ user_id:data.user.id, email:EMAIL, display_name:"Test Admin 2", role:"admin", is_active:true });
console.log("temp admin created:", EMAIL);
