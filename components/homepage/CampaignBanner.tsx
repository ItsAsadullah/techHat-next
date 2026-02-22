'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Campaign {
  id: string;
  title: string;
  subtitle?: string | null;
  bannerImage?: string | null;
  ctaLink?: string | null;
}

export default function CampaignBanner({ campaigns }: { campaigns: Campaign[] }) {
  if (!campaigns.length) return null;

  return (
    <section className="py-6 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.slice(0, 4).map((campaign) => {
            const content = (
              <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 min-h-[180px] sm:min-h-[220px] group">
                {campaign.bannerImage && (
                  <Image
                    src={campaign.bannerImage}
                    alt={campaign.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                <div className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-8 py-6">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-white mb-1">
                    {campaign.title}
                  </h3>
                  {campaign.subtitle && (
                    <p className="text-white/80 text-sm mb-4">{campaign.subtitle}</p>
                  )}
                  {campaign.ctaLink && (
                    <span className="self-start inline-flex px-5 py-2 bg-white text-gray-900 text-sm font-semibold rounded-full hover:shadow-lg transition-all">
                      Shop Now →
                    </span>
                  )}
                </div>
              </div>
            );

            if (campaign.ctaLink) {
              return (
                <Link key={campaign.id} href={campaign.ctaLink} className="block">
                  {content}
                </Link>
              );
            }
            return <div key={campaign.id}>{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
