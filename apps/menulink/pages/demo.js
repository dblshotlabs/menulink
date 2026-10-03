import Head from "next/head";
import { PublicMenuLinkPage } from "@menulink/components/PublicMenuLinkPage.jsx";
import { demoData } from "@menulink/demo.js";
export default function Demo() {
  return (
    <>
      <Head>
        <title>MenuLink · fictional cafe example</title>
        <meta name="robots" content="noindex" />
      </Head>
      <p className="bg-stone-900 p-3 text-center text-sm text-white">
        Fictional cafe · MenuLink example
      </p>
      <PublicMenuLinkPage data={demoData} />
      <aside id="demo-review" className="bg-stone-100 p-6 text-center">
        Example review link. Replace it with your cafe’s public review URL in
        the editor.
      </aside>
    </>
  );
}
