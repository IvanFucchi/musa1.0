import MapPins from "@/components/common/MapPins";
import MapPinList from "@/components/common/MapPinList";
import { useSearchParams } from 'react-router-dom';
import {useEffect, useState} from "react";
import {useGlobalState} from "@/context/GlobalState";

const ExplorePage = () => {
  const { place, activity } = useGlobalState();

  const [searchParams, setSearchParams] = useSearchParams();
  const [pinsData, setPinsData] = useState([]);

  useEffect(() => {
    const p = searchParams.get('place');
    const a = searchParams.get('activity');

    if (p || a) {
      console.log('Parametri URL:', { p, a });
    }
  }, [searchParams]);


  useEffect(() => {
    if (!place?.trim() || !activity?.trim()) return;

    console.log('Global state cambiato:', { place, activity });

    const newPins = [
      {
        id: 1,
        title: 'Colosseo',
        description: 'Antico anfiteatro romano nel centro di Roma.',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/960px-Colosseo_2020.jpg',
        position: {lat: 41.8902, lng: 12.4922}
      },
      {
        id: 2,
        title: 'Fontana di Trevi',
        description: 'Famosa fontana barocca, una delle attrazioni più popolari di Roma.',
        imageUrl: 'https://www.romasegreta.it/krlcrt/wp-content/uploads/2025/05/fontana-di-trevi.jpg',
        position: {lat: 41.9009, lng: 12.4833}
      },
      {
        id: 3,
        title: 'Foro Romano',
        description: 'Complesso di rovine che un tempo era il centro della vita pubblica romana.',
        imageUrl: 'https://biglietti.roma.it/wp-content/uploads/sites/131/foro-romano-rovine-hd.jpg',
        position: {lat: 41.8925, lng: 12.4853}
      },
    ];
    setPinsData(newPins);
  }, [place, activity]);


  const data = [
    {
      id: 1,
      title: 'Colosseo',
      description: 'Antico anfiteatro romano nel centro di Roma.',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/960px-Colosseo_2020.jpg',
      position: {lat: 41.8902, lng: 12.4922}
    },
    {
      id: 2,
      title: 'Fontana di Trevi',
      description: 'Famosa fontana barocca, una delle attrazioni più popolari di Roma.',
      imageUrl: 'https://www.romasegreta.it/krlcrt/wp-content/uploads/2025/05/fontana-di-trevi.jpg',
      position: {lat: 41.9009, lng: 12.4833}
    },
    {
      id: 3,
      title: 'Foro Romano',
      description: 'Complesso di rovine che un tempo era il centro della vita pubblica romana.',
      imageUrl: 'https://biglietti.roma.it/wp-content/uploads/sites/131/foro-romano-rovine-hd.jpg',
      position: {lat: 41.8925, lng: 12.4853}
    },
  ];

  return (
    <section className="w-full h-[calc(100vh-82px)] flex">
      <div className="container mx-auto py-4 flex flex-wrap h-full">
        <div className="flex w-full lg:w-1/2">
          <MapPinList pinsData={data}/>
        </div>
        <div className="flex w-full lg:w-1/2 rounded-lg overflow-hidden">
          <MapPins pinsData={data}/>
        </div>
      </div>
    </section>
  );
};

export default ExplorePage;
