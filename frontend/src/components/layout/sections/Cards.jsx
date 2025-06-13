import React from "react";
import {MagnifyingGlassIcon, MapPinIcon, MusicalNoteIcon} from "@heroicons/react/24/solid";

const cards = [
  {
    title: "Cerca per mood",
    text: "Seleziona il tuo stato d'animo attuale e scopri opere d'arte e luoghi culturali che risuonano con te.",
    color: "blue",
    icon: MagnifyingGlassIcon
  },
  {
    title: "Connessioni musicali",
    text: "Scopri opere d'arte che si collegano ai tuoi generi musicali preferiti attraverso connessioni culturali uniche.",
    color: "purple",
    icon: MusicalNoteIcon
  },
  {
    title: "Esplora la mappa",
    text: "Visualizza musei, gallerie ed eventi culturali sulla mappa e pianifica il tuo percorso artistico.",
    color: "green",
    icon: MapPinIcon
  }
]

const Cards = () => {
  return (
    <section className='relative mb-20'>
      <div className="container mx-auto text-zinc-900">
        <h2 className='font-bold text-3xl mb-10'>Come funziona MUSA</h2>
        <div className="grid md:grid-cols-3 gap-4 lg:gap-8">
          {cards.map((e, i) => {
            const Icon = e.icon;
            return (
              <div key={`card_${i}`} className="bg-white p-6 rounded-lg shadow-md">
                <span className={`block w-16 h-16 rounded-full bg-${e.color}-100 mb-4 flex items-center justify-center`}>
                 <Icon className={`size-8 text-${e.color}-500`} aria-hidden="true"/>
                </span>
                <h3 className='text-xl font-bold mb-2'>{e.title}</h3>
                <p className='text-zinc-600'>{e.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Cards;
