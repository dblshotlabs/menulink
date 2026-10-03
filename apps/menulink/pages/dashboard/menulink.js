import { MenuLinkEditor } from "@menulink/components/MenuLinkEditor.jsx";
import { menuLink } from "@/lib/services";
import { requirePageAuth } from "@/lib/session";
import { loadConfig } from "@/lib/config";
export default function Dashboard({ data, appUrl }) {
  async function signOut() {
    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (response.ok) window.location.assign("/login");
  }
  return (
    <div className="mx-auto max-w-7xl p-4">
      <nav className="mb-4 flex justify-end">
        <button onClick={signOut} className="rounded-xl border px-4 py-2">
          Sign out
        </button>
      </nav>
      <MenuLinkEditor
        initialData={data}
        publicUrl={`${appUrl}/menulink/${data.site.slug}`}
        selfHosted
      />
    </div>
  );
}
export async function getServerSideProps(context) {
  const current = await requirePageAuth(context);
  if (current.redirect) return current;
  const data = await menuLink.getOrCreateMenuLinkSite(current.merchant);
  return {
    props: {
      data: JSON.parse(JSON.stringify(data)),
      appUrl: loadConfig().appUrl,
    },
  };
}
