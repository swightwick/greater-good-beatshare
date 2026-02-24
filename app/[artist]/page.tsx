import BeatShareApp from "../components/BeatShareApp";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ artist: string }>;
}) {
  const { artist } = await params;
  return <BeatShareApp slug={artist} />;
}
