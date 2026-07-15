import Script from "next/script";

// GA4 + LinkedIn Insight Tag (10-TECH §9). Both load via next/script afterInteractive and render
// ONLY when their NEXT_PUBLIC id is present — so dev/preview (empty env) ships zero analytics and
// keeps DebugView clean. Ids are public measurement/partner ids by design (never secrets).
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
  const liId = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
          </Script>
        </>
      ) : null}

      {liId ? (
        <>
          <Script id="linkedin-init" strategy="afterInteractive">
            {`_linkedin_partner_id = "${liId}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);`}
          </Script>
          <Script id="linkedin-insight" strategy="afterInteractive">
            {`(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}
var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");
b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b,s);})(window.lintrk);`}
          </Script>
          <noscript>
            {/* LinkedIn 1x1 tracking pixel — a noscript fallback, not a content image; next/image N/A. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://px.ads.linkedin.com/collect/?pid=${liId}&fmt=gif`}
            />
          </noscript>
        </>
      ) : null}
    </>
  );
}
