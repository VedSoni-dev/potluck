import Link from "next/link";
import { PublikPitch } from "@/components/PublikGate";

const works = [
  ["Ask for a tool", "“@potluck build us a dinner poll” turns one sentence into a ready tool with your group’s names filled in."],
  ["Seating chart", "Drag friends between rooms or tables. Full tables refuse the drop."],
  ["Polls", "One tap to vote, live bars, the leader marked."],
  ["Expense split", "Log who paid; it works out who owes whom, to the cent."],
  ["Brackets, itineraries, checklists", "Single elimination with byes, timed day plans, who-brings-what."],
  ["Share by link", "The whole space packs into the link itself. Nothing is stored on a server."],
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#0b0a09] text-[#f4f2ee]">
      <div className="mx-auto max-w-[1080px] px-5">
        <header className="flex items-center justify-between py-6">
          <span className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight">
            <img src="/icon.svg" alt="" className="h-7 w-7" /> potluck
          </span>
          <a href="https://x.com/forkthis_ai" className="text-sm text-[#9a958c] hover:text-[#f4f2ee]">built by @forkthis_ai</a>
        </header>

        <h1 className="mt-12 text-[clamp(44px,7.5vw,88px)] font-extrabold leading-[0.98] tracking-[-0.045em]">
          plan anything<br />with your <span className="text-[#9c87ff]">group.</span>
        </h1>
        <p className="mt-5 max-w-[640px] text-[clamp(18px,2.2vw,21px)] text-[#9a958c]">
          A shared space where your friends drop links and notes, and an AI builds the tools you need from one sentence:
          polls, expense splits, brackets, drag-and-drop seating charts. Free and open source.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="rounded-full bg-[#9c87ff] px-5 py-3 font-semibold text-[#0b0a09] hover:brightness-110">Open potluck →</Link>
          <a href="https://publikhq.com/potluck" className="rounded-full border border-[#26231f] px-5 py-3 font-semibold hover:brightness-125">Get it on publik</a>
          <a href="https://github.com/VedSoni-dev/potluck" className="rounded-full border border-[#26231f] px-5 py-3 font-semibold hover:brightness-125">View on GitHub</a>
        </div>

        <div className="mt-11 aspect-video overflow-hidden rounded-[18px] border border-[#26231f] bg-black">
          <video src="/potluck.mp4" poster="/poster.png" className="h-full w-full" controls playsInline muted autoPlay loop preload="metadata" />
        </div>

        <section className="mt-11 rounded-2xl border border-[#26231f] bg-[#14120f] p-6">
          <h2 className="mb-3 text-2xl font-bold tracking-tight">Free, because of publik</h2>
          <PublikPitch appName="potluck" className="text-[15px] leading-relaxed text-[#c9c4bb] [&_a]:underline [&_p]:mb-3 [&_.pk-pitch-cta]:font-semibold [&_.pk-pitch-cta]:text-[#9c87ff] [&_.pk-pitch-cta]:no-underline" />
        </section>

        <section className="mt-11 border-t border-[#26231f] pt-11">
          <h2 className="mb-5 text-[28px] font-bold tracking-tight">What works</h2>
          <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            {works.map(([t, d]) => (
              <div key={t} className="rounded-[14px] border border-[#26231f] bg-[#14120f] p-[18px]">
                <b className="mb-1 block">{t}</b>
                <p className="m-0 text-[15px] text-[#9a958c]">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8"><Link href="/app" className="rounded-full bg-[#9c87ff] px-5 py-3 font-semibold text-[#0b0a09]">Open potluck →</Link></div>
        </section>

        <footer className="mt-11 border-t border-[#26231f] py-10 text-sm text-[#9a958c]">
          potluck is a free, open-source alternative to Google Tabletop, written from public information. Not affiliated with Google.
          Built start to finish by <a className="underline" href="https://x.com/forkthis_ai">@forkthis_ai</a>, an AI that open-sources software.
        </footer>
      </div>
    </main>
  );
}
