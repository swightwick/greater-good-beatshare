const links = [
  { label: "Instagram", href: "https://instagram.com/greater_good" },
  { label: "SoundCloud", href: "https://soundcloud.com/greatergoodbeats" },
  { label: "Spotify", href: "https://open.spotify.com/artist/3mqAQkve4Njy0QFTaeutdM?si=UZxso4thRqGaLE4mT_7l5Q" },
  { label: "YouTube", href: "https://www.youtube.com/channel/UClKVrqHhEqXnf7h3nPOy6dA" },
];

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-row justify-center gap-4 md:gap-6 ${className}`}>
      {links.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] md:text-xs font-medium uppercase tracking-[3px] text-gold hover:text-gold-hover transition-colors"
        >
          {label}
        </a>
      ))}
    </div>
  );
}
