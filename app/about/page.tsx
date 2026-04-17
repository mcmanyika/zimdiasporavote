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
    <main className="min-h-screen bg-white text-slate-900">
      <Header />

      <section className="bg-gradient-to-r from-slate-900 to-slate-800 pt-24 pb-10 text-white sm:pb-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">About</p>
          <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">Zimbabwe Diaspora Vote Initiative</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">ZDVI</p>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
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

          <h2 className="mt-10 text-lg font-bold text-slate-900 sm:text-xl">
            The objectives of the organisation as stated in its articles of association are:
          </h2>
          <ol className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
            {OBJECTIVES.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="shrink-0 font-semibold text-dv-navy">{item.id})</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ol>

          <div className="mt-10 space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
            <p>
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
