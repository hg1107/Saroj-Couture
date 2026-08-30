import type { Metadata } from "next";
import { getCategories } from "@/lib/queries/categories";
import { BUSINESS, CONTACT, SEO } from "@/lib/utils/constants";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFab from "@/components/WhatsAppFab";

export const metadata: Metadata = {
  title: "Contact & Atelier Location — Saroj Couture | Nagpur",
  description: "Visit or contact Saroj Couture in Teka Naka, Kamptee Road, Nagpur. Book a custom fitting consultation or enquire on WhatsApp.",
  openGraph: {
    title: "Contact & Atelier Location — Saroj Couture | Nagpur",
    description: "Visit or contact Saroj Couture in Teka Naka, Kamptee Road, Nagpur. Book a custom fitting consultation or enquire on WhatsApp.",
    url: `${SEO.siteUrl}/contact`,
  },
};

export default async function ContactPage() {
  const categories = await getCategories();
  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi Saroj Couture, I would like to enquire about an appointment or custom stitching.")}`;

  return (
    <>
      <SiteHeader categories={categories} />

      <main className="w-full max-w-[1000px] mx-auto px-margin-mobile md:px-margin-desktop pb-section-gap pt-10 mt-16 flex flex-col gap-12">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center max-w-xl mx-auto pt-4">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-widest font-medium mb-2">
            Get in Touch
          </span>
          <h1 className="font-serif text-3xl md:text-4xl text-primary font-normal mb-3">
            Visit &amp; Contact Our Atelier
          </h1>
          <div className="w-16 h-px bg-outline-variant mb-4" aria-hidden="true" />
          <p className="font-sans text-sm md:text-base text-on-surface-variant leading-relaxed">
            We welcome personal consultations and bespoke fitting inquiries. Reach out directly or visit our studio in Nagpur.
          </p>
        </div>

        {/* ── Contact Cards Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Direct Contact */}
          <div className="bg-surface-container-low border border-outline-variant rounded-sm p-8 flex flex-col gap-6">
            <h2 className="font-serif text-2xl text-primary font-normal border-b border-outline-variant pb-3">
              Direct Contact
            </h2>

            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">chat</span>
                <div>
                  <h3 className="font-label-lg text-sm text-primary font-medium uppercase tracking-wider">WhatsApp</h3>
                  <p className="font-sans text-sm text-on-surface-variant mb-2">Instant design discussion &amp; photo exchange</p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xs hover:opacity-90 transition-opacity"
                  >
                    <span>Message on WhatsApp</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-outline-variant/50">
                <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">call</span>
                <div>
                  <h3 className="font-label-lg text-sm text-primary font-medium uppercase tracking-wider">Phone Call</h3>
                  <p className="font-sans text-sm text-on-surface-variant mb-1">Direct boutique phone line</p>
                  <a
                    href={`tel:${CONTACT.phone}`}
                    className="font-serif text-lg text-secondary hover:underline"
                  >
                    {CONTACT.phone}
                  </a>
                </div>
              </div>

              {CONTACT.instagram && (
                <div className="flex items-start gap-4 pt-4 border-t border-outline-variant/50">
                  <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">photo_camera</span>
                  <div>
                    <h3 className="font-label-lg text-sm text-primary font-medium uppercase tracking-wider">Instagram</h3>
                    <p className="font-sans text-sm text-on-surface-variant mb-1">Follow our latest custom creations</p>
                    <a
                      href={CONTACT.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-base text-secondary hover:underline"
                    >
                      {CONTACT.instagramHandle}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Atelier Location & Hours */}
          <div className="bg-surface-container-low border border-outline-variant rounded-sm p-8 flex flex-col gap-6">
            <h2 className="font-serif text-2xl text-primary font-normal border-b border-outline-variant pb-3">
              Atelier Location &amp; Hours
            </h2>

            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">location_on</span>
                <div>
                  <h3 className="font-label-lg text-sm text-primary font-medium uppercase tracking-wider">Address</h3>
                  <p className="font-serif text-lg text-primary mt-1">
                    {BUSINESS.name}
                  </p>
                  <p className="font-sans text-sm text-on-surface-variant leading-relaxed mt-0.5">
                    {BUSINESS.locality}<br />
                    {BUSINESS.city}, {BUSINESS.state} — {BUSINESS.postalCode}<br />
                    {BUSINESS.country}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-outline-variant/50">
                <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">schedule</span>
                <div>
                  <h3 className="font-label-lg text-sm text-primary font-medium uppercase tracking-wider">Consultation Hours</h3>
                  <p className="font-sans text-sm text-on-surface-variant mt-1">
                    <strong className="text-primary">Monday – Saturday:</strong> 10:00 AM – 7:00 PM<br />
                    <strong className="text-primary">Sunday:</strong> By Prior Appointment
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/50">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${BUSINESS.locality}, ${BUSINESS.city}, ${BUSINESS.state} ${BUSINESS.postalCode}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-secondary text-on-secondary font-label-lg text-xs uppercase tracking-widest py-3 rounded-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <span>Open in Google Maps (Nagpur)</span>
                  <span className="material-symbols-outlined text-sm">map</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
