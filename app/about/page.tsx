'use client'

import Header from '../components/Header'
import Footer from '@/app/components/Footer'

const OBJECTIVES: { id: string; text: string }[] = [
  {
    id: 'a',
    text: 'To Initiate Dialogue with the Office of the President of Zimbabwe to remind the Office about the Presidential commitment to the Diaspora Vote made on the side lines of the United Nations General Conference in 2018;',
  },
  {
    id: 'b',
    text: 'To Appeal to the Parliament of Zimbabwe to make legislative changes that allow Zimbabwean citizens living abroad to cast their vote from their domiciled countries;',
  },
  {
    id: 'c',
    text: 'To create awareness among Zimbabweans living outside Zimbabwe on the need for the fulfilment of their constitutional right to vote, and join hands in lobbying for the right of citizens living outside Zimbabwe to vote;',
  },
  {
    id: 'd',
    text: 'To work with all other initiatives working to achieve the diaspora vote for Zimbabweans living abroad;',
  },
  {
    id: 'e',
    text: 'To create awareness among Zimbabweans living in Zimbabwe on how the absence of the Diaspora Vote takes away the voting rights of their family members and friends living abroad;',
  },
  {
    id: 'f',
    text: 'To appeal to businesses benefiting from Diaspora remittances to support the call by the citizens abroad who bankroll their businesses;',
  },
  {
    id: 'g',
    text: 'To appeal to regional, continental and international organisations which Zimbabwe is affiliated to, to encourage Zimbabwean authorities to implement the Diaspora vote for Zimbabwean citizens living abroad;',
  },
  {
    id: 'h',
    text: 'To mobilize resources to sustain the work of the Diaspora Vote lobby;',
  },
  {
    id: 'i',
    text: 'To use the media as a tool to communicate the diaspora vote message;',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-10 text-white sm:pb-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">About</p>
          <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">Zimbabwe Diaspora Vote Initiative</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">ZDVI</p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            A voluntary grouping of Zimbabweans in the diaspora advocating for full electoral inclusion and
            participation in national governance.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-6 text-sm leading-relaxed text-slate-700 sm:text-base">
              <p>
                The Zimbabwe Diaspora Vote Initiative (ZDVI) is a voluntary grouping of Zimbabweans living abroad
                concerned with the lack of provision arrangements that allow them to vote from their domiciled countries in
                elections that take place in Zimbabwe, and their exclusion from governance issues relating to their
                country. Currently, only diplomats and government employees on external missions can vote, despite the
                constitution granting voting rights to all Zimbabweans.
              </p>
              <p>
                The ZDVI came into being in 2022, and registered as a Community Group in Australia under Australian
                Business Number 14608339944. It hopes to register in other countries in due course.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Mission and Vision</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-bold text-dv-navy sm:text-lg">Our Mission</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                  To advocate for legislative, policy, and administrative reforms that enable Zimbabwean citizens living
                  abroad to vote from their countries of residence, and to mobilise collective action in defence of
                  constitutional rights.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-bold text-dv-navy sm:text-lg">Our Vision</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                  A democratic Zimbabwe where all citizens—regardless of location—fully participate in electoral processes
                  and national governance.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              The objectives of the organisation as stated in its articles of association are:
            </h2>
            <ol className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
              {OBJECTIVES.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-lg bg-slate-50 px-4 py-3">
                  <span className="shrink-0 font-semibold text-dv-navy">{item.id})</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-dv-navy/15 bg-dv-sky/35 p-6 shadow-sm sm:p-8">
            <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
              ZDVI invites all Zimbabweans living in the Diaspora to actively support all efforts to lobby for the
              Diaspora Vote to ensure fulfilment of the democratic right to vote. The more the merrier. Our collective
              efforts will deliver the desired results.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
