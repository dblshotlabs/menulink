import Link from "next/link";
import { PublicMenuLinkPage } from "@menulink/components/PublicMenuLinkPage.jsx";
import { menuLink } from "@/lib/services";
import { requirePageAuth } from "@/lib/session";
export default function Preview({ data }) {
  return (
    <>
      <nav className="bg-stone-900 px-4 py-3 text-white">
        <Link href="/dashboard/menulink">
          Back to editor · saved draft preview
        </Link>
      </nav>
      <PublicMenuLinkPage data={data} />
    </>
  );
}
export async function getServerSideProps(context) {
  const current = await requirePageAuth(context);
  if (current.redirect) return current;
  const data = await menuLink.getOrCreateMenuLinkSite(current.merchant);
  return { props: { data: JSON.parse(JSON.stringify(data)) } };
}
