import Head from "next/head";
import { PublicMenuLinkPage } from "@menulink/components/PublicMenuLinkPage.jsx";
import { menuLink } from "@/lib/services";
export default function Page({ data }) {
  return (
    <>
      <Head>
        <title>{data.site.seoTitle || `${data.site.displayName} Menu`}</title>
        <meta
          name="description"
          content={data.site.seoDescription || data.site.bio}
        />
      </Head>
      <PublicMenuLinkPage data={data} />
    </>
  );
}
export async function getServerSideProps(context) {
  const data = await menuLink.getPublishedMenuLinkSiteBySlug(
    context.params.slug
  );
  return data
    ? { props: { data: JSON.parse(JSON.stringify(data)) } }
    : { notFound: true };
}
