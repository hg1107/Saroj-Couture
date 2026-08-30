import { redirect } from "next/navigation";

// /admin → redirect to /admin/garments (the real dashboard)
export default function AdminPage() {
  redirect("/admin/garments");
}
