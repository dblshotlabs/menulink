import Link from "next/link";
export default function Home() {
  return (
    <main className="mx-auto grid max-w-xl gap-6 px-5 py-16">
      <h1 className="text-4xl font-semibold">MenuLink</h1>
      <p className="text-lg">
        Your cafe or food truck’s menu, links, and honest review requests in one
        simple page.
      </p>
      <Link
        className="rounded-xl bg-stone-900 px-5 py-3 text-center text-white"
        href="/dashboard/menulink"
      >
        Manage your page
      </Link>
      <Link className="text-center underline" href="/demo">
        View an example cafe page
      </Link>
    </main>
  );
}
